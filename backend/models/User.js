const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, default: '' }, // optional for Google OAuth users
  googleId: { type: String, default: '' },  // Google OAuth subject ID
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'staff', 'doctor', 'patient', 'asha', 'cmo', 'citizen', 'pharmacist'],
    default: 'patient'
  },
  
  // Role-specific login IDs
  patId: { type: String, sparse: true, unique: true },    // e.g. PAT-482731
  doctorId: { type: String, sparse: true, unique: true }, // e.g. DOC-381642
  staffId: { type: String, sparse: true, unique: true },  // e.g. STF-714205
  associatedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For Staff to link to Doctor

  phone: { type: String, trim: true, index: true },
  email: { type: String, trim: true, lowercase: true, index: true },
  village: { type: String, default: '' },
  facilityId: { type: String, default: '' },
  facilityName: { type: String, default: '' },
  designation: { type: String, default: 'Registered Patient' },

  // Patient profile fields
  profileImage: { type: String, default: '' },
  dateOfBirth: { type: String, default: '' },   // stored as "YYYY-MM-DD" string
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other', 'Not Specified', 'MALE', 'FEMALE', 'OTHER', 'male', 'female', 'other', ''], 
    default: 'Male' 
  },
  bloodGroup: { type: String, default: '' },     // e.g. "O+", "A-", "B+", "AB+"
  emergencyContact: { type: String, default: '' }, // emergency contact phone number
  
  // OTP Management
  resetOtp: { type: String, default: null },
  resetOtpExpiry: { type: Date, default: null },
  resetOtpAttempts: { type: Number, default: 0 },
  lastOtpRequest: { type: Date, default: null }

}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);