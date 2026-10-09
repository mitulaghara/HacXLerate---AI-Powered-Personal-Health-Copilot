const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');
const Referral = require('../models/Referral');
const { logAudit } = require('../middleware/authMiddleware');

// Helper to normalize phone number to last 10 digits
function normalizePhone(input) {
  if (!input) return '';
  const digits = String(input).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

// Mask phone for safe multiple selection lists (e.g., +91 ••••• •1234)
function maskPhone(phone) {
  if (!phone) return '—';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length < 4) return phone;
  const last4 = clean.slice(-4);
  return `+91 ••••• •${last4}`;
}

// Mask SSC code for display (e.g., SSC-••-••••-9812)
function maskSsc(ssc) {
  if (!ssc) return '—';
  const parts = String(ssc).split('-');
  if (parts.length >= 4) {
    return `${parts[0]}-••-••••-${parts[parts.length - 1]}`;
  }
  return ssc.length > 4 ? `•••-${ssc.slice(-4)}` : ssc;
}

// Format patient response based on user role for data privacy
function formatPatientForRole(patient, role) {
  if (!patient) return null;

  if (role === 'pharmacist') {
    // Pharmacist gets only prescription-relevant details
    return {
      _id: patient._id,
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      village: patient.village,
      sscCode: patient.sscCode,
      maskedSsc: maskSsc(patient.sscCode),
      bloodGroup: patient.bloodGroup,
      knownAllergies: patient.knownAllergies || [],
      currentCondition: patient.currentHealthStatus?.condition || 'Stable'
    };
  }

  // Doctor / Admin / ASHA gets complete clinical profile
  return patient;
}

async function isDoctorAuthorized(patient, doctorId) {
  const isConnected = 
    patient.medicalHistory?.some(m => m.doctorId === doctorId) ||
    patient.followUpReminders?.some(f => f.doctorId === doctorId) ||
    patient.accessLogs?.some(a => a.doctorId === doctorId);

  if (isConnected) return true;

  const Prescription = require('../models/Prescription');
  const hasRx = await Prescription.exists({ patientId: patient.id, doctorId });
  if (hasRx) return true;
  
  const Referral = require('../models/Referral');
  const hasReferral = await Referral.exists({
      patientId: patient.id,
      $or: [{ referredToDoctorId: doctorId }, { referringDoctorId: doctorId }]
  });
  
  return hasReferral;
}

// 1. Search by Mobile Number
exports.searchByMobile = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Please provide a mobile number to search.' });
    }

    const clean10 = normalizePhone(phone);
    if (!clean10 || clean10.length < 6) {
      return res.status(400).json({ success: false, message: 'Please enter a valid mobile number (at least 6-10 digits).' });
    }

    const regex = new RegExp(clean10);
    const patients = await Patient.find({
      $or: [
        { phone: { $regex: regex } },
        { ashaWorkerContact: { $regex: regex } },
        { emergencyContact: { $regex: regex } }
      ]
    }).sort({ createdAt: -1 });

    await logAudit({
      action: 'PATIENT_LOOKUP',
      req,
      resource: 'Mobile Search',
      details: { query: clean10, matchesCount: patients.length },
      status: patients.length > 0 ? 'SUCCESS' : 'FAILURE'
    });

    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Patient not found. No records linked to mobile number "${phone}".`
      });
    }

    const userRole = req.user?.role || 'doctor';
    
    let allowedPatients = patients;
    if (userRole === 'doctor' && req.user) {
      const doctorId = req.user.doctorId || req.user.id;
      const authChecks = await Promise.all(patients.map(p => isDoctorAuthorized(p, doctorId)));
      allowedPatients = patients.filter((_, idx) => authChecks[idx]);
    }
    
    if (allowedPatients.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Patient found but unauthorized. You are not connected to this patient.'
      });
    }

    // Multiple records with same mobile number: return safe selection list
    if (allowedPatients.length > 1) {
      const safeList = allowedPatients.map(p => ({
        id: p.id,
        _id: p._id,
        name: p.name,
        age: p.age,
        gender: p.gender,
        village: p.village,
        maskedPhone: maskPhone(p.phone),
        maskedSsc: maskSsc(p.sscCode),
        chiefComplaint: p.chiefComplaint,
        registrationDate: p.registrationDate
      }));

      return res.json({
        success: true,
        multiple: true,
        count: allowedPatients.length,
        message: `Multiple patients found with this mobile number. Please select the correct patient.`,
        patients: safeList
      });
    }

    // Exactly one patient found
    const single = allowedPatients[0];
    let activePrescriptions = [];
    try {
      activePrescriptions = await Prescription.find({
        patientId: single.id,
        ...(userRole === 'pharmacist' ? { status: { $in: ['Prescribed', 'Partially Dispensed'] } } : {})
      }).sort({ prescribedAt: -1 }).limit(10);
    } catch (rxErr) {
      console.warn('activePrescriptions fetch note:', rxErr.message);
    }

    return res.json({
      success: true,
      multiple: false,
      count: 1,
      patient: formatPatientForRole(single, userRole),
      activePrescriptions
    });
  } catch (error) {
    console.error('searchByMobile error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Search by SSC / Social Security Card Code
exports.searchBySsc = async (req, res) => {
  try {
    const { sscCode } = req.body;
    if (!sscCode || !sscCode.trim()) {
      return res.status(400).json({ success: false, message: 'SSC Code is required.' });
    }

    const cleanSsc = sscCode.trim();
    const regex = new RegExp(`^${cleanSsc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    const patient = await Patient.findOne({
      $or: [{ sscCode: regex }, { sscCode: cleanSsc }]
    });

    await logAudit({
      action: 'PATIENT_LOOKUP',
      req,
      resource: 'SSC Search',
      details: { sscCode: cleanSsc },
      status: patient ? 'SUCCESS' : 'FAILURE'
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Patient not found. No record matches SSC Code "${cleanSsc}".`
      });
    }

    const userRole = req.user?.role || 'doctor';
    
    // Authorization Check: A doctor can only access connected patients
    if (userRole === 'doctor' && req.user) {
      const doctorId = req.user.doctorId || req.user.id;
      const isAuthorized = await isDoctorAuthorized(patient, doctorId);
      if (!isAuthorized) {
        return res.status(403).json({ success: false, message: 'Unauthorized access. You are not connected to this patient.' });
      }
    }

    let activePrescriptions = [];
    try {
      const Prescription = require('../models/Prescription');
      activePrescriptions = await Prescription.find({
        patientId: patient.id,
        ...(userRole === 'pharmacist' ? { status: { $in: ['Prescribed', 'Partially Dispensed'] } } : {})
      }).sort({ prescribedAt: -1 }).limit(10);
    } catch (rxErr) {
      console.warn('activePrescriptions fetch note:', rxErr.message);
    }

    return res.json({
      success: true,
      patient: formatPatientForRole(patient, userRole),
      activePrescriptions
    });
  } catch (error) {
    console.error('searchBySsc error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Search by Patient ID / Client ID
exports.searchByClient = async (req, res) => {
  try {
    const { clientId, patientId } = req.body;
    const queryId = (clientId || patientId || '').trim();

    if (!queryId) {
      return res.status(400).json({ success: false, message: 'Patient ID / Client ID is required.' });
    }

    const escaped = queryId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped}$`, 'i');
    const cleanDigits = queryId.replace(/\D/g, '');

    const orConditions = [
      { id: regex },
      { id: queryId },
      { abhaId: regex },
      { sscCode: regex },
      { sscCode: queryId },
      { qrToken: queryId }
    ];

    if (cleanDigits.length >= 6) {
      orConditions.push({ phone: { $regex: cleanDigits.slice(-10) } });
      orConditions.push({ phone: queryId });
    }

    let patient = await Patient.findOne({ $or: orConditions });

    if (!patient && queryId.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(queryId);
    }

    // Also look up via User account if not found directly on Patient
    if (!patient) {
      const User = require('../models/User');
      const userOr = [{ username: queryId }, { patId: queryId }];
      if (cleanDigits.length >= 6) {
        userOr.push({ phone: { $regex: cleanDigits.slice(-10) } });
      }
      if (queryId.match(/^[0-9a-fA-F]{24}$/)) {
        userOr.push({ _id: queryId });
      }
      const matchedUser = await User.findOne({ $or: userOr });
      if (matchedUser) {
        patient = await Patient.findOne({
          $or: [
            { userId: matchedUser._id },
            { id: matchedUser.patId || '' },
            { phone: matchedUser.phone || '' }
          ]
        });
      }
    }

    await logAudit({
      action: 'PATIENT_LOOKUP',
      req,
      resource: 'Client ID Search',
      details: { queryId },
      status: patient ? 'SUCCESS' : 'FAILURE'
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Patient not found. No record matches "${queryId}". Please check the ID, mobile number, or SSC code.`
      });
    }

    const userRole = req.user?.role || 'doctor';
    
    // Authorization Check: A doctor can only access connected patients
    if (userRole === 'doctor' && req.user) {
      const doctorId = req.user.doctorId || req.user.id;
      const isAuthorized = await isDoctorAuthorized(patient, doctorId);
      if (!isAuthorized) {
        return res.status(403).json({ success: false, message: 'Unauthorized access. You are not connected to this patient.' });
      }
    }

    let activePrescriptions = [];
    try {
      const Prescription = require('../models/Prescription');
      activePrescriptions = await Prescription.find({
        patientId: patient.id,
        ...(userRole === 'pharmacist' ? { status: { $in: ['Prescribed', 'Partially Dispensed'] } } : {})
      }).sort({ prescribedAt: -1 }).limit(10);
    } catch (rxErr) {
      console.warn('activePrescriptions fetch note:', rxErr.message);
    }

    return res.json({
      success: true,
      patient: formatPatientForRole(patient, userRole),
      activePrescriptions
    });
  } catch (error) {
    console.error('searchByClient error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Secure Patient QR Code Lookup
exports.lookupByQr = async (req, res) => {
  try {
    const { qrData, qrToken, patientId } = req.body;
    let targetToken = qrToken || '';
    let targetPatientId = patientId || '';
    let targetSsc = '';
    let targetPhone = '';
    let targetAbha = '';

    if (!targetToken && !targetPatientId && qrData) {
      // Try parsing JSON QR string
      try {
        const parsed = typeof qrData === 'object' ? qrData : JSON.parse(qrData);
        targetToken = parsed.qrToken || parsed.secureToken || parsed.token || '';
        targetPatientId = parsed.patientId || parsed.id || '';
        targetSsc = parsed.sscCode || parsed.ssc || '';
        targetPhone = parsed.phone || parsed.mobile || '';
        targetAbha = parsed.abhaId || '';
      } catch {
        // Plain text token or patient ID passed in qrData
        if (typeof qrData === 'string') {
          if (qrData.startsWith('SEC-QR-')) {
            targetToken = qrData.trim();
          } else {
            targetPatientId = qrData.trim();
          }
        }
      }
    }

    if (!targetToken && !targetPatientId && !targetSsc && !targetPhone && !targetAbha) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code. Safe patient token or identifier is missing.'
      });
    }

    const orConditions = [];
    if (targetToken) {
      orConditions.push({ qrToken: targetToken });
    }
    if (targetPatientId) {
      orConditions.push({ id: targetPatientId });
      if (targetPatientId.match(/^[0-9a-fA-F]{24}$/)) {
        orConditions.push({ _id: targetPatientId });
      }
    }
    if (targetSsc) {
      orConditions.push({ sscCode: targetSsc });
    }
    if (targetPhone) {
      orConditions.push({ phone: targetPhone });
    }
    if (targetAbha) {
      orConditions.push({ abhaId: targetAbha });
    }

    const patient = await Patient.findOne({ $or: orConditions });

    await logAudit({
      action: 'QR_LOOKUP',
      req,
      resource: 'Patient QR Lookup',
      patientId: patient?.id || targetPatientId,
      details: { qrToken: targetToken ? 'PROVIDED' : 'NONE' },
      status: patient ? 'SUCCESS' : 'FAILURE'
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found or invalid QR code.'
      });
    }

    const userRole = req.user?.role || 'doctor';

    // Authorization Check: A doctor can only access connected patients
    if (userRole === 'doctor' && req.user) {
      const doctorId = req.user.doctorId || req.user.id;
      const isAuthorized = await isDoctorAuthorized(patient, doctorId);
      if (!isAuthorized) {
        return res.status(403).json({ success: false, message: 'Unauthorized access. You are not connected to this patient.' });
      }
    }

    // Fetch prescriptions for authorized roles
    let activePrescriptions = [];
    try {
      activePrescriptions = await Prescription.find({
        patientId: patient.id,
        ...(userRole === 'pharmacist' ? { status: { $in: ['Prescribed', 'Partially Dispensed'] } } : {})
      }).sort({ prescribedAt: -1 }).limit(10);
    } catch (rxErr) {
      console.warn('activePrescriptions fetch note in lookupByQr:', rxErr.message);
    }

    return res.json({
      success: true,
      message: `Patient QR verified successfully for ${patient.name}`,
      patient: formatPatientForRole(patient, userRole),
      activePrescriptions
    });
  } catch (error) {
    console.error('lookupByQr error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Unified Patient Profile & History (Role-Authorized)
exports.getUnifiedPatientProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role || 'doctor';
    const userId = req.user?.id;

    let patient = await Patient.findOne({
      $or: [{ id: id }, { phone: id }]
    });

    if (!patient && id.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(id);
    }

    if (!patient) {
      return res.status(404).json({ success: false, message: `Patient (${id}) not found.` });
    }

    // Role-based authorization: Citizen can only view their own record
    if (userRole === 'citizen') {
      const userPhone = normalizePhone(req.user?.phone);
      const patientPhone = normalizePhone(patient.phone);
      if (userPhone && patientPhone && userPhone !== patientPhone && req.user?.name !== patient.name) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own health records.'
        });
      }
    }

    // Log patient record access
    await logAudit({
      action: 'PATIENT_RECORD_ACCESS',
      req,
      patientId: patient.id,
      resource: 'Unified Profile View',
      status: 'SUCCESS'
    });

    // Fetch related prescriptions and referrals safely
    let prescriptions = [];
    let referrals = [];
    try {
      prescriptions = await Prescription.find({
        $or: [
          { patientId: patient.id },
          { patientId: patient._id ? patient._id.toString() : '' },
          { userId: patient.userId || null }
        ]
      }).sort({ prescribedAt: -1 });
    } catch (rxErr) {
      console.warn('Prescriptions fetch note in getUnifiedPatientProfile:', rxErr.message);
    }
    try {
      referrals = await Referral.find({
        $or: [
          { patientId: patient.id },
          { patientId: patient._id },
          { patientName: patient.name }
        ]
      }).sort({ createdAt: -1 });
    } catch (refErr) {
      console.warn('Referrals fetch note in getUnifiedPatientProfile:', refErr.message);
    }

    return res.json({
      success: true,
      patient: formatPatientForRole(patient, userRole),
      prescriptions,
      referrals
    });
  } catch (error) {
    console.error('getUnifiedPatientProfile error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
