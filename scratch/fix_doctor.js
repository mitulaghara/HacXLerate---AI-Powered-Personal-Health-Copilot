const fs = require('fs');
let code = fs.readFileSync('backend/controllers/doctorController.js', 'utf8');

const replacement = `// 1. Get Doctor Profile - Strictly from Database
exports.getDoctorProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const orConditions = [{ userId: req.user.id }];
    if (req.user.doctorId) orConditions.push({ doctorId: req.user.doctorId });
    if (req.user.email) orConditions.push({ email: req.user.email });
    if (req.user.phone) {
      const cleanP = String(req.user.phone).replace(/\\D/g, '').slice(-10);
      if (cleanP) orConditions.push({ phone: { $regex: cleanP } });
    }

    const profile = await DoctorProfile.findOne({ $or: orConditions });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found for this authenticated user.' });
    }

    return res.json({ success: true, profile: profile });
  } catch (error) {
    console.error('getDoctorProfile error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};`;

const startIdx = code.indexOf('// 1. Get Doctor Profile - Strictly from Database');
let endStr = '  }\n};';
let endIdx = code.indexOf(endStr, startIdx);
if (endIdx !== -1) {
    endIdx += endStr.length;
}

if(startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
  fs.writeFileSync('backend/controllers/doctorController.js', code);
  console.log('Successfully replaced getDoctorProfile');
} else {
  console.log('Could not find marker', startIdx, endIdx);
}
