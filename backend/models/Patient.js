const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link to Citizen User Account
  name: { type: String, required: true },
  age: { type: Number, default: 30 },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other', 'MALE', 'FEMALE', 'OTHER', 'male', 'female', 'other'], 
    default: 'Male',
    set: (v) => v ? (v.toUpperCase() === 'MALE' ? 'Male' : (v.toUpperCase() === 'FEMALE' ? 'Female' : 'Other')) : 'Male'
  },
  village: { type: String, default: 'Village' },
  ashaWorkerName: { type: String, default: 'ASHA Worker' },
  ashaWorkerContact: { type: String, default: '' },
  guardianName: { type: String, default: '' },
  phone: { type: String, default: '', index: true },
  abhaId: { type: String, default: '', index: true },
  sscCode: { type: String, default: '', trim: true, index: true },
  qrToken: { type: String, trim: true, sparse: true, index: true },
  chiefComplaint: { type: String, default: 'General Consultation' },
  symptomTags: [{ type: String }],
  vitals: {
    bp: { type: String, default: '' },
    spo2: { type: Number, default: null },
    temp: { type: Number, default: null },
    pulse: { type: Number, default: null },
    sugar: { type: String, default: '' }
  },
  riskLevel: { 
    type: String, 
    enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL', 'ROUTINE', 'NORMAL', 'EMERGENCY', 'URGENT', 'Low', 'Moderate', 'High', 'Critical', 'Routine'], 
    default: 'LOW',
    set: (v) => {
      if (!v) return 'LOW';
      const u = String(v).toUpperCase().trim();
      if (u === 'ROUTINE' || u === 'NORMAL' || u === 'LOW') return 'LOW';
      if (u === 'MODERATE') return 'MODERATE';
      if (u === 'HIGH' || u === 'URGENT') return 'HIGH';
      if (u === 'CRITICAL' || u === 'EMERGENCY') return 'CRITICAL';
      return u;
    }
  },
  triageCategory: { type: String, default: 'GREEN_ROUTINE' },
  recommendedFacilityType: { type: String, default: 'PHC' },
  registrationDate: { type: Date, default: Date.now },

  // Patient Profile Extended Fields
  email: { type: String, default: '' },
  dateOfBirth: { type: String, default: '' },
  preferredLanguage: { type: String, default: '' },
  bloodGroup: { type: String, default: 'Unknown' },
  address: {
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    villageTown: { type: String, default: '' },
    pinCode: { type: String, default: '' }
  },
  emergencyContactName: { type: String, default: '' },
  emergencyContactRelation: { type: String, default: '' },
  emergencyContactMobile: { type: String, default: '' },
  
  knownAllergies: [{ type: String }],
  chronicConditions: [{ type: String }],
  currentMedications: [{ type: String }],
  previousMedicalConditions: [{ type: String }],
  previousSurgeries: [{ type: String }],
  disabilityRequirements: { type: String, default: '' },

  consentAccepted: { type: Boolean, default: true },

  currentHealthStatus: {
    condition: { type: String, default: 'Stable' },
    summary: { type: String, default: '' },
    lastEvaluatedAt: { type: Date, default: Date.now }
  },

  // Clinical Visit & Medical History
  medicalHistory: [{
    visitDate: { type: Date, default: Date.now },
    visitType: { type: String, default: 'OPD Consultation' },
    facilityName: { type: String, default: 'Primary Health Centre' },
    doctorName: { type: String, default: 'Dr. Attending Physician' },
    diagnosis: { type: String, default: 'Clinical Consultation' },
    symptoms: { type: mongoose.Schema.Types.Mixed, default: '' },
    prescriptions: [{
      medicine: { type: String, default: '' },
      dosage: { type: String, default: '' },
      frequency: { type: String, default: '' },
      duration: { type: String, default: '' },
      instructions: { type: String, default: '' }
    }],
    treatments: [{ type: String }],
    testReports: [{
      testName: { type: String, default: '' },
      result: { type: String, default: '' },
      normalRange: { type: String, default: '' },
      status: { type: String, default: 'Normal' },
      testDate: { type: Date, default: Date.now }
    }],
    clinicalNotes: { type: String, default: '' },
    vitalsAtVisit: {
      bp: { type: String, default: '' },
      spo2: { type: Number, default: null },
      temp: { type: Number, default: null },
      pulse: { type: Number, default: null },
      sugar: { type: String, default: '' }
    }
  }],

  // Follow-up reminders scheduled by doctor
  followUpReminders: [{
    reminderDate: { type: Date },
    dueDate: { type: Date },
    reason: { type: String, default: '' },
    doctorName: { type: String, default: '' },
    doctorId: { type: String, default: '' },
    status: { type: String, default: 'Pending' },
    instructions: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  }],

  // Access audit logs
  accessLogs: [{
    accessedAt: { type: Date, default: Date.now },
    doctorId: { type: String, default: '' },
    doctorName: { type: String, default: '' },
    role: { type: String, default: 'doctor' },
    purpose: { type: String, default: 'Clinical History Review' }
  }],
  
  // ASHA Field Reports / Visits
  fieldReports: [{
    visitDate: { type: Date, default: Date.now },
    ashaId: { type: String, default: '' },
    ashaName: { type: String, default: '' },
    symptoms: { type: String, default: '' },
    observations: { type: String, default: '' },
    notes: { type: String, default: '' },
    vitals: {
      bp: { type: String, default: '' },
      spo2: { type: Number, default: null },
      temp: { type: Number, default: null },
      pulse: { type: Number, default: null },
      sugar: { type: String, default: '' }
    },
    triageResult: { type: String, default: '' },
    followUpRequirement: { type: String, default: '' },
    referralRequirement: { type: String, default: '' }
  }]
}, { timestamps: true, strict: false });

PatientSchema.pre('save', function (next) {
  if (!this.qrToken) {
    const cleanId = (this.id || '').replace(/\D/g, '').slice(-6) || Math.floor(100000 + Math.random() * 900000);
    this.qrToken = `SEC-QR-${cleanId}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  if (!this.sscCode) {
    const stateCode = 'GJ';
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    this.sscCode = `SSC-${stateCode}-2026-${randomSuffix}`;
  }
  next();
});

module.exports = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
