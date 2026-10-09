const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');
const Referral = require('../models/Referral');

const JWT_SECRET = process.env.JWT_SECRET || 'gramin_arogya_secure_sih_2026_jwt_token_key';

// In-memory OTP store for patient profile verification (10-minute expiry)
const patientOtpStore = new Map(); // userId -> { otp, expiresAt, email }

// Active SSE client streams for real-time live events (prescriptions, visits, vitals)
const sseClients = new Map(); // connectionId -> { res, userId, phone, patientId }

/**
 * Helper: Decode auth token and return userId + username
 */
const decodeToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const verified = jwt.verify(token, JWT_SECRET);
      if (verified && verified.id) return verified;
    } catch {}
  }
  if (req.query && req.query.token) {
    try {
      const verified = jwt.verify(req.query.token, JWT_SECRET);
      if (verified && verified.id) return verified;
    } catch {}
  }
  if (req.user && (req.user.id || req.user._id)) {
    return { id: req.user.id || req.user._id };
  }
  return null;
};

/**
 * GET /api/patient/live-stream
 * Server-Sent Events (SSE) persistent stream for instant real-time prescription & record delivery
 */
exports.subscribePatientLiveEvents = (req, res) => {
  const decoded = decodeToken(req);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (res.flushHeaders) res.flushHeaders();

  const clientId = `${decoded.id}_${Date.now()}_${Math.random()}`;
  const phone = (req.query.phone || '').replace(/\D/g, '').slice(-10);
  const patientId = req.query.patientId || '';

  sseClients.set(clientId, { res, userId: decoded.id.toString(), phone, patientId });

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId })}\n\n`);

  const keepAlive = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(keepAlive);
      sseClients.delete(clientId);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(clientId);
  });
};

/**
 * Global Real-Time Event Broadcaster to connected Patient Clients
 */
exports.broadcastToPatient = (criteria, eventData) => {
  sseClients.forEach((client, clientId) => {
    try {
      let match = false;
      if (!criteria) {
        match = true;
      } else {
        const { userId, phone, patientId } = criteria;
        if (userId && client.userId && client.userId.toString() === userId.toString()) match = true;
        if (patientId && client.patientId && client.patientId === patientId) match = true;
        if (phone && client.phone) {
          const cClean = client.phone.replace(/\D/g, '').slice(-10);
          const pClean = String(phone).replace(/\D/g, '').slice(-10);
          if (cClean && pClean && (cClean.includes(pClean) || pClean.includes(cClean))) match = true;
        }
        // If neither matched specifically but client is active, send broadcast
        if (!userId && !phone && !patientId) match = true;
      }

      if (match) {
        client.res.write(`data: ${JSON.stringify(eventData)}\n\n`);
      }
    } catch {
      sseClients.delete(clientId);
    }
  });
};

/**
 * GET /api/patient/profile
 * patient fetches their own Patient profile from DB.
 * Returns both User record fields AND Patient clinical record.
 */
exports.getMyProfile = async (req, res) => {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prioritize lookup by userId first for exact account linkage
    let patient = await Patient.findOne({ userId: user._id });

    const cleanPhone = (user.phone || '').replace(/\D/g, '').slice(-10);
    const patId = `PAT-${cleanPhone.slice(-6) || user._id.toString().slice(-6).toUpperCase()}`;

    if (!patient) {
      const orConditions = [{ id: patId }];
      if (cleanPhone && cleanPhone.length >= 6) {
        orConditions.push({ phone: { $regex: cleanPhone } });
      }
      patient = await Patient.findOne({ $or: orConditions });
      if (patient && !patient.userId) {
        patient.userId = user._id;
        await patient.save();
      }
    }

    if (!patient) {
      // Auto-initialize a linked Patient record for this registered citizen so they immediately have an ID, SSC, ABHA, and QR
      const cleanId = cleanPhone.slice(-6) || user._id.toString().slice(-6).toUpperCase();
      const abhaDigits = cleanPhone.slice(-4) || '1044';
      let computedAge = 28;
      if (user.dateOfBirth) {
        const dob = new Date(user.dateOfBirth);
        const today = new Date();
        computedAge = today.getFullYear() - dob.getFullYear();
      }

      patient = new Patient({
        id: patId,
        userId: user._id,
        name: user.name || 'Citizen Patient',
        age: computedAge,
        gender: user.gender || 'Female',
        village: user.village || 'Rural Health Block',
        phone: user.phone || cleanPhone,
        bloodGroup: user.bloodGroup || 'B+',
        emergencyContact: user.emergencyContact || '',
        abhaId: `91-${abhaDigits}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        chiefComplaint: 'Routine Healthcare Continuity',
        riskLevel: 'LOW',
        qrToken: `SEC-QR-${cleanId}-${Math.floor(1000 + Math.random() * 9000)}`,
        sscCode: `SSC-GJ-2026-${Math.floor(100000 + Math.random() * 900000)}`
      });
      await patient.save();
    } else {
      let needsSave = false;
      if (!patient.userId) {
        patient.userId = user._id;
        needsSave = true;
      }
      if (!patient.qrToken) {
        const cleanId = (patient.id || '').replace(/\D/g, '').slice(-6) || Math.floor(100000 + Math.random() * 900000);
        patient.qrToken = `SEC-QR-${cleanId}-${Math.floor(1000 + Math.random() * 9000)}`;
        needsSave = true;
      }
      if (!patient.sscCode) {
        patient.sscCode = `SSC-GJ-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        needsSave = true;
      }
      if (!patient.abhaId) {
        const abhaDigits = (patient.phone || '').slice(-4) || '1044';
        patient.abhaId = `91-${abhaDigits}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
        needsSave = true;
      }
      if (!patient.bloodGroup && user.bloodGroup) {
        patient.bloodGroup = user.bloodGroup;
        needsSave = true;
      }
      if (needsSave) {
        await patient.save();
      }
    }

    // Sync & merge medical history from multiple records or MedicalRecord collection if any
    let historyChanged = false;
    if (cleanPhone && cleanPhone.length >= 6) {
      try {
        const otherPatients = await Patient.find({
          _id: { $ne: patient._id },
          $or: [
            { phone: { $regex: cleanPhone } },
            { id: patId }
          ]
        });

        for (const other of otherPatients) {
          if (Array.isArray(other.medicalHistory) && other.medicalHistory.length > 0) {
            if (!patient.medicalHistory) patient.medicalHistory = [];
            for (const h of other.medicalHistory) {
              const hTime = new Date(h.visitDate).getTime();
              const exists = patient.medicalHistory.some(e => {
                const eTime = new Date(e.visitDate).getTime();
                return Math.abs(hTime - eTime) < 60000 && (e.diagnosis === h.diagnosis);
              });
              if (!exists) {
                patient.medicalHistory.push(h);
                historyChanged = true;
              }
            }
          }

          if (Array.isArray(other.followUpReminders) && other.followUpReminders.length > 0) {
            if (!patient.followUpReminders) patient.followUpReminders = [];
            for (const r of other.followUpReminders) {
              const exists = patient.followUpReminders.some(e => e._id?.toString() === r._id?.toString());
              if (!exists) {
                patient.followUpReminders.push(r);
                historyChanged = true;
              }
            }
          }

          if (Array.isArray(other.fieldReports) && other.fieldReports.length > 0) {
            if (!patient.fieldReports) patient.fieldReports = [];
            for (const fr of other.fieldReports) {
              const frTime = new Date(fr.visitDate).getTime();
              const exists = patient.fieldReports.some(e => {
                const eTime = new Date(e.visitDate).getTime();
                return Math.abs(frTime - eTime) < 60000 && (e.symptoms === fr.symptoms);
              });
              if (!exists) {
                patient.fieldReports.push(fr);
                historyChanged = true;
              }
            }
          }
        }
      } catch (mergeErr) {
        console.warn('Other patient records merge note:', mergeErr.message);
      }
    }

    // Also pull from MedicalRecord collection
    try {
      const MedicalRecord = require('../models/MedicalRecord');
      const mrOr = [];
      if (patient._id) mrOr.push({ patientId: patient._id });
      if (patient.id) {
        mrOr.push({ patientId: patient.id });
        mrOr.push({ patientCode: patient.id });
      }
      if (cleanPhone && cleanPhone.length >= 6) {
        mrOr.push({ patientCode: { $regex: cleanPhone } });
      }
      const records = await MedicalRecord.find({ $or: mrOr }).sort({ visitDate: -1 });
      if (records && records.length > 0) {
        if (!patient.medicalHistory) patient.medicalHistory = [];
        for (const rec of records) {
          const recTime = new Date(rec.visitDate).getTime();
          const exists = patient.medicalHistory.some(existing => {
            const extTime = new Date(existing.visitDate).getTime();
            return Math.abs(recTime - extTime) < 60000 && (existing.diagnosis === rec.diagnosis);
          });
          if (!exists) {
            patient.medicalHistory.push({
              _id: rec._id,
              visitDate: rec.visitDate,
              visitType: rec.visitType || 'OPD Consultation',
              facilityName: rec.facilityName || 'Primary Health Centre',
              doctorName: rec.doctorName || 'Dr. Attending Physician',
              diagnosis: rec.diagnosis,
              symptoms: Array.isArray(rec.symptoms) ? rec.symptoms.join(', ') : (rec.symptoms || ''),
              prescriptions: rec.prescriptions || [],
              treatments: rec.treatments || [],
              testReports: rec.testReports || [],
              clinicalNotes: rec.clinicalNotes || '',
              vitalsAtVisit: rec.vitalsAtVisit || {}
            });
            historyChanged = true;
          }
        }
      }
    } catch (mrErr) {
      console.warn('MedicalRecord query note in getMyProfile:', mrErr.message);
    }

    // Cross-sync fieldReports into medicalHistory so ASHA visits appear seamlessly in patient visits
    if (Array.isArray(patient.fieldReports) && patient.fieldReports.length > 0) {
      if (!patient.medicalHistory) patient.medicalHistory = [];
      for (const fr of patient.fieldReports) {
        const frTime = new Date(fr.visitDate).getTime();
        const existsInMh = patient.medicalHistory.some(m => {
          const mTime = new Date(m.visitDate).getTime();
          return Math.abs(frTime - mTime) < 60000;
        });
        if (!existsInMh) {
          patient.medicalHistory.push({
            visitDate: fr.visitDate,
            visitType: 'ASHA Field Screening & Visit',
            facilityName: `${patient.village || 'Community'} Sub-Centre`,
            doctorName: fr.ashaName || 'Community ASHA Health Worker',
            diagnosis: fr.triageResult?.includes('RED') ? 'Emergency Field Triage' : fr.triageResult?.includes('YELLOW') ? 'Urgent Field Triage' : (fr.symptoms || 'Community ASHA Health Visit'),
            symptoms: fr.symptoms || fr.observations || 'Field Screening',
            clinicalNotes: fr.observations ? `Observations: ${fr.observations}${fr.notes ? ' | ' + fr.notes : ''}` : (fr.notes || 'ASHA Checkup completed.'),
            prescriptions: [],
            treatments: fr.referralRequirement ? [`Referral: ${fr.referralRequirement}`] : [],
            testReports: [],
            vitalsAtVisit: fr.vitals || {}
          });
          historyChanged = true;
        }
      }
    }

    if (patient.medicalHistory && patient.medicalHistory.length > 0) {
      patient.medicalHistory.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
    }
    if (patient.followUpReminders && patient.followUpReminders.length > 0) {
      patient.followUpReminders.sort((a, b) => new Date(b.dueDate || b.reminderDate || 0) - new Date(a.dueDate || a.reminderDate || 0));
    }
    if (patient.fieldReports && patient.fieldReports.length > 0) {
      patient.fieldReports.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
    }

    if (historyChanged) {
      await patient.save().catch(e => console.warn('History save note:', e.message));
    }

    // Fetch prescriptions for this patient
    let prescriptions = [];
    try {
      const rxOrConditions = [
        { patientId: patient.id },
        { userId: user._id }
      ];
      if (patient.userId) rxOrConditions.push({ userId: patient.userId });
      if (patient._id) rxOrConditions.push({ patientId: patient._id.toString() });
      if (patient.phone) {
        const pClean = patient.phone.replace(/\D/g, '').slice(-10);
        if (pClean && pClean.length >= 6) {
          rxOrConditions.push({ patientPhone: { $regex: pClean } });
          rxOrConditions.push({ patientId: { $regex: pClean } });
        }
      }
      if (user.phone) {
        const uClean = user.phone.replace(/\D/g, '').slice(-10);
        if (uClean && uClean.length >= 6) {
          rxOrConditions.push({ patientPhone: { $regex: uClean } });
          rxOrConditions.push({ patientId: { $regex: uClean } });
        }
      }
      if (patient.name && patient.name.trim().length > 2) {
        rxOrConditions.push({ patientName: patient.name.trim() });
      }
      if (user.name && user.name.trim().length > 2 && user.name.trim() !== patient.name?.trim()) {
        rxOrConditions.push({ patientName: user.name.trim() });
      }
      prescriptions = await Prescription.find({ $or: rxOrConditions }).sort({ prescribedAt: -1 });
    } catch (rxErr) {
      console.warn('Prescriptions fetch note in getMyProfile:', rxErr.message);
    }

    // Fetch referrals for this patient
    let referrals = [];
    try {
      referrals = await Referral.find({
        $or: [
          { patientId: patient.id },
          { patientId: patient._id },
          { patientName: patient.name }
        ]
      }).sort({ createdAt: -1 });
    } catch (refErr) {
      console.warn('Referrals fetch note in getMyProfile:', refErr.message);
    }

    if (patient && !Array.isArray(patient.followUpReminders)) {
      patient.followUpReminders = [];
    }
    if (patient && !Array.isArray(patient.medicalHistory)) {
      patient.medicalHistory = [];
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        village: user.village,
        designation: user.designation,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        bloodGroup: user.bloodGroup,
        emergencyContact: user.emergencyContact,
        profileImage: user.profileImage || '',
        createdAt: user.createdAt
      },
      patient: patient || null,
      prescriptions,
      referrals
    });
  } catch (error) {
    console.error('getMyProfile error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/patient/medical-history
 * Direct endpoint for patient to view their complete clinical visits & medical history
 */
exports.getMyMedicalHistory = async (req, res) => {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const user = await User.findById(decoded.id).select('phone name');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const cleanPhone = (user.phone || '').replace(/\D/g, '').slice(-10);
    const patId = `PAT-${cleanPhone.slice(-6) || user._id.toString().slice(-6).toUpperCase()}`;

    let patient = await Patient.findOne({
      $or: [
        { userId: user._id },
        { id: patId },
        { phone: user.phone },
        { phone: new RegExp(cleanPhone) }
      ]
    });

    if (!patient) {
      return res.json({ success: true, count: 0, medicalHistory: [] });
    }

    // Mirror any records from MedicalRecord collection
    try {
      const MedicalRecord = require('../models/MedicalRecord');
      const mrRecords = await MedicalRecord.find({
        $or: [
          { patientId: patient._id },
          { patientCode: patient.id },
          { patientId: patient.id }
        ]
      }).sort({ visitDate: -1 });

      if (mrRecords && mrRecords.length > 0) {
        if (!patient.medicalHistory) patient.medicalHistory = [];
        for (const rec of mrRecords) {
          const recTime = new Date(rec.visitDate).getTime();
          const exists = patient.medicalHistory.some(existing => {
            const extTime = new Date(existing.visitDate).getTime();
            return Math.abs(recTime - extTime) < 60000 && (existing.diagnosis === rec.diagnosis);
          });
          if (!exists) {
            patient.medicalHistory.push({
              _id: rec._id,
              visitDate: rec.visitDate,
              visitType: rec.visitType || 'OPD Consultation',
              facilityName: rec.facilityName || 'Primary Health Centre',
              doctorName: rec.doctorName || 'Dr. Attending Physician',
              diagnosis: rec.diagnosis,
              symptoms: Array.isArray(rec.symptoms) ? rec.symptoms.join(', ') : (rec.symptoms || ''),
              prescriptions: rec.prescriptions || [],
              treatments: rec.treatments || [],
              testReports: rec.testReports || [],
              clinicalNotes: rec.clinicalNotes || '',
              vitalsAtVisit: rec.vitalsAtVisit || {}
            });
          }
        }
      }
    } catch (e) {}

    const history = (patient.medicalHistory || []).sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
    return res.json({
      success: true,
      count: history.length,
      medicalHistory: history
    });
  } catch (error) {
    console.error('getMyMedicalHistory error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/patient/prescriptions
 * Fetch all e-prescriptions linked to the logged-in patient
 */
exports.getMyPrescriptions = async (req, res) => {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const user = await User.findById(decoded.id).select('phone name');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const cleanPhone = (user.phone || '').replace(/\D/g, '').slice(-10);
    const patId = `PAT-${cleanPhone.slice(-6) || user._id.toString().slice(-6).toUpperCase()}`;

    let patient = await Patient.findOne({
      $or: [
        { userId: user._id },
        { id: patId },
        { phone: user.phone },
        { phone: new RegExp(cleanPhone) }
      ]
    });

    const rxOrConditions = [
      { userId: user._id }
    ];
    if (patient) {
      if (patient.userId) rxOrConditions.push({ userId: patient.userId });
      if (patient.id) rxOrConditions.push({ patientId: patient.id });
      if (patient._id) rxOrConditions.push({ patientId: patient._id.toString() });
      if (patient.name && patient.name.trim().length > 2) rxOrConditions.push({ patientName: patient.name.trim() });
    }
    if (cleanPhone && cleanPhone.length >= 6) {
      rxOrConditions.push({ patientPhone: { $regex: cleanPhone } });
      rxOrConditions.push({ patientId: { $regex: cleanPhone } });
    }
    if (user.name && user.name.trim().length > 2) {
      rxOrConditions.push({ patientName: user.name.trim() });
    }

    const prescriptions = await Prescription.find({ $or: rxOrConditions }).sort({ prescribedAt: -1 });

    return res.json({
      success: true,
      count: prescriptions.length,
      prescriptions
    });
  } catch (error) {
    console.error('getMyPrescriptions error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/patient/profile
 * patient updates their own profile — both User fields AND Patient clinical record.
 */
/**
 * POST /api/patient/send-otp
 * Auto-fetch the logged-in patient's email from their User record
 * and send a 6-digit OTP to that email — no manual email entry needed.
 */
exports.sendProfileOtp = async (req, res) => {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const user = await User.findById(decoded.id).select('email name');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.email || !user.email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'No registered email found on your profile. Please contact support or add an email first.'
      });
    }

    const normalizedEmail = user.email.toLowerCase().trim();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    patientOtpStore.set(decoded.id.toString(), { otp, expiresAt, email: normalizedEmail });

    console.log(`\n🔑 ==========================================`);
    console.log(`📧 patient PROFILE OTP for [${normalizedEmail}] (User: ${user.name}): ${otp}`);
    console.log(`⏰ Valid for 10 minutes`);
    console.log(`==========================================\n`);

    // Attempt real email sending if SMTP configured
    let emailSent = false;
    let emailNotice = '';
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: `"GraminArogya Health Portal" <${process.env.SMTP_USER}>`,
          to: normalizedEmail,
          subject: '🔐 GraminArogya — Profile Update Verification OTP',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #d1fae5; border-radius: 14px; background: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #064e3b; margin: 0;">🌿 GraminArogya</h2>
                <p style="color: #047857; font-size: 0.88rem; margin: 4px 0 0;">Rural Healthcare & patient Health Records</p>
              </div>
              <p style="color: #374151; font-size: 0.9rem;">Dear <strong>${user.name}</strong>,</p>
              <p style="color: #374151; font-size: 0.9rem;">You requested to update your health profile. Please use the OTP below to verify and save your changes:</p>
              <div style="background: #f0fdf4; border: 1px dashed #10b981; border-radius: 10px; padding: 22px; text-align: center; margin: 22px 0;">
                <p style="color: #374151; font-size: 0.88rem; margin: 0 0 10px;">Your 6-Digit Profile Update OTP:</p>
                <div style="font-size: 2.4rem; font-weight: 900; letter-spacing: 8px; color: #064e3b;">${otp}</div>
                <p style="color: #6b7280; font-size: 0.78rem; margin: 12px 0 0;">Valid for 10 minutes. Do not share this OTP with anyone.</p>
              </div>
              <p style="color: #6b7280; font-size: 0.82rem;">If you did not request this, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <div style="font-size: 0.72rem; color: #9ca3af; text-align: center;">SIH 2026 • Ministry of Health & Family Welfare • GraminArogya Platform</div>
            </div>
          `
        });
        emailSent = true;
        emailNotice = `OTP sent to your registered email: ${normalizedEmail}`;
      } catch (mailErr) {
        console.warn('SMTP error (using dev-OTP fallback):', mailErr.message);
        emailNotice = 'OTP generated. (Check server log or use preview code below for testing.)';
      }
    } else {
      emailNotice = 'OTP generated. (Configure SMTP in .env for real delivery — use preview code below for demo.)';
    }

    return res.json({
      success: true,
      message: emailSent
        ? `OTP sent to your registered email: ${normalizedEmail}`
        : `OTP generated. Check server log or SMTP configuration.`,
      maskedEmail: normalizedEmail.replace(/(.{2}).+(@.+)/, '$1***$2'),
      expiresInMinutes: 10
    });
  } catch (error) {
    console.error('sendProfileOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/patient/verify-otp
 * Verify the OTP that was sent to the patient's registered email.
 */
exports.verifyProfileOtp = async (req, res) => {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { otp } = req.body;
    if (!otp || otp.toString().trim().length < 4) {
      return res.status(400).json({ success: false, message: 'Please provide a valid OTP code.' });
    }

    const stored = patientOtpStore.get(decoded.id.toString());
    if (!stored) {
      return res.status(400).json({ success: false, message: 'No active OTP found. Please request a new OTP.' });
    }

    if (Date.now() > stored.expiresAt) {
      patientOtpStore.delete(decoded.id.toString());
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    if (stored.otp !== otp.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
    }

    patientOtpStore.delete(decoded.id.toString());

    return res.json({
      success: true,
      message: 'OTP verified successfully. You may now save your profile changes.'
    });
  } catch (error) {
    console.error('verifyProfileOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const {
      name, email, phone, village,
      dateOfBirth, gender, bloodGroup, emergencyContact, profileImage,
      // Patient-specific health fields
      vitals, knownAllergies, chronicConditions,
      currentHealthStatus
    } = req.body;

    // Update User record
    const userUpdate = {};
    if (name) userUpdate.name = name.trim();
    if (email !== undefined) userUpdate.email = email.trim();
    if (phone !== undefined) userUpdate.phone = phone.trim();
    if (village !== undefined) userUpdate.village = village.trim();
    if (dateOfBirth !== undefined) userUpdate.dateOfBirth = dateOfBirth;
    if (gender !== undefined) {
      const g = (gender || '').toString().trim().toUpperCase();
      userUpdate.gender = g === 'MALE' ? 'Male' : (g === 'FEMALE' ? 'Female' : (g === 'OTHER' ? 'Other' : gender));
    }
    if (bloodGroup !== undefined) userUpdate.bloodGroup = bloodGroup.trim();
    if (emergencyContact !== undefined) userUpdate.emergencyContact = emergencyContact.trim();
    if (profileImage !== undefined) {
      if (profileImage.startsWith('data:image')) {
        const cloudinary = require('../utils/cloudinary');
        try {
          const uploadResponse = await cloudinary.uploader.upload(profileImage, {
            folder: 'graminarogya/profiles',
          });
          userUpdate.profileImage = uploadResponse.secure_url;
        } catch (error) {
          console.error('Cloudinary upload error:', error);
          console.log('Falling back to base64 storage due to Cloudinary error.');
          // Fallback to storing the base64 string directly in MongoDB
          userUpdate.profileImage = profileImage;
        }
      } else {
        userUpdate.profileImage = profileImage;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      { $set: userUpdate },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Compute updated age from dateOfBirth
    let computedAge = null;
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      computedAge = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) computedAge--;
    }

    // Find + update linked Patient record
    const cleanPhone = (updatedUser.phone || '').replace(/\D/g, '').slice(-10);
    const patId = `PAT-${cleanPhone.slice(-6) || decoded.id.toString().slice(-6).toUpperCase()}`;

    const patOrConditions = [{ id: patId }];
    if (cleanPhone && cleanPhone.length >= 6) {
      patOrConditions.push({ phone: { $regex: cleanPhone } });
    }
    if (updatedUser.name) {
      patOrConditions.push({ name: updatedUser.name });
    }

    let patient = await Patient.findOne({ $or: patOrConditions });

    const patientUpdate = {};
    if (name) patientUpdate.name = name.trim();
    if (village !== undefined) patientUpdate.village = village.trim();
    if (gender !== undefined) {
      const g = (gender || '').toString().trim().toUpperCase();
      patientUpdate.gender = g === 'MALE' ? 'Male' : (g === 'FEMALE' ? 'Female' : 'Other');
    }
    if (bloodGroup !== undefined) patientUpdate.bloodGroup = bloodGroup.trim();
    if (emergencyContact !== undefined) patientUpdate.emergencyContact = emergencyContact.trim();
    if (computedAge !== null) patientUpdate.age = computedAge;
    if (vitals) patientUpdate.vitals = vitals;
    if (knownAllergies !== undefined) patientUpdate.knownAllergies = knownAllergies;
    if (chronicConditions !== undefined) patientUpdate.chronicConditions = chronicConditions;
    if (currentHealthStatus) patientUpdate.currentHealthStatus = {
      ...currentHealthStatus,
      lastEvaluatedAt: new Date()
    };

    if (patient) {
      patient = await Patient.findByIdAndUpdate(
        patient._id,
        { $set: patientUpdate },
        { new: true }
      );
    } else if (cleanPhone) {
      // Create a new Patient record if none exists yet
      const abhaDigits = cleanPhone.slice(-4) || '0000';
      patient = new Patient({
        id: patId,
        name: updatedUser.name,
        age: computedAge || 25,
        gender: gender || 'Not Specified',
        village: village || updatedUser.village || '',
        phone: cleanPhone,
        abhaId: `ABHA-91-${abhaDigits}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        guardianName: emergencyContact ? `Emergency: ${emergencyContact}` : 'Self',
        chiefComplaint: 'patient Health Record',
        symptomTags: ['General Health', 'Preventive Care'],
        vitals: vitals || { bp: '120/80', spo2: 98, temp: 98.4, pulse: 72, sugar: 'Normal' },
        currentHealthStatus: currentHealthStatus || { condition: 'Healthy', summary: '', lastEvaluatedAt: new Date() },
        riskLevel: 'LOW',
        triageCategory: 'GREEN_ROUTINE',
        bloodGroup: bloodGroup || '',
        emergencyContact: emergencyContact || '',
        knownAllergies: knownAllergies || [],
        chronicConditions: chronicConditions || [],
        medicalHistory: [],
        accessLogs: [],
        followUpReminders: [],
        registrationDate: new Date()
      });
      await patient.save();
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully in database!',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        email: updatedUser.email,
        village: updatedUser.village,
        designation: updatedUser.designation,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
        bloodGroup: updatedUser.bloodGroup,
        emergencyContact: updatedUser.emergencyContact
      },
      patient: patient || null
    });
  } catch (error) {
    console.error('updateMyProfile error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'Phone/Email';
      return res.status(400).json({
        success: false,
        message: `This ${field} is already associated with another registered account.`
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/patient/field-visits
 * Returns ASHA field visit records for the authenticated patient only.
 */
exports.getMyFieldVisits = async (req, res) => {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const user = await User.findById(decoded.id).select('phone patId _id');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    let cleanPhone = (user.phone || '').replace(/\D/g, '').slice(-10);
    let patient = await Patient.findOne({ userId: user._id });
    if (!patient && cleanPhone && cleanPhone.length >= 6) {
      patient = await Patient.findOne({ phone: { $regex: cleanPhone } });
    }
    if (!patient && user.patId) {
      patient = await Patient.findOne({ id: user.patId });
    }

    if (!patient) {
      return res.json({ success: true, fieldVisits: [], count: 0 });
    }

    if (!cleanPhone && patient.phone) {
      cleanPhone = (patient.phone || '').replace(/\D/g, '').slice(-10);
    }

    let allVisits = [...(patient.fieldReports || [])];

    const otherOr = [];
    if (cleanPhone && cleanPhone.length >= 6) {
      otherOr.push({ phone: { $regex: cleanPhone } });
    }
    if (user.patId) otherOr.push({ id: user.patId });
    if (patient.id) otherOr.push({ id: patient.id });
    if (patient.userId) otherOr.push({ userId: patient.userId });

    if (otherOr.length > 0) {
      const others = await Patient.find({
        _id: { $ne: patient._id },
        $or: otherOr
      });
      for (const o of others) {
        if (Array.isArray(o.fieldReports)) {
          for (const fr of o.fieldReports) {
            const frTime = new Date(fr.visitDate).getTime();
            const exists = allVisits.some(e => {
              const eTime = new Date(e.visitDate).getTime();
              return Math.abs(frTime - eTime) < 60000 && (e.symptoms === fr.symptoms);
            });
            if (!exists) allVisits.push(fr);
          }
        }
      }
    }

    // Also pick up any ASHA visits stored in medicalHistory
    if (Array.isArray(patient.medicalHistory)) {
      for (const mh of patient.medicalHistory) {
        if (mh.visitType?.includes('ASHA') || mh.doctorName?.includes('ASHA')) {
          const mhTime = new Date(mh.visitDate).getTime();
          const exists = allVisits.some(e => {
            const eTime = new Date(e.visitDate).getTime();
            return Math.abs(mhTime - eTime) < 60000;
          });
          if (!exists) {
            allVisits.push({
              visitDate: mh.visitDate,
              ashaId: 'asha-worker',
              ashaName: mh.doctorName || 'Community ASHA Health Worker',
              symptoms: mh.symptoms || '',
              observations: mh.clinicalNotes || '',
              notes: mh.diagnosis || '',
              vitals: mh.vitalsAtVisit || {},
              triageResult: mh.diagnosis?.includes('Emergency') ? 'RED_EMERGENCY' : mh.diagnosis?.includes('Urgent') ? 'YELLOW_URGENT' : 'GREEN_ROUTINE',
              followUpRequirement: '',
              referralRequirement: mh.treatments?.find(t => t.startsWith('Referral:'))?.replace('Referral:', '').trim() || ''
            });
          }
        }
      }
    }

    allVisits.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));

    return res.json({ success: true, fieldVisits: allVisits, count: allVisits.length });
  } catch (error) {
    console.error('getMyFieldVisits error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

