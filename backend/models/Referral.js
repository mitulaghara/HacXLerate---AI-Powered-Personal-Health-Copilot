const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  referralCode: { type: String, required: true, unique: true },
  referral_code: { type: String }, // Snake_case alias for legacy indexes / compatibility
  patientId: { type: mongoose.Schema.Types.Mixed, ref: 'Patient', required: true }, // Mixed to allow both String (PAT-xxxx) and ObjectId
  patientName: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, default: 'Female' },
  village: { type: String, required: true },
  referringUnit: { type: String, required: true },
  referringFacilityId: { type: mongoose.Schema.Types.Mixed, ref: 'Facility' },
  referringStaff: { type: String, default: 'ASHA Worker' },
  referredToFacilityId: { type: mongoose.Schema.Types.Mixed, ref: 'Facility' },
  referredToFacilityName: { type: String, required: true },
  referralReason: { type: String, required: true },
  provisionalDiagnosis: { type: String, default: 'Under Observation' },
  priority: { 
    type: String, 
    enum: ['ROUTINE_GREEN', 'HIGH_YELLOW', 'EMERGENCY_RED', 'ROUTINE', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL', 'EMERGENCY'], 
    default: 'HIGH_YELLOW' 
  },
  status: { type: String, enum: ['Initiated', 'In-Transit', 'Received', 'Doctor_Attended', 'Admitted', 'Discharged', 'Completed'], default: 'Initiated' },
  initiatedAt: { type: Date, default: Date.now },
  transportArranged: { type: String, default: 'Local Assistance / Private' },
  vitalsSnapshot: {
    bp: { type: String, default: '120/80' },
    spo2: { type: Number, default: 98 },
    temp: { type: Number, default: 98.4 },
    pulse: { type: Number, default: 72 }
  },
  doctorHandoffNotes: { type: String, default: '' },
  timeline: [
    {
      time: { type: String, required: true },
      stage: { type: String, required: true },
      by: { type: String, required: true }
    }
  ]
}, { timestamps: true });

delete mongoose.models.Referral;
module.exports = mongoose.model('Referral', ReferralSchema);
