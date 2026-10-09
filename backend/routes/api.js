const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const triageController = require('../controllers/triageController');
const facilityController = require('../controllers/facilityController');
const referralController = require('../controllers/referralController');
const analyticsController = require('../controllers/analyticsController');
const outbreakController = require('../controllers/outbreakController');
const configController = require('../controllers/configController');
const doctorController = require('../controllers/doctorController');
const patientController = require('../controllers/patientController');
const bloodBankController = require('../controllers/bloodBankController');
const patientSearchController = require('../controllers/patientSearchController');
const diseaseController = require('../controllers/diseaseController');
const prescriptionController = require('../controllers/prescriptionController');
const stockController = require('../controllers/stockController');
const adminDataController = require('../controllers/adminDataController');
const { authenticateJWT, authorizeRole } = require('../middleware/authMiddleware');

// 1. Authentication & User Management
router.post('/auth/register', authController.register);
router.post('/auth/check-existing', authController.checkExisting);
router.post('/auth/forgot-id/request-otp', authController.requestIdOtp);
router.post('/auth/forgot-id/verify-otp', authController.verifyIdOtp);
router.post('/auth/forgot-password/request-otp', authController.requestPasswordOtp);
router.post('/auth/forgot-password/verify-otp', authController.verifyPasswordOtp);
router.post('/auth/forgot-password/reset', authController.resetPassword);
router.post('/auth/login', authController.login);
router.post('/auth/verify-admin-otp', authController.verifyAdminOtp);
router.post('/auth/google', authController.googleAuth);
router.get('/auth/me', authController.getMe);
router.get('/auth/users', authController.getUsersList);
router.post('/admin/create-doctor', authenticateJWT, authorizeRole('admin'), authController.createDoctor);
router.post('/doctor/create-staff', authenticateJWT, authorizeRole('doctor', 'admin'), authController.createStaff);
router.post('/admin/create-staff', authenticateJWT, authorizeRole('admin', 'doctor'), authController.createStaff);
router.post('/auth/create-staff', authenticateJWT, authorizeRole('admin', 'doctor'), authController.createStaff);

// Username management routes
router.patch('/auth/username', authenticateJWT, authController.updateUsername);
router.patch('/admin/users/:userId/username', authenticateJWT, authorizeRole('admin'), authController.adminResetUsername);

// Admin profile route  
router.get('/admin/profile', authenticateJWT, authorizeRole('admin'), authController.getAdminProfile);
router.put('/admin/profile', authenticateJWT, authorizeRole('admin'), authController.updateAdminProfile);

// ASHA / Staff profile routes
router.get('/staff/profile', authenticateJWT, authorizeRole('staff', 'asha', 'admin'), authController.getStaffProfile);
router.put('/staff/profile', authenticateJWT, authorizeRole('staff', 'asha', 'admin'), authController.updateStaffProfile);

// Patient field visits (ASHA visits visible to the patient)
router.get('/patient/field-visits', authenticateJWT, authorizeRole('patient', 'citizen', 'admin'), patientController.getMyFieldVisits);

// Contact Us
router.post('/contact', authController.submitContactMessage);
router.get('/admin/contact-messages', authenticateJWT, authorizeRole('admin'), authController.getContactMessages);
router.patch('/admin/contact-messages/:id', authenticateJWT, authorizeRole('admin'), authController.updateContactMessageStatus);


// 2. AI Voice Triage & Patients
router.post('/triage/voice-parse', authenticateJWT, triageController.parseVoiceTriage);
router.post('/patients/register', authenticateJWT, authorizeRole('staff', 'asha', 'doctor', 'admin'), triageController.registerPatient);
router.post('/patients/:id/field-report', authenticateJWT, authorizeRole('staff', 'asha', 'admin'), triageController.addFieldReport);
router.get('/patients', authenticateJWT, authorizeRole('staff', 'asha', 'doctor', 'admin', 'cmo'), triageController.getPatients);
router.post('/sync-offline', authenticateJWT, authorizeRole('staff', 'asha', 'doctor', 'admin'), triageController.syncOfflineQueue);

// 2.1 Unified Patient Identification & Search (Mobile, SSC, Client ID, QR)
router.post('/patients/search/mobile', authenticateJWT, patientSearchController.searchByMobile);
router.post('/patients/search/ssc', authenticateJWT, patientSearchController.searchBySsc);
router.post('/patients/search/client', authenticateJWT, patientSearchController.searchByClient);
router.post('/patients/lookup/qr', authenticateJWT, patientSearchController.lookupByQr);
router.get('/patients/:id/profile', authenticateJWT, patientSearchController.getUnifiedPatientProfile);

// 3. Healthcare Facilities & Smart Routing
router.get('/facilities/nearby-osm', facilityController.getNearbyOsmFacilities);
router.get('/facilities', authenticateJWT, facilityController.getFacilities);
router.post('/facilities', authenticateJWT, authorizeRole('admin'), facilityController.createFacility);
router.patch('/facilities/:id', authenticateJWT, authorizeRole('admin'), facilityController.updateFacility);
router.delete('/facilities/:id', authenticateJWT, authorizeRole('admin'), facilityController.deleteFacility);
router.post('/facilities/smart-routing', authenticateJWT, facilityController.getSmartRouting);

// 4. Medicine & Supply Inventory (Enhanced with Stock Management & Pharmacist Role)
router.get('/inventory', authenticateJWT, stockController.getInventory);
router.post('/inventory', authenticateJWT, authorizeRole('admin', 'pharmacist'), stockController.stockIn);
router.patch('/inventory/:id/stock', authenticateJWT, authorizeRole('admin', 'pharmacist'), stockController.stockAdjustment);
router.delete('/inventory/:id', authenticateJWT, authorizeRole('admin'), stockController.deleteMedicine);

// 4.1 Medicines, Stock & Transactions
router.get('/medicines', authenticateJWT, stockController.getInventory);
router.get('/stock', authenticateJWT, stockController.getInventory);
router.get('/stock/dashboard', authenticateJWT, authorizeRole('admin', 'pharmacist', 'cmo'), stockController.getStockDashboardMetrics);
router.post('/stock/in', authenticateJWT, stockController.stockIn);
router.post('/stock/adjustment', authenticateJWT, stockController.stockAdjustment);
router.get('/stock/history', authenticateJWT, stockController.getStockTransactions);
router.get('/stock/usage', authenticateJWT, stockController.getMedicineUsage);

// 4.2 Prescriptions & Medicine Dispensing Flow
router.post('/prescriptions', authenticateJWT, authorizeRole('doctor', 'admin'), prescriptionController.createPrescription);
router.get('/prescriptions', authenticateJWT, prescriptionController.getPrescriptions);
router.get('/prescriptions/:id', authenticateJWT, prescriptionController.getPrescriptionById);
router.get('/patients/:id/prescriptions', authenticateJWT, prescriptionController.getPatientPrescriptions);
router.post('/prescriptions/:id/dispense', authenticateJWT, authorizeRole('pharmacist', 'admin'), stockController.dispensePrescription);

// 4.3 Disease & Related Medicines Recommendation
router.get('/diseases', authenticateJWT, diseaseController.getDiseases);
router.post('/diseases', authenticateJWT, authorizeRole('doctor', 'admin'), diseaseController.createDisease);
router.get('/diseases/:id/medicines', authenticateJWT, diseaseController.getDiseaseMedicines);
router.post('/diseases/:id/medicines', authenticateJWT, authorizeRole('doctor', 'admin'), diseaseController.linkDiseaseMedicine);

// 5. Disease Outbreak Surveillance
router.get('/outbreaks', authenticateJWT, outbreakController.getOutbreaks);
router.post('/outbreaks', authenticateJWT, authorizeRole('doctor', 'cmo', 'admin'), outbreakController.createOutbreak);
router.patch('/outbreaks/:id', authenticateJWT, authorizeRole('doctor', 'cmo', 'admin'), outbreakController.updateOutbreakStatus);
router.delete('/outbreaks/:id', authenticateJWT, authorizeRole('admin'), outbreakController.deleteOutbreak);

// 6. Digital Referrals & QR Continuity
router.post('/referrals', authenticateJWT, authorizeRole('doctor', 'staff', 'asha', 'admin'), referralController.createReferral);
router.get('/referrals', authenticateJWT, referralController.getReferrals);
router.get('/referrals/:code', authenticateJWT, referralController.getReferralByCode);
router.patch('/referrals/:id/status', authenticateJWT, authorizeRole('doctor', 'staff', 'admin'), referralController.updateReferralStatus);

// 7. Government / CMO Intelligence Analytics & Audit Logs
router.get('/analytics/dashboard', authenticateJWT, authorizeRole('admin', 'cmo'), analyticsController.getDashboardAnalytics);
router.get('/analytics/stock', authenticateJWT, analyticsController.getDistrictStockAnalytics);
router.get('/analytics/audit-logs', authenticateJWT, authorizeRole('admin', 'cmo'), analyticsController.getAuditLogs);
router.delete('/admin/system-reset', authenticateJWT, authorizeRole('admin'), analyticsController.systemReset);

// Admin Master Data CRUD & Purge Operations
router.get('/admin/stats', authenticateJWT, authorizeRole('admin'), adminDataController.getSystemStats);
router.delete('/admin/patients/:id', authenticateJWT, authorizeRole('admin'), adminDataController.deletePatient);
router.put('/admin/patients/:id', authenticateJWT, authorizeRole('admin'), adminDataController.updatePatient);
router.post('/admin/users', authenticateJWT, authorizeRole('admin'), adminDataController.createUser);
router.put('/admin/users/:id', authenticateJWT, authorizeRole('admin'), adminDataController.updateUser);
router.delete('/admin/users/:id', authenticateJWT, authorizeRole('admin'), adminDataController.deleteUser);
router.delete('/admin/prescriptions/:id', authenticateJWT, authorizeRole('admin'), adminDataController.deletePrescription);
router.delete('/admin/referrals/:id', authenticateJWT, authorizeRole('admin'), adminDataController.deleteReferral);
router.delete('/admin/collections/:collectionName', authenticateJWT, authorizeRole('admin'), adminDataController.purgeCollection);

// 8. Database Status & Maintenance
router.get('/db/status', authenticateJWT, authorizeRole('admin'), configController.getStatus);
router.post('/db/connect', authenticateJWT, authorizeRole('admin'), configController.updateMongoUri);
router.post('/db/seed', authenticateJWT, authorizeRole('admin'), configController.seedAtlasDatabase);
router.post('/db/clean-dummy', authenticateJWT, authorizeRole('admin'), configController.cleanDummyAndSyncRealPatients);

// 9. Doctor Panel, Authentication & Profile Management
router.get('/doctor/profile', authenticateJWT, authorizeRole('doctor', 'admin'), doctorController.getDoctorProfile);
router.post('/doctor/profile', authenticateJWT, authorizeRole('doctor', 'admin'), doctorController.updateDoctorProfile);
router.get('/doctor/patients', authenticateJWT, authorizeRole('doctor'), doctorController.getDoctorPatients);
router.get('/doctor/dashboard-stats', authenticateJWT, authorizeRole('doctor'), doctorController.getDashboardStats);

router.get('/doctor/lookup-phone/:phone', authenticateJWT, authorizeRole('doctor', 'admin', 'staff'), doctorController.lookupDoctorByPhone);
router.get('/doctor/patient-phone/:phone', authenticateJWT, authorizeRole('doctor', 'admin', 'staff'), doctorController.lookupPatientDataByPhone);
router.post('/doctor/send-otp', doctorController.sendEmailOtp);
router.post('/doctor/verify-otp', doctorController.verifyEmailOtp);
router.post('/doctor/google-login', doctorController.googleLogin);

// 10. Patient Medical History, Profile & Follow-Up Reminders
router.get('/doctor/patient-history/:id', authenticateJWT, authorizeRole('doctor', 'admin', 'staff'), doctorController.getPatientHistory);
router.post('/doctor/patient-history/:id', authenticateJWT, authorizeRole('doctor', 'admin', 'staff'), doctorController.addPatientMedicalHistory);
router.post('/doctor/patient-profile/:id', authenticateJWT, authorizeRole('doctor', 'admin', 'staff'), doctorController.updatePatientProfile);
router.post('/doctor/reminder', authenticateJWT, authorizeRole('doctor', 'admin'), doctorController.addFollowUpReminder);
router.get('/doctor/reminders', authenticateJWT, authorizeRole('doctor', 'admin'), doctorController.getDoctorReminders);
router.patch('/doctor/reminder/:id', authenticateJWT, authorizeRole('doctor', 'admin'), doctorController.updateReminderStatus);
router.post('/doctor/reminder/send-otp', authenticateJWT, authorizeRole('doctor', 'admin'), doctorController.sendFollowUpOtp);
router.post('/doctor/reminder/verify-otp', authenticateJWT, authorizeRole('doctor', 'admin'), doctorController.verifyFollowUpOtp);

// 11. Doctor Leave Management & OPD Schedule
router.post('/doctor/leave', authenticateJWT, authorizeRole('doctor', 'admin'), doctorController.submitDoctorLeave);
router.get('/doctor/schedule-leaves', authenticateJWT, authorizeRole('doctor', 'admin'), doctorController.getDoctorScheduleAndLeaves);
router.post('/doctor/schedule', authenticateJWT, authorizeRole('doctor', 'admin'), doctorController.updateDoctorSchedule);

// 12. Patient / Citizen Self-Profile Management
router.get('/patient/profile', authenticateJWT, authorizeRole('patient', 'citizen', 'admin'), patientController.getMyProfile);
router.get('/patient/medical-history', authenticateJWT, authorizeRole('patient', 'citizen', 'admin', 'doctor', 'staff'), patientController.getMyMedicalHistory);
router.get('/patient/prescriptions', authenticateJWT, authorizeRole('patient', 'citizen', 'admin', 'doctor', 'staff'), patientController.getMyPrescriptions);
router.get('/patient/live-stream', patientController.subscribePatientLiveEvents);
router.post('/patient/profile', authenticateJWT, authorizeRole('patient', 'citizen', 'admin'), patientController.updateMyProfile);
router.post('/patient/send-otp', patientController.sendProfileOtp);
router.post('/patient/verify-otp', patientController.verifyProfileOtp);

// Patient Profile Aliases for Mobile & Web Universal API
router.get('/patients/profile/me', authenticateJWT, patientController.getMyProfile);
router.put('/patients/profile/me', authenticateJWT, patientController.updateMyProfile);
router.patch('/patients/profile/me', authenticateJWT, patientController.updateMyProfile);

// 13. Emergency Blood Bank & Donation NGO Finder
router.get('/blood-banks', authenticateJWT, bloodBankController.getBloodBanks);
router.post('/blood-request', authenticateJWT, bloodBankController.createBloodRequest);

// 14. Doctor Follow-Up Checkups (Full Live MongoDB Database CRUD)
router.get('/followups', authenticateJWT, async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');
    const Patient = require('../models/Patient');
    const User = require('../models/User');

    const userId = req.user?.id || req.user?._id;
    const userRole = (req.user?.role || '').toLowerCase();
    const userPhone = req.user?.phone || '';

    // Find linked Patient
    let patient = null;
    if (userId) {
      patient = await Patient.findOne({ $or: [{ userId: userId }, { phone: userPhone }, { id: req.user?.patId }] });
    }

    const followups = [];

    // 1. From Appointment Collection
    const apptQuery = { type: { $in: ['FOLLOW_UP', 'OPD'] } };
    if (userRole === 'patient') {
      const pIds = [];
      if (patient?._id) pIds.push(patient._id);
      if (userId) pIds.push(userId);
      apptQuery['$or'] = [
        { patientId: { $in: pIds } },
        { patientPhone: userPhone }
      ];
    } else if (userRole === 'doctor') {
      apptQuery['$or'] = [
        { doctorId: userId },
        { doctorName: req.user?.name }
      ];
    }

    const appointments = await Appointment.find(apptQuery).sort({ scheduledAt: 1 }).lean();
    appointments.forEach(a => {
      followups.push({
        id: a._id.toString(),
        _id: a._id.toString(),
        patientId: a.patientId?.toString() || (patient?.id || 'PAT-001'),
        patientName: a.patientName || patient?.name || 'Beneficiary',
        patientPhone: a.patientPhone || patient?.phone || '',
        checkupType: a.reason || 'General Doctor Follow-Up',
        checkup_type: a.reason || 'General Doctor Follow-Up',
        reason: a.reason,
        dueDate: a.scheduledAt ? a.scheduledAt.toISOString().split('T')[0] : '',
        scheduledDate: a.scheduledAt ? a.scheduledAt.toISOString().split('T')[0] : '',
        scheduled_date: a.scheduledAt ? a.scheduledAt.toISOString().split('T')[0] : '',
        scheduledTime: a.scheduledAt ? a.scheduledAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '10:30 AM',
        time_slot: '10:30 AM',
        status: a.status || 'SCHEDULED',
        doctorName: a.doctorName || 'Dr. Assigned Specialist',
        doctor_name: a.doctorName || 'Dr. Assigned Specialist',
        notes: a.notes || a.reason || 'Clinical vitals & follow-up'
      });
    });

    // 2. From Patient.followUpReminders
    const patList = patient ? [patient] : await Patient.find({ 'followUpReminders.0': { $exists: true } }).lean();
    patList.forEach(p => {
      (p.followUpReminders || []).forEach(r => {
        followups.push({
          id: r._id?.toString() || r.id || `rem-${Math.random()}`,
          _id: r._id?.toString() || r.id || `rem-${Math.random()}`,
          patientId: p.id || p._id?.toString(),
          patientName: p.name,
          patientPhone: p.phone,
          checkupType: r.reason || r.checkupType || 'Clinical Follow-Up Checkup',
          checkup_type: r.reason || r.checkupType || 'Clinical Follow-Up Checkup',
          reason: r.reason,
          dueDate: r.dueDate || '',
          scheduledDate: r.dueDate || '',
          scheduled_date: r.dueDate || '',
          scheduledTime: r.time || '10:30 AM',
          time_slot: r.time || '10:30 AM',
          status: (r.status || 'SCHEDULED').toUpperCase(),
          doctorName: r.doctorName || 'Dr. Consulting Physician',
          doctor_name: r.doctorName || 'Dr. Consulting Physician',
          notes: r.notes || r.reason || 'Care Continuity Follow-up'
        });
      });
    });

    return res.json({ success: true, data: followups });
  } catch (err) {
    console.error('Error fetching followups:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch follow-ups' });
  }
});

router.post('/followups', authenticateJWT, async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');
    const Patient = require('../models/Patient');
    const User = require('../models/User');

    const {
      scheduled_date,
      time_slot = '10:30 AM',
      checkup_type = 'General Doctor Follow-Up',
      notes = '',
      patient_id,
      doctor_name
    } = req.body;

    const userId = req.user?.id || req.user?._id;
    let patient = await Patient.findOne({ $or: [{ userId: userId }, { phone: req.user?.phone }] });

    if (!patient) {
      patient = await Patient.create({
        userId: userId,
        name: req.user?.name || 'Registered Patient',
        phone: req.user?.phone || '8488877692',
        id: req.user?.patId || `PAT-${Math.floor(100000 + Math.random() * 900000)}`
      });
    }

    const scheduledDateObj = scheduled_date ? new Date(scheduled_date) : new Date();

    // Create Appointment in DB
    const newAppt = await Appointment.create({
      patientId: patient._id,
      doctorId: userId,
      type: 'FOLLOW_UP',
      scheduledAt: scheduledDateObj,
      reason: checkup_type,
      priority: 'NORMAL',
      status: 'SCHEDULED',
      notes: notes,
      patientName: patient.name,
      patientPhone: patient.phone,
      doctorName: doctor_name || 'Dr. Consulting Physician'
    });

    // Also push to Patient.followUpReminders for 100% portal compatibility
    await Patient.updateOne(
      { _id: patient._id },
      {
        $push: {
          followUpReminders: {
            reason: checkup_type,
            dueDate: scheduled_date,
            time: time_slot,
            doctorName: doctor_name || 'Dr. Consulting Physician',
            notes: notes,
            status: 'SCHEDULED',
            createdAt: new Date()
          }
        }
      }
    );

    return res.status(201).json({
      success: true,
      message: 'Doctor follow-up checkup scheduled successfully in MongoDB',
      data: newAppt
    });
  } catch (err) {
    console.error('Error creating followup:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to create follow-up' });
  }
});

router.patch('/followups/:id/status', authenticateJWT, async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');
    const { status } = req.body;
    const appt = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    return res.json({ success: true, message: 'Status updated', data: appt });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// 15. Triage Queue & Clinical Health Records
router.get('/health-records/triage-queue', authenticateJWT, async (req, res) => {
  try {
    const Patient = require('../models/Patient');
    const { priority } = req.query;

    let query = {};
    if (priority && priority.trim()) {
      const pUpper = priority.trim().toUpperCase();
      if (pUpper === 'HIGH' || pUpper === 'CRITICAL') {
        query.$or = [{ riskLevel: { $in: ['HIGH', 'CRITICAL'] } }, { triageCategory: 'RED_EMERGENCY' }];
      } else if (pUpper === 'MEDIUM' || pUpper === 'MODERATE') {
        query.$or = [{ riskLevel: 'MODERATE' }, { triageCategory: 'YELLOW_PRIORITY' }];
      } else if (pUpper === 'LOW') {
        query.$or = [{ riskLevel: 'LOW' }, { triageCategory: 'GREEN_ROUTINE' }];
      }
    }

    const patients = await Patient.find(query).sort({ updatedAt: -1, registrationDate: -1, _id: -1 }).limit(50).lean();

    const formattedQueue = patients.map((p, idx) => {
      let risk = p.riskLevel || 'LOW';
      if (!p.riskLevel) {
        if (p.triageCategory === 'RED_EMERGENCY') risk = 'HIGH';
        else if (p.triageCategory === 'YELLOW_PRIORITY') risk = 'MEDIUM';
        else risk = 'LOW';
      }

      let bpSys = 120;
      let bpDia = 80;
      if (p.vitals && p.vitals.bp) {
        const parts = String(p.vitals.bp).split('/');
        if (parts.length >= 2) {
          bpSys = parseInt(parts[0]) || 120;
          bpDia = parseInt(parts[1]) || 80;
        }
      }

      return {
        id: p._id.toString(),
        patient_id: p.id || p._id.toString(),
        patient_name: p.name || 'Beneficiary',
        age: p.age || 30,
        gender: p.gender || 'Male',
        village: p.village || p.address?.villageTown || 'Gramin PHC Block',
        risk_priority: risk.toUpperCase(),
        symptoms: p.chiefComplaint || (p.symptomTags && p.symptomTags.length > 0 ? p.symptomTags.join(', ') : 'Routine Follow-up & Vitals check'),
        systolic_bp: bpSys,
        diastolic_bp: bpDia,
        spo2: p.vitals?.spo2 || 98,
        temperature: p.vitals?.temp || 98.4,
        heart_rate: p.vitals?.pulse || 72,
        blood_sugar: p.vitals?.sugar || 'Normal',
        triage_category: p.triageCategory || 'GREEN_ROUTINE',
        updated_at: p.updatedAt || p.registrationDate || new Date()
      };
    });

    return res.json({
      success: true,
      count: formattedQueue.length,
      data: formattedQueue
    });
  } catch (err) {
    console.error('Error in triage queue:', err);
    return res.status(500).json({ success: false, message: 'Failed to load triage queue' });
  }
});

router.post('/health-records', authenticateJWT, async (req, res) => {
  try {
    const Patient = require('../models/Patient');
    const {
      patient_id,
      symptoms = '',
      diagnosis_notes = '',
      prescription = '',
      systolic_bp,
      diastolic_bp,
      blood_sugar,
      heart_rate,
      spo2,
      temperature
    } = req.body;

    const patient = await Patient.findOne({
      $or: [
        { id: patient_id },
        { _id: (typeof patient_id === 'string' && patient_id.match(/^[0-9a-fA-F]{24}$/)) ? patient_id : null },
        { phone: patient_id }
      ].filter(Boolean)
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const sys = parseInt(systolic_bp) || 120;
    const dia = parseInt(diastolic_bp) || 80;
    const sp = parseInt(spo2) || 98;
    const temp = parseFloat(temperature) || 98.6;
    let computedRisk = 'LOW';
    let triageCat = 'GREEN_ROUTINE';
    if (sp < 92 || sys >= 160 || temp >= 103) {
      computedRisk = 'CRITICAL';
      triageCat = 'RED_EMERGENCY';
    } else if (sp < 95 || sys >= 140 || temp >= 100) {
      computedRisk = 'MODERATE';
      triageCat = 'YELLOW_PRIORITY';
    }

    patient.vitals = {
      bp: `${sys}/${dia}`,
      spo2: sp,
      temp: temp,
      pulse: parseInt(heart_rate) || 72,
      sugar: blood_sugar || 'Normal'
    };
    patient.riskLevel = computedRisk;
    patient.triageCategory = triageCat;
    if (symptoms) patient.chiefComplaint = symptoms;

    if (!Array.isArray(patient.medicalHistory)) {
      patient.medicalHistory = [];
    }
    patient.medicalHistory.unshift({
      visitDate: new Date(),
      visitType: 'Clinical Assessment',
      facilityName: 'Gramin Health Centre',
      doctorName: req.user?.name || 'Dr. Primary Care Physician',
      diagnosis: diagnosis_notes,
      prescription: prescription ? prescription.split(',').map(s => s.trim()) : [],
      notes: `Symptoms: ${symptoms}. Vitals: BP ${sys}/${dia}, SpO2 ${sp}%, Temp ${temp}°F`
    });

    await patient.save();

    return res.status(201).json({
      success: true,
      message: 'Clinical assessment and AI Risk evaluated!',
      data: {
        risk_priority: computedRisk,
        triage_category: triageCat,
        patient_id: patient.id,
        patient_name: patient.name,
        diagnosis: diagnosis_notes,
        prescription: prescription,
        vitals: patient.vitals
      }
    });
  } catch (err) {
    console.error('Error creating health record:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to submit assessment' });
  }
});

// 16. Cross-PHC Medicine Search & Stock Updates
router.get('/medicines/search-cross-phc', authenticateJWT, async (req, res) => {
  try {
    const Inventory = require('../models/Inventory');
    const { query } = req.query;
    let filter = {};
    if (query && query.trim()) {
      const q = query.trim();
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { genericName: new RegExp(q, 'i') },
        { category: new RegExp(q, 'i') }
      ];
    }
    const medicines = await Inventory.find(filter).lean();
    return res.json({ success: true, count: medicines.length, data: medicines });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to search cross-PHC medicines' });
  }
});

router.patch('/medicines/:id/stock', authenticateJWT, stockController.stockAdjustment);

// 17. General Appointments Endpoints
router.get('/appointments', authenticateJWT, async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');
    const { status } = req.query;
    const query = {};
    if (status && status.trim()) query.status = status.trim().toUpperCase();

    const userId = req.user?.id || req.user?._id;
    const userRole = (req.user?.role || '').toLowerCase();
    if (userRole === 'patient') {
      query.$or = [{ patientId: userId }, { patientPhone: req.user?.phone }];
    } else if (userRole === 'doctor') {
      query.$or = [{ doctorId: userId }, { doctorName: req.user?.name }];
    }

    const appts = await Appointment.find(query).sort({ scheduledAt: -1 }).lean();
    return res.json({ success: true, count: appts.length, data: appts });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load appointments' });
  }
});

router.post('/appointments', authenticateJWT, async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');
    const appt = await Appointment.create(req.body);
    return res.status(201).json({ success: true, data: appt });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to create appointment' });
  }
});

router.patch('/appointments/:id/status', authenticateJWT, async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');
    const { status } = req.body;
    const appt = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    return res.json({ success: true, data: appt });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update appointment' });
  }
});

module.exports = router;

