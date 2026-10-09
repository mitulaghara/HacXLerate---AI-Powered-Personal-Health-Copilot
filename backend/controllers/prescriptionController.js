const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Inventory = require('../models/Inventory');
const { logAudit } = require('../middleware/authMiddleware');

// 1. Create New Prescription (Doctor Panel)
exports.createPrescription = async (req, res) => {
  try {
    const {
      patientId,
      diagnosis,
      diseaseId,
      clinicalNotes,
      medicines = [],
      followUpDate,
      facilityName
    } = req.body;

    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient ID is required.' });
    }

    if (!diagnosis || !diagnosis.trim()) {
      return res.status(400).json({ success: false, message: 'Clinical diagnosis is required to prescribe medicines.' });
    }

    if (!medicines || medicines.length === 0) {
      return res.status(400).json({ success: false, message: 'Prescription must contain at least one medicine.' });
    }

    // Robust prioritized lookup for the Patient
    let patient = null;
    const cleanId = String(patientId).trim();
    const cleanDigits = cleanId.replace(/\D/g, '').slice(-10);

    const orList = [
      { id: cleanId },
      { phone: cleanId }
    ];
    if (cleanDigits && cleanDigits.length >= 6) {
      orList.push({ phone: { $regex: cleanDigits } });
      orList.push({ id: { $regex: cleanDigits } });
      orList.push({ id: `PAT-${cleanDigits.slice(-6)}` });
    }
    if (req.body.patientName) {
      orList.push({ name: req.body.patientName.trim() });
    }
    if (cleanId.match(/^[0-9a-fA-F]{24}$/)) {
      orList.push({ _id: cleanId });
      orList.push({ userId: cleanId });
    }

    patient = await Patient.findOne({ $or: orList });

    if (!patient) {
      // Check if there is a registered User account and auto-create linked Patient doc
      const User = require('../models/User');
      const userOr = [{ username: cleanId }];
      if (cleanDigits) userOr.push({ phone: { $regex: cleanDigits } });
      if (req.body.patientName) userOr.push({ name: req.body.patientName.trim() });

      const matchedUser = await User.findOne({ $or: userOr });
      if (matchedUser) {
        const uClean6 = (matchedUser.phone || cleanDigits || '').replace(/\D/g, '').slice(-6);
        const patId = `PAT-${uClean6 || matchedUser._id.toString().slice(-6).toUpperCase()}`;

        // Check if Patient already exists for this matchedUser
        patient = await Patient.findOne({
          $or: [
            { userId: matchedUser._id },
            { id: patId },
            { phone: matchedUser.phone }
          ]
        });

        if (!patient) {
          patient = new Patient({
            id: patId,
            userId: matchedUser._id,
            name: matchedUser.name || req.body.patientName || 'Patient',
            age: Number(req.body.patientAge) || 28,
            gender: req.body.patientGender || matchedUser.gender || 'Female',
            village: matchedUser.village || 'Gramin Village',
            phone: matchedUser.phone || cleanDigits,
            bloodGroup: matchedUser.bloodGroup || 'B+',
            chiefComplaint: diagnosis.trim(),
            vitals: { bp: '120/80', spo2: 98, temp: 98.4, pulse: 72, sugar: 'Normal' },
            currentHealthStatus: { condition: 'Under Active Treatment', summary: 'Prescription formulated', lastEvaluatedAt: new Date() },
            riskLevel: 'LOW',
            registrationDate: new Date()
          });
          await patient.save();
        } else if (!patient.userId) {
          patient.userId = matchedUser._id;
          await patient.save();
        }
      }
    }

    if (!patient) {
      return res.status(404).json({ success: false, message: `Patient with ID or Phone "${patientId}" does not exist.` });
    }

    const doctorId = req.user?.id || req.body.doctorId || 'DOC-ATTENDING';
    const doctorName = req.user?.name || req.body.doctorName || 'Dr. Attending Physician';
    const facility = facilityName || req.user?.facilityName || 'Primary Health Centre';

    // Format and sanitize medicines
    const formattedMedicines = medicines.map(m => {
      const prescribedQty = Number(m.prescribedQty) || Number(m.quantity) || 10;
      return {
        medicineId: m.medicineId || `MED-${Math.floor(100 + Math.random() * 900)}`,
        medicineName: m.medicineName || m.name || 'Prescribed Medicine',
        genericName: m.genericName || '',
        dosageForm: m.dosageForm || 'Tablet',
        dosage: m.dosage || '1 tab',
        frequency: m.frequency || 'Twice daily',
        duration: m.duration || '5 days',
        instructions: m.instructions || 'After food',
        prescribedQty,
        dispensedQty: 0,
        status: 'Pending',
        batchHistory: []
      };
    });

    const prescriptionId = `RX-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const newPrescription = new Prescription({
      prescriptionId,
      userId: patient.userId || null,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      patientPhone: patient.phone || cleanDigits,
      doctorId,
      doctorName,
      facilityId: req.user?.facilityId || 'FAC-PHC-001',
      facilityName: facility,
      diagnosis: diagnosis.trim(),
      diseaseId: diseaseId || '',
      clinicalNotes: clinicalNotes || '',
      medicines: formattedMedicines,
      status: 'Prescribed',
      prescribedAt: new Date(),
      followUpDate: followUpDate ? new Date(followUpDate) : null
    });

    await newPrescription.save();

    // Automatically sync clinical visit into Patient's medical history (if not already logged recently)
    const visitEntry = {
      visitDate: new Date(),
      visitType: 'OPD Clinical Consultation',
      facilityName: facility,
      doctorName,
      doctorId,
      diagnosis: diagnosis.trim(),
      symptoms: patient.chiefComplaint,
      prescriptions: formattedMedicines.map(m => ({
        medicine: `${m.medicineName} (${m.dosage})`,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions
      })),
      treatments: ['Physical Examination', 'Prescription Formulated'],
      clinicalNotes: clinicalNotes || `Prescription #${prescriptionId} generated.`
    };

    if (!patient.medicalHistory) patient.medicalHistory = [];
    const now = new Date();
    const isDuplicateVisit = patient.medicalHistory.some(v => {
      const visitTime = new Date(v.visitDate).getTime();
      const isRecent = (now.getTime() - visitTime) < 10 * 60 * 1000;
      return isRecent && v.diagnosis?.toLowerCase().trim() === diagnosis.trim().toLowerCase();
    });

    if (!isDuplicateVisit) {
      patient.medicalHistory.unshift(visitEntry);
    }

    // Update patient current condition
    patient.currentHealthStatus = {
      condition: 'Under Active Treatment',
      summary: `Consultation with ${doctorName}: Diagnosed with ${diagnosis.trim()}. Prescribed ${formattedMedicines.length} medication(s).`,
      lastEvaluatedAt: new Date()
    };

    // If followUpDate provided, also add follow-up reminder
    if (followUpDate) {
      if (!patient.followUpReminders) patient.followUpReminders = [];
      patient.followUpReminders.unshift({
        dueDate: new Date(followUpDate),
        doctorId,
        doctorName,
        reason: `Follow-up evaluation for ${diagnosis.trim()}`,
        priority: 'NORMAL',
        status: 'PENDING',
        createdAt: new Date()
      });
    }

    await patient.save();

    // Mirror to MedicalRecord collection for maximum persistence
    try {
      const MedicalRecord = require('../models/MedicalRecord');
      await MedicalRecord.create({
        patientId: patient._id,
        patientCode: patient.id,
        doctorId: req.user?.id || null,
        doctorName: doctorName,
        facilityName: facility,
        visitDate: visitEntry.visitDate,
        visitType: visitEntry.visitType,
        diagnosis: visitEntry.diagnosis,
        symptoms: visitEntry.symptoms,
        prescriptions: visitEntry.prescriptions,
        treatments: visitEntry.treatments,
        clinicalNotes: visitEntry.clinicalNotes,
        vitalsAtVisit: patient.vitals || {}
      });
    } catch (mrErr) {
      console.warn('MedicalRecord mirror note in prescription creation:', mrErr.message);
    }

    // Real-time broadcast to patient's active screen/SSE stream
    try {
      const patientController = require('./patientController');
      if (typeof patientController.broadcastToPatient === 'function') {
        patientController.broadcastToPatient(
          {
            userId: patient.userId,
            phone: patient.phone || cleanDigits,
            patientId: patient.id
          },
          {
            type: 'PRESCRIPTION_ADDED',
            prescription: newPrescription,
            patientId: patient.id,
            timestamp: new Date().toISOString()
          }
        );
      }
    } catch (bcErr) {
      console.warn('Realtime broadcast note:', bcErr.message);
    }

    // Audit log
    await logAudit({
      action: 'PRESCRIPTION_CREATE',
      req,
      patientId: patient.id,
      resource: prescriptionId,
      details: { diagnosis, medicinesCount: formattedMedicines.length },
      status: 'SUCCESS'
    });

    return res.status(201).json({
      success: true,
      message: `Prescription #${prescriptionId} created and synced with patient medical history!`,
      prescription: newPrescription,
      patient
    });
  } catch (error) {
    console.error('createPrescription error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Prescriptions (Search / Filter)
exports.getPrescriptions = async (req, res) => {
  try {
    const { patientId, doctorId, status } = req.query;
    const filter = {};
    const userRole = req.user?.role || 'doctor';

    // Role-based privacy: Citizens/Patients can only fetch their own prescriptions
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

      filter.patientId = patient.id;
    } else {
      if (patientId) filter.patientId = patientId;
      if (doctorId) filter.doctorId = doctorId;
    }
    if (status) filter.status = status;

    const list = await Prescription.find(filter).sort({ prescribedAt: -1 });
    return res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    console.error('getPrescriptions error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Prescription by ID (with live stock status for each medicine)
exports.getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const prescription = await Prescription.findOne({
      $or: [{ prescriptionId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!prescription) {
      return res.status(404).json({ success: false, message: `Prescription (${id}) not found.` });
    }

    // Check live inventory stock for each prescribed medicine
    const medicineIds = prescription.medicines.map(m => m.medicineId);
    const inventories = await Inventory.find({
      $or: [
        { id: { $in: medicineIds } },
        { name: { $in: prescription.medicines.map(m => m.medicineName) } }
      ]
    });

    const inventoryMap = new Map();
    inventories.forEach(inv => {
      inventoryMap.set(inv.id, inv);
      inventoryMap.set(inv.name.toLowerCase(), inv);
    });

    const enrichedMedicines = prescription.medicines.map(item => {
      const inv = inventoryMap.get(item.medicineId) || inventoryMap.get(item.medicineName.toLowerCase());
      const remainingQty = Math.max(0, item.prescribedQty - item.dispensedQty);
      const isExpired = inv?.expiryDate ? new Date(inv.expiryDate) <= new Date() : false;

      return {
        ...item.toObject(),
        remainingQty,
        availableStock: inv ? inv.stockQty : 0,
        batchNumber: inv ? inv.batchNumber : 'N/A',
        expiryDate: inv ? inv.expiryDate : null,
        isExpired,
        stockStatus: isExpired ? 'Expired' : (inv ? inv.status : 'Out of Stock')
      };
    });

    return res.json({
      success: true,
      prescription: {
        ...prescription.toObject(),
        medicines: enrichedMedicines
      }
    });
  } catch (error) {
    console.error('getPrescriptionById error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get all prescriptions for a specific patient
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role || 'doctor';

    // Role-based authorization: Patient / Citizen can only view their own prescriptions
    if (['citizen', 'patient'].includes(userRole)) {
      const cleanUserPhone = (req.user?.phone || '').replace(/\D/g, '').slice(-10);
      const targetPatient = await Patient.findOne({
        $or: [
          { id: id },
          ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : []),
          ...(cleanUserPhone ? [{ phone: { $regex: cleanUserPhone } }] : [])
        ]
      });

      const isOwner = targetPatient && (
        (targetPatient.userId && (targetPatient.userId.toString() === req.user?.id?.toString() || targetPatient.userId.toString() === req.user?._id?.toString())) ||
        targetPatient.id === id ||
        (cleanUserPhone && targetPatient.phone && targetPatient.phone.replace(/\D/g, '').slice(-10) === cleanUserPhone) ||
        (req.user?.name && targetPatient.name && req.user.name.toLowerCase() === targetPatient.name.toLowerCase())
      );

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own prescriptions.'
        });
      }
    }

    const prescriptions = await Prescription.find({
      $or: [{ patientId: id }, { patientPhone: id }]
    }).sort({ prescribedAt: -1 });
    return res.json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (error) {
    console.error('getPatientPrescriptions error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
