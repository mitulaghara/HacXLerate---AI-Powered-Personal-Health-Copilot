// ----------------------------------------------------
// Added for strictly scoped Doctor Panel Data Access
// ----------------------------------------------------

exports.getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.user.doctorId || req.user.id;
    if (!doctorId) {
      return res.status(403).json({ success: false, message: 'Doctor ID not found in session.' });
    }

    const { search } = req.query;

    // 1. Get from Patient collection directly (medicalHistory, followUpReminders, accessLogs)
    const directPatients = await Patient.find({
      $or: [
        { 'medicalHistory.doctorId': doctorId },
        { 'followUpReminders.doctorId': doctorId },
        { 'accessLogs.doctorId': doctorId }
      ]
    });

    // 2. Get from Prescription collection
    const Prescription = require('../models/Prescription');
    const rxPatientIds = await Prescription.distinct('patientId', { doctorId });

    // 3. Get from Referral collection
    const Referral = require('../models/Referral');
    const refPatientIds = await Referral.distinct('patientId', { 
      $or: [{ referringDoctorId: doctorId }, { referredToDoctorId: doctorId }] 
    });

    // 4. Combine IDs and fetch remaining patients
    const directIds = directPatients.map(p => p.id);
    const allIds = [...new Set([...directIds, ...rxPatientIds, ...refPatientIds])];
    const remainingIds = allIds.filter(id => !directIds.includes(id));

    let allPatients = [...directPatients];
    if (remainingIds.length > 0) {
      const remainingPatients = await Patient.find({ id: { $in: remainingIds } });
      allPatients = allPatients.concat(remainingPatients);
    }

    // Apply search filter if provided
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      allPatients = allPatients.filter(p => 
        (p.name && p.name.toLowerCase().includes(s)) ||
        (p.id && p.id.toLowerCase().includes(s)) ||
        (p.phone && p.phone.includes(s)) ||
        (p.abhaId && p.abhaId.toLowerCase().includes(s))
      );
    }

    // Sort by registrationDate descending
    allPatients.sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));

    return res.json({ success: true, count: allPatients.length, data: allPatients });
  } catch (error) {
    console.error('getDoctorPatients error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const doctorId = req.user.doctorId || req.user.id;
    if (!doctorId) {
      return res.status(403).json({ success: false, message: 'Doctor ID not found in session.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Get all connected patients first
    const directPatients = await Patient.find({
      $or: [
        { 'medicalHistory.doctorId': doctorId },
        { 'followUpReminders.doctorId': doctorId },
        { 'accessLogs.doctorId': doctorId }
      ]
    });

    const Prescription = require('../models/Prescription');
    const rxPatientIds = await Prescription.distinct('patientId', { doctorId });

    const Referral = require('../models/Referral');
    const refPatientIds = await Referral.distinct('patientId', { 
      $or: [{ referringDoctorId: doctorId }, { referredToDoctorId: doctorId }] 
    });

    const directIds = directPatients.map(p => p.id);
    const allIds = [...new Set([...directIds, ...rxPatientIds, ...refPatientIds])];

    let allPatients = [...directPatients];
    const remainingIds = allIds.filter(id => !directIds.includes(id));
    if (remainingIds.length > 0) {
      const remainingPatients = await Patient.find({ id: { $in: remainingIds } });
      allPatients = allPatients.concat(remainingPatients);
    }

    // Calculate Todays Patients (patients who have a medical history visit today by this doctor, or registered today and linked to this doctor)
    // Wait, simpler: just count patients whose updatedAt or registrationDate is today, or any visit is today.
    // Let's do: count how many patients have a visitDate today in medicalHistory with this doctorId.
    let todaysPatientsCount = 0;
    allPatients.forEach(p => {
      const hasVisitToday = p.medicalHistory && p.medicalHistory.some(m => 
        m.doctorId === doctorId && m.visitDate && new Date(m.visitDate).toISOString().startsWith(todayStr)
      );
      if (hasVisitToday) todaysPatientsCount++;
    });

    // Pending Follow-Ups
    const pendingFollowUps = await Patient.aggregate([
      { $unwind: "$followUpReminders" },
      { $match: { 
          "followUpReminders.doctorId": doctorId,
          "followUpReminders.status": "PENDING"
        }
      },
      { $count: "count" }
    ]);
    const pendingFollowUpsCount = pendingFollowUps.length > 0 ? pendingFollowUps[0].count : 0;

    // Pending Referrals
    const pendingReferralsCount = await Referral.countDocuments({
      referredToDoctorId: doctorId,
      status: 'PENDING'
    });
    
    // Completed Consultations
    let completedConsultationsCount = 0;
    allPatients.forEach(p => {
      if (p.medicalHistory) {
        completedConsultationsCount += p.medicalHistory.filter(m => m.doctorId === doctorId).length;
      }
    });

    return res.json({
      success: true,
      stats: {
        todaysPatients: todaysPatientsCount,
        pendingConsultations: allPatients.length - completedConsultationsCount > 0 ? (allPatients.length - completedConsultationsCount) : 0, 
        completedConsultations: completedConsultationsCount,
        pendingFollowUps: pendingFollowUpsCount,
        pendingReferrals: pendingReferralsCount,
        notifications: pendingFollowUpsCount + pendingReferralsCount, // Example
        totalConnectedPatients: allPatients.length
      }
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
