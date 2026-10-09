const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  patientCode: {
    type: String,
    default: '',
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'DoctorProfile'
  },
  facilityId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'Facility'
  },
  visitDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  visitType: {
    type: String,
    default: 'OPD Consultation'
  },

  // Clinical diagnosis
  diagnosis: {
    type: String,
    required: true
  },
  symptoms: {
    type: mongoose.Schema.Types.Mixed,
    default: ''
  },
  clinicalNotes: {
    type: String,
    default: ''
  },

  // Prescriptions (Digital Rx)
  prescriptions: [{
    medicine: { type: String, default: '' },
    dosage: { type: String, default: '' },
    frequency: { type: String, default: '' },
    duration: { type: String, default: '' },
    instructions: { type: String, default: '' }
  }],

  // Treatments administered
  treatments: [{ type: String }],

  // Lab / diagnostic test reports
  testReports: [{
    testName: { type: String, default: '' },
    result: { type: String, default: '' },
    normalRange: { type: String, default: '' },
    status: {
      type: String,
      default: 'Normal'
    },
    testDate: { type: Date, default: Date.now }
  }],

  // Vitals captured during this visit
  vitalsAtVisit: {
    bp: { type: String },
    spo2: { type: Number },
    temp: { type: Number },
    pulse: { type: Number },
    sugar: { type: String }
  },

  referralId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'Referral'
  },

  doctorName: { type: String, default: '' },
  facilityName: { type: String, default: '' }

}, { timestamps: true, strict: false });

MedicalRecordSchema.index({ patientId: 1, visitDate: -1 });
MedicalRecordSchema.index({ patientCode: 1, visitDate: -1 });

module.exports = mongoose.models.MedicalRecord || mongoose.model('MedicalRecord', MedicalRecordSchema);
