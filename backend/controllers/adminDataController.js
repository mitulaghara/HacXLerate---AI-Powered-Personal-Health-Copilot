const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Facility = require('../models/Facility');
const Inventory = require('../models/Inventory');
const Outbreak = require('../models/DiseaseOutbreak');
const Prescription = require('../models/Prescription');
const Referral = require('../models/Referral');
const StockTransaction = require('../models/StockTransaction');
const MedicineDispensing = require('../models/MedicineDispensing');
const AuditLog = require('../models/AuditLog');
const { logAudit } = require('../middleware/authMiddleware');

function getSafeQuery(id) {
  if (!id) return { _id: new mongoose.Types.ObjectId() };
  const cleanId = decodeURIComponent(String(id)).replace(/^#/, '').trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(cleanId) && String(new mongoose.Types.ObjectId(cleanId)) === String(cleanId);
  return {
    $or: [
      { id: cleanId },
      { id: id },
      { prescriptionId: cleanId },
      { prescriptionId: `#${cleanId}` },
      { referralCode: cleanId },
      ...(isObjectId ? [{ _id: cleanId }] : [])
    ]
  };
}

async function generateUniqueAccountId(role) {
  const roleLower = (role || '').toLowerCase();
  let prefix = 'STF';
  let field = 'staffId';

  if (roleLower === 'doctor') {
    prefix = 'DOC';
    field = 'doctorId';
  } else if (roleLower === 'asha') {
    prefix = 'ASHA';
    field = 'staffId';
  } else if (roleLower === 'pharmacist') {
    prefix = 'PHM';
    field = 'staffId';
  } else if (roleLower === 'patient' || roleLower === 'citizen') {
    prefix = 'PAT';
    field = 'patId';
  } else if (roleLower === 'admin' || roleLower === 'cmo') {
    prefix = 'ADM';
    field = 'username';
  }

  let unique = false;
  let accountId = '';
  while (!unique) {
    const num = Math.floor(100000 + Math.random() * 900000);
    accountId = `${prefix}-${num}`;
    const existing = await User.findOne({
      $or: [
        { [field]: accountId },
        { username: accountId },
        { doctorId: accountId },
        { staffId: accountId },
        { patId: accountId }
      ]
    });
    if (!existing) unique = true;
  }
  return { accountId, field };
}

// 1. Get System Database Overview Counts & Stats
exports.getSystemStats = async (req, res) => {
  try {
    const [
      patientsCount,
      usersCount,
      facilitiesCount,
      inventoryCount,
      outbreaksCount,
      prescriptionsCount,
      referralsCount,
      auditLogsCount
    ] = await Promise.all([
      Patient.countDocuments(),
      User.countDocuments(),
      Facility.countDocuments(),
      Inventory.countDocuments(),
      Outbreak.countDocuments(),
      Prescription.countDocuments(),
      Referral.countDocuments(),
      AuditLog.countDocuments()
    ]);

    return res.json({
      success: true,
      stats: {
        patients: patientsCount,
        users: usersCount,
        facilities: facilitiesCount,
        inventory: inventoryCount,
        outbreaks: outbreaksCount,
        prescriptions: prescriptionsCount,
        referrals: referralsCount,
        auditLogs: auditLogsCount
      }
    });
  } catch (error) {
    console.error('getSystemStats error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Patient CRUD: Delete Single Patient
exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const query = getSafeQuery(id);
    const patient = await Patient.findOne(query);

    if (!patient) {
      return res.status(404).json({ success: false, message: `Patient with ID ${id} not found.` });
    }

    await Patient.deleteOne({ _id: patient._id });

    await logAudit({
      action: 'ADMIN_DELETE_PATIENT',
      req,
      resource: patient.id || String(patient._id),
      details: { patientName: patient.name, deletedBy: req.user?.username || req.user?.name },
      status: 'SUCCESS'
    });

    return res.json({
      success: true,
      message: `Patient ${patient.name} (${patient.id || patient._id}) successfully deleted.`
    });
  } catch (error) {
    console.error('deletePatient error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Patient CRUD: Update Patient
exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const query = getSafeQuery(id);
    const patient = await Patient.findOne(query);

    if (!patient) {
      return res.status(404).json({ success: false, message: `Patient with ID ${id} not found.` });
    }

    const {
      name,
      age,
      gender,
      phone,
      village,
      riskLevel,
      chiefComplaint,
      triageCategory,
      bloodGroup
    } = req.body;

    if (name) patient.name = name.trim();
    if (age !== undefined) patient.age = Number(age);
    if (gender) patient.gender = gender;
    if (phone) patient.phone = phone.trim();
    if (village !== undefined) patient.village = village.trim();
    if (riskLevel) {
      const rl = String(riskLevel).toUpperCase().trim();
      patient.riskLevel = (rl === 'ROUTINE' || rl === 'NORMAL' || rl === 'LOW') ? 'LOW' :
                          (rl === 'CRITICAL' || rl === 'EMERGENCY') ? 'CRITICAL' :
                          (rl === 'HIGH' || rl === 'URGENT') ? 'HIGH' :
                          (rl === 'MODERATE') ? 'MODERATE' : 'LOW';
    }
    if (chiefComplaint !== undefined) patient.chiefComplaint = chiefComplaint;
    if (triageCategory) patient.triageCategory = triageCategory;
    if (bloodGroup !== undefined) patient.bloodGroup = bloodGroup;

    await patient.save();

    await logAudit({
      action: 'ADMIN_UPDATE_PATIENT',
      req,
      resource: patient.id || String(patient._id),
      details: { patientName: patient.name, updatedFields: req.body },
      status: 'SUCCESS'
    });

    return res.json({
      success: true,
      message: `Patient ${patient.name} successfully updated.`,
      patient
    });
  } catch (error) {
    console.error('updatePatient error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. User CRUD: Delete Single User
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = decodeURIComponent(String(id || '')).trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(cleanId) && String(new mongoose.Types.ObjectId(cleanId)) === String(cleanId);
    const query = {
      $or: [
        { username: cleanId },
        { doctorId: cleanId },
        { staffId: cleanId },
        { patId: cleanId },
        ...(isObjectId ? [{ _id: cleanId }] : [])
      ]
    };

    const targetUser = await User.findOne(query);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: `User not found.` });
    }

    // Safety: Prevent deleting self
    if (req.user && String(targetUser._id) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own logged-in admin account.' });
    }

    // Safety: Prevent deleting the primary admin
    if (targetUser.username === 'admin' && targetUser.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete the master root admin account.' });
    }

    await User.deleteOne({ _id: targetUser._id });

    await logAudit({
      action: 'ADMIN_DELETE_USER',
      req,
      resource: targetUser.username,
      details: { deletedUser: targetUser.name, role: targetUser.role },
      status: 'SUCCESS'
    });

    return res.json({
      success: true,
      message: `User ${targetUser.name} (@${targetUser.username}) deleted successfully.`
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. User CRUD: Update User
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = decodeURIComponent(String(id || '')).trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(cleanId) && String(new mongoose.Types.ObjectId(cleanId)) === String(cleanId);
    const query = {
      $or: [
        { username: cleanId },
        { doctorId: cleanId },
        { staffId: cleanId },
        { patId: cleanId },
        ...(isObjectId ? [{ _id: cleanId }] : [])
      ]
    };

    const targetUser = await User.findOne(query);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: `User not found.` });
    }

    const { name, role, designation, phone, village, facilityId, doctorId, staffId, patId, officialId } = req.body;

    if (name) targetUser.name = name.trim();
    if (role && targetUser.username !== 'admin') targetUser.role = role.toLowerCase();
    if (designation !== undefined) targetUser.designation = designation;
    if (phone !== undefined) targetUser.phone = phone.trim();
    if (village !== undefined) targetUser.village = village.trim();
    if (facilityId !== undefined) targetUser.facilityId = facilityId;

    // Official ID Policy: Generated ONCE at account creation and IMMUTABLE.
    // Never allow changing an already generated doctorId, staffId, or patId.
    const requestedId = (officialId || doctorId || staffId || patId || '').trim();

    if (targetUser.role === 'doctor') {
      if (!targetUser.doctorId) {
        // Backfill once if missing on legacy record
        if (requestedId) {
          targetUser.doctorId = requestedId;
        } else {
          const gen = await generateUniqueAccountId('doctor');
          targetUser.doctorId = gen.accountId;
        }
      }
      // targetUser.doctorId is immutable once set

      // Sync DoctorProfile
      try {
        await DoctorProfile.findOneAndUpdate(
          { $or: [{ doctorId: targetUser.doctorId }, { userId: targetUser._id }] },
          {
            doctorId: targetUser.doctorId,
            userId: targetUser._id,
            doctorName: targetUser.name,
            phone: targetUser.phone || '9999999999',
            specialization: targetUser.designation || 'General Physician',
            facilityId: targetUser.facilityId || 'FAC-PHC-001'
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn('DoctorProfile sync error:', err.message);
      }
    } else if (targetUser.role === 'patient' || targetUser.role === 'citizen') {
      if (!targetUser.patId) {
        if (requestedId) {
          targetUser.patId = requestedId;
        } else {
          const gen = await generateUniqueAccountId('patient');
          targetUser.patId = gen.accountId;
        }
      }
      // targetUser.patId is immutable once set
    } else {
      // staff, asha, pharmacist, etc.
      if (!targetUser.staffId) {
        if (requestedId) {
          targetUser.staffId = requestedId;
        } else {
          const gen = await generateUniqueAccountId(targetUser.role);
          targetUser.staffId = gen.accountId;
        }
      }
      // targetUser.staffId is immutable once set
    }

    await targetUser.save();

    await logAudit({
      action: 'ADMIN_UPDATE_USER',
      req,
      resource: targetUser.username,
      details: { updatedUser: targetUser.name, role: targetUser.role },
      status: 'SUCCESS'
    });

    return res.json({
      success: true,
      message: `User ${targetUser.name} updated successfully.`,
      user: targetUser
    });
  } catch (error) {
    console.error('updateUser error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. User CRUD: Create User (Admin directly creates staff, doctor, pharmacist, or asha with auto-generated official ID)
exports.createUser = async (req, res) => {
  try {
    const { name, username, password, role, designation, phone, village, facilityId, officialId } = req.body;

    if (!name || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, password, and role are required.' });
    }

    const roleLower = role.toLowerCase().trim();

    // Generate or use provided official ID
    let finalId = (officialId || '').trim();
    if (!finalId) {
      const generated = await generateUniqueAccountId(roleLower);
      finalId = generated.accountId;
    }

    // Determine final username: if username provided use that, else use the official ID!
    let finalUsername = (username || '').trim().toLowerCase();
    if (!finalUsername) {
      finalUsername = finalId.toLowerCase();
    }

    // Check for username collision
    const existing = await User.findOne({
      $or: [
        { username: finalUsername },
        ...(finalId ? [
          { doctorId: finalId },
          { staffId: finalId },
          { patId: finalId }
        ] : [])
      ]
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `An account with username or official ID "${finalUsername}" / "${finalId}" already exists.`
      });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name: name.trim(),
      username: finalUsername,
      password: hashedPassword,
      role: roleLower,
      designation: designation || (roleLower === 'doctor' ? 'Medical Officer' : roleLower === 'asha' ? 'ASHA Health Worker' : roleLower === 'pharmacist' ? 'Pharmacist' : 'Healthcare Staff'),
      phone: (phone || '').trim(),
      village: (village || '').trim(),
      facilityId: facilityId || 'FAC-PHC-001'
    };

    if (roleLower === 'doctor') {
      userData.doctorId = finalId;
    } else if (roleLower === 'patient' || roleLower === 'citizen') {
      userData.patId = finalId;
    } else {
      userData.staffId = finalId;
    }

    const newUser = new User(userData);
    await newUser.save();

    // If role is doctor, auto-create matching DoctorProfile
    if (roleLower === 'doctor') {
      try {
        const docProfileData = {
          doctorId: finalId,
          userId: newUser._id,
          doctorName: newUser.name,
          phone: newUser.phone || '9999999999',
          specialization: designation || 'General Physician',
          qualification: 'MBBS',
          registrationNumber: `REG-${finalId}`,
          medicalCouncil: 'State Medical Council',
          facilityId: facilityId || 'FAC-PHC-001',
          clinicName: `${newUser.name}'s OPD Clinic`
        };
        await DoctorProfile.findOneAndUpdate(
          { doctorId: finalId },
          docProfileData,
          { upsert: true, new: true }
        );
      } catch (err) {
        console.warn('Could not auto-create DoctorProfile for new doctor user:', err.message);
      }
    }

    await logAudit({
      action: 'ADMIN_CREATE_USER',
      req,
      resource: newUser.username,
      details: { createdUser: newUser.name, role: newUser.role, officialId: finalId },
      status: 'SUCCESS'
    });

    return res.status(201).json({
      success: true,
      message: `User ${newUser.name} created successfully! Official ID: ${finalId}`,
      user: newUser,
      officialId: finalId
    });
  } catch (error) {
    console.error('createUser error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Prescription CRUD: Delete Single Prescription
exports.deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = decodeURIComponent(String(id || '')).replace(/^#/, '').trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(cleanId) && String(new mongoose.Types.ObjectId(cleanId)) === String(cleanId);

    const query = {
      $or: [
        { prescriptionId: cleanId },
        { prescriptionId: `#${cleanId}` },
        { prescriptionId: id },
        { id: cleanId },
        { id: id },
        ...(isObjectId ? [{ _id: cleanId }] : [])
      ]
    };

    const rx = await Prescription.findOne(query);

    if (!rx) {
      return res.status(404).json({ success: false, message: 'Prescription not found.' });
    }

    await Prescription.deleteOne({ _id: rx._id });

    // Clean up related dispensing records if any exist
    try {
      if (rx.prescriptionId) {
        await MedicineDispensing.deleteMany({ prescriptionId: rx.prescriptionId });
      }
    } catch (dispenseErr) {
      console.warn('MedicineDispensing cleanup error:', dispenseErr.message);
    }

    await logAudit({
      action: 'ADMIN_DELETE_PRESCRIPTION',
      req,
      resource: rx.prescriptionId || String(rx._id),
      details: { patientName: rx.patientName, doctorName: rx.doctorName },
      status: 'SUCCESS'
    });

    return res.json({ success: true, message: `Prescription #${rx.prescriptionId || rx._id} deleted.` });
  } catch (error) {
    console.error('deletePrescription error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Referral CRUD: Delete Single Referral
exports.deleteReferral = async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = decodeURIComponent(String(id || '')).replace(/^#/, '').trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(cleanId) && String(new mongoose.Types.ObjectId(cleanId)) === String(cleanId);

    const query = {
      $or: [
        { referralCode: cleanId },
        { referralCode: `#${cleanId}` },
        { referralCode: id },
        { id: cleanId },
        { id: id },
        ...(isObjectId ? [{ _id: cleanId }] : [])
      ]
    };

    const ref = await Referral.findOne(query);

    if (!ref) {
      return res.status(404).json({ success: false, message: 'Referral record not found.' });
    }

    await Referral.deleteOne({ _id: ref._id });

    await logAudit({
      action: 'ADMIN_DELETE_REFERRAL',
      req,
      resource: ref.referralCode || ref.id,
      details: { patientName: ref.patientName, referringUnit: ref.referringUnit },
      status: 'SUCCESS'
    });

    return res.json({ success: true, message: `Referral #${ref.referralCode || ref.id} deleted.` });
  } catch (error) {
    console.error('deleteReferral error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Bulk Purge Specific Collection
exports.purgeCollection = async (req, res) => {
  try {
    const { collectionName } = req.params;
    const { confirmKeyword } = req.body;

    if (confirmKeyword !== 'CONFIRM_PURGE') {
      return res.status(400).json({
        success: false,
        message: 'Security check failed. Please supply confirmKeyword: "CONFIRM_PURGE".'
      });
    }

    let deletedCount = 0;
    const coll = collectionName.toLowerCase();

    switch (coll) {
      case 'patients': {
        const result = await Patient.deleteMany({});
        deletedCount = result.deletedCount;
        break;
      }
      case 'users': {
        // Purge non-admin users only
        const result = await User.deleteMany({ role: { $ne: 'admin' } });
        deletedCount = result.deletedCount;
        break;
      }
      case 'facilities': {
        const result = await Facility.deleteMany({});
        deletedCount = result.deletedCount;
        break;
      }
      case 'inventory': {
        const result = await Inventory.deleteMany({});
        deletedCount = result.deletedCount;
        break;
      }
      case 'outbreaks': {
        const result = await Outbreak.deleteMany({});
        deletedCount = result.deletedCount;
        break;
      }
      case 'prescriptions': {
        const result = await Prescription.deleteMany({});
        deletedCount = result.deletedCount;
        break;
      }
      case 'referrals': {
        const result = await Referral.deleteMany({});
        deletedCount = result.deletedCount;
        break;
      }
      case 'stock-transactions': {
        const result = await StockTransaction.deleteMany({});
        deletedCount = result.deletedCount;
        break;
      }
      case 'dispensing': {
        const result = await MedicineDispensing.deleteMany({});
        deletedCount = result.deletedCount;
        break;
      }
      case 'audit-logs': {
        const result = await AuditLog.deleteMany({});
        deletedCount = result.deletedCount;
        break;
      }
      default:
        return res.status(400).json({ success: false, message: `Unknown collection: "${collectionName}".` });
    }

    await logAudit({
      action: 'ADMIN_PURGE_COLLECTION',
      req,
      resource: collectionName.toUpperCase(),
      details: { deletedCount, purgedBy: req.user?.username || req.user?.name },
      status: 'SUCCESS'
    });

    return res.json({
      success: true,
      message: `Successfully cleared all records in ${collectionName}. ${deletedCount} document(s) deleted.`,
      deletedCount
    });
  } catch (error) {
    console.error('purgeCollection error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
