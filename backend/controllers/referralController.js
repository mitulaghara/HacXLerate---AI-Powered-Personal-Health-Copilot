/**
 * Digital Referral & Care Continuity Controller
 * Directly queries and stores to MongoDB Atlas database.
 */

const QRCode = require('qrcode');
const Referral = require('../models/Referral');
const Patient = require('../models/Patient');

exports.createReferral = async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      age,
      gender,
      village,
      referringUnit,
      referringStaff = req.user?.name ? `${req.user.name} (${req.user.role.toUpperCase()})` : (req.body.referringStaff || 'Health Staff'),
      referredToFacilityId,
      referredToFacilityName,
      targetFacilityName,
      referralReason,
      primaryReason,
      notes,
      provisionalDiagnosis = 'Under Evaluation',
      priority = 'HIGH_YELLOW',
      vitalsSnapshot = {},
      transportArranged = 'Local Arranged Transport'
    } = req.body;

    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const referralCode = `GA-REF-${randomNum}`;
    const id = `REF-${new Date().getFullYear()}-${randomNum}`;

    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const destFacility = referredToFacilityName || targetFacilityName || 'District Hospital / Trauma Center';
    const reasonText = referralReason || primaryReason || 'Specialized clinical referral';

    let normalizedPriority = 'HIGH_YELLOW';
    const pUpper = String(priority || '').toUpperCase();
    if (pUpper === 'HIGH' || pUpper === 'HIGH_YELLOW') normalizedPriority = 'HIGH_YELLOW';
    else if (pUpper === 'CRITICAL' || pUpper === 'EMERGENCY' || pUpper === 'EMERGENCY_RED') normalizedPriority = 'EMERGENCY_RED';
    else if (pUpper === 'ROUTINE' || pUpper === 'NORMAL' || pUpper === 'ROUTINE_GREEN') normalizedPriority = 'ROUTINE_GREEN';

    // Resolve patient ObjectId or provisional record from Patient model
    let resolvedPatientDoc = null;
    const isValidHexId = typeof patientId === 'string' && /^[0-9a-fA-F]{24}$/.test(patientId);

    if (patientId) {
      if (isValidHexId) {
        resolvedPatientDoc = await Patient.findById(patientId);
      }
      if (!resolvedPatientDoc) {
        resolvedPatientDoc = await Patient.findOne({ $or: [{ id: patientId }, { phone: patientId }] });
      }
    }
    if (!resolvedPatientDoc && patientName && !['Patient', 'Emergency Patient', 'Referral Patient'].includes(patientName)) {
      resolvedPatientDoc = await Patient.findOne({ name: patientName });
    }

    // Determine finalPatientId.
    // In ReferralSchema, patientId is Schema.Types.Mixed (supports ObjectId or String) and required: true.
    let finalPatientId = resolvedPatientDoc ? resolvedPatientDoc._id : (patientId || `PAT-${randomNum}`);

    // If no existing patient document was found in DB, auto-create a provisional Patient entry
    // so referral continuity, patient profile, and triage history remain accessible in the system.
    if (!resolvedPatientDoc) {
      try {
        const safePatId = typeof patientId === 'string' && patientId.trim().length > 0 ? patientId.trim() : `PAT-${randomNum}`;
        const provisionalPatient = new Patient({
          id: safePatId,
          name: patientName || 'Emergency Referral Patient',
          age: Number(age) || 30,
          gender: gender || 'Female',
          village: village || 'Live GPS Location',
          chiefComplaint: reasonText,
          vitals: vitalsSnapshot || {},
          riskLevel: normalizedPriority === 'EMERGENCY_RED' ? 'CRITICAL' : normalizedPriority === 'HIGH_YELLOW' ? 'HIGH' : 'LOW'
        });
        await provisionalPatient.save();
        resolvedPatientDoc = provisionalPatient;
        finalPatientId = provisionalPatient._id;
      } catch (patErr) {
        console.warn('Provisional patient creation fallback:', patErr.message);
        finalPatientId = patientId || `PAT-${randomNum}`;
      }
    }

    const newReferralData = {
      id,
      referralCode,
      referral_code: referralCode,
      patientId: finalPatientId,
      patientName: patientName || resolvedPatientDoc?.name || 'Emergency Referral Patient',
      age: Number(age) || resolvedPatientDoc?.age || 30,
      gender: gender || resolvedPatientDoc?.gender || 'Female',
      village: village || resolvedPatientDoc?.village || 'Live GPS Location',
      referringUnit: referringUnit || 'Community Health Centre',
      referringStaff,
      referredToFacilityId: referredToFacilityId || undefined,
      referredToFacilityName: destFacility,
      referralReason: reasonText,
      provisionalDiagnosis: provisionalDiagnosis || reasonText,
      priority: normalizedPriority,
      status: 'Initiated',
      initiatedAt: new Date(),
      transportArranged,
      vitalsSnapshot,
      doctorHandoffNotes: notes || '',
      timeline: [
        { time: currentTimeStr, stage: 'Referral Initiated & Digital Record Created', by: referringStaff },
        { time: currentTimeStr, stage: `Notification sent to ${destFacility}`, by: 'Automated Routing' }
      ]
    };

    const qrPayload = JSON.stringify({
      code: referralCode,
      patId: resolvedPatientDoc?.id || (typeof patientId === 'string' ? patientId : String(finalPatientId)),
      name: newReferralData.patientName,
      priority: normalizedPriority,
      dest: destFacility,
      vitals: vitalsSnapshot,
      auth: 'GRAMIN_AROGYA_VERIFIED'
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#064e3b',
        light: '#ffffff'
      }
    });

    const ref = new Referral(newReferralData);
    await ref.save();

    return res.status(201).json({
      success: true,
      message: 'Digital referral record generated and saved to database.',
      referral: ref,
      qrDataUrl
    });
  } catch (error) {
    console.error('Create referral error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReferrals = async (req, res) => {
  try {
    const userRole = req.user?.role || 'doctor';
    const filter = {};

    // Patient/Citizen can only see their own referrals
    if (['patient', 'citizen'].includes(userRole)) {
      const cleanPhone = (req.user?.phone || '').replace(/\D/g, '').slice(-10);
      const patient = await Patient.findOne({
        $or: [
          { userId: req.user?.id || req.user?._id },
          ...(cleanPhone ? [{ phone: { $regex: cleanPhone } }] : [])
        ]
      });

      if (!patient) {
        return res.json({ success: true, count: 0, data: [] });
      }

      filter.$or = [
        { patientId: patient._id },
        { patientName: patient.name }
      ];
    } else if (req.query?.patientId) {
      const pId = req.query.patientId;
      const isValidHex = typeof pId === 'string' && /^[0-9a-fA-F]{24}$/.test(pId);
      const patient = await Patient.findOne({ $or: [{ id: pId }, { phone: pId }] });
      filter.$or = [
        ...(patient ? [{ patientId: patient._id }] : []),
        ...(isValidHex ? [{ patientId: pId }] : []),
        { patientId: pId },
        { patientName: pId }
      ];
    }

    const list = await Referral.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReferralByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const ref = await Referral.findOne({
      $or: [
        { referralCode: code.toUpperCase() },
        { referralCode: code },
        { id: code }
      ]
    });

    if (!ref) {
      return res.status(404).json({ success: false, message: `Referral code ${code} not found in database.` });
    }

    const qrPayload = JSON.stringify({
      code: ref.referralCode,
      patId: ref.patientId,
      name: ref.patientName,
      dest: ref.referredToFacilityName,
      auth: 'GRAMIN_AROGYA_VERIFIED'
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 2,
      color: { dark: '#064e3b', light: '#ffffff' }
    });

    return res.json({ success: true, data: ref, qrDataUrl });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateReferralStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, doctorNotes, stageName, staffName = 'Receiving Doctor' } = req.body;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const ref = await Referral.findOne({
      $or: [{ id }, { referralCode: id }, { _id: id }]
    });

    if (!ref) {
      return res.status(404).json({ success: false, message: 'Referral record not found in database' });
    }

    if (status) ref.status = status;
    if (doctorNotes) ref.doctorHandoffNotes = doctorNotes;
    ref.timeline.push({
      time: timeStr,
      stage: stageName || `Status updated to ${status}`,
      by: staffName
    });

    const updated = await ref.save();

    return res.json({ success: true, message: 'Referral status updated in database', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
