const mongoose = require('mongoose');

const MedicalDocumentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  patientCode: {
    type: String,
    default: '',
    index: true
  },
  patientName: {
    type: String,
    default: ''
  },
  
  // Storage & file metadata
  originalFilename: {
    type: String,
    required: true
  },
  sanitizedFilename: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  storagePath: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    default: ''
  },

  // Document category
  documentCategory: {
    type: String,
    enum: ['blood_test', 'diagnostic_lab', 'prescription', 'discharge_summary', 'other'],
    default: 'other',
    index: true
  },

  // Lifecycle processing status
  status: {
    type: String,
    enum: ['UPLOADED', 'PROCESSING', 'OCR_COMPLETED', 'REQUIRES_REVIEW', 'VERIFIED', 'FAILED'],
    default: 'UPLOADED',
    index: true
  },
  verificationStatus: {
    type: String,
    enum: ['UNVERIFIED', 'MANUALLY_VERIFIED', 'REQUIRES_REVIEW'],
    default: 'UNVERIFIED',
    index: true
  },

  // OCR Pipeline metadata
  ocrEngine: {
    type: String,
    default: 'hybrid' // 'pdf-parse' | 'tesseract.js' | 'hybrid'
  },
  ocrConfidence: {
    type: Number,
    default: null // null if engine does not supply confidence
  },
  confidenceCategory: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW', 'UNAVAILABLE'],
    default: 'UNAVAILABLE'
  },
  rawOcrText: {
    type: String,
    default: ''
  },

  // Structured Medical Fields
  extractedData: {
    general: {
      documentType: { type: String, default: '' },
      documentDate: { type: String, default: '' },
      patientName: { type: String, default: '' },
      patientIdMatched: { type: String, default: '' },
      facilityOrLabName: { type: String, default: '' },
      doctorName: { type: String, default: '' },
      sourcePages: { type: Number, default: 1 }
    },
    bloodAndLabTests: [{
      testName: { type: String, default: '' },
      measuredValue: { type: String, default: '' },
      unit: { type: String, default: '' },
      referenceRange: { type: String, default: '' },
      abnormalFlag: { type: String, default: 'NORMAL' }, // 'NORMAL', 'HIGH', 'LOW', 'ABNORMAL', 'CRITICAL'
      sampleDate: { type: String, default: '' },
      confidence: { type: String, default: 'UNAVAILABLE' },
      isVerified: { type: Boolean, default: false },
      originalSnippet: { type: String, default: '' },
      wasCorrected: { type: Boolean, default: false }
    }],
    prescriptions: [{
      medicineName: { type: String, default: '' },
      formulation: { type: String, default: '' }, // Tab, Syrup, Inj, Cap
      dosage: { type: String, default: '' },
      frequency: { type: String, default: '' },
      duration: { type: String, default: '' },
      route: { type: String, default: 'Oral' },
      instructions: { type: String, default: '' },
      confidence: { type: String, default: 'UNAVAILABLE' },
      isVerified: { type: Boolean, default: false },
      originalSnippet: { type: String, default: '' },
      wasCorrected: { type: Boolean, default: false }
    }],
    dischargeSummary: {
      admissionDate: { type: String, default: '' },
      dischargeDate: { type: String, default: '' },
      hospitalName: { type: String, default: '' },
      doctorName: { type: String, default: '' },
      diagnoses: [{ type: String }],
      procedures: [{ type: String }],
      treatments: [{ type: String }],
      dischargeMedicines: [{ type: String }],
      followUpInstructions: { type: String, default: '' },
      wasCorrected: { type: Boolean, default: false }
    },
    clinicalNotes: { type: String, default: '' }
  },

  // AI-Assisted Structured Extraction Metadata
  aiExtraction: {
    status: {
      type: String,
      enum: ['COMPLETED', 'FAILED', 'UNAVAILABLE', 'NOT_ATTEMPTED'],
      default: 'NOT_ATTEMPTED'
    },
    modelUsed: { type: String, default: '' },
    summary: { type: String, default: '' },
    error: { type: String, default: '' },
    extractedAt: { type: Date }
  },

  // Manual Audit Trail for corrections
  userCorrections: [{
    field: { type: String, required: true },
    originalValue: { type: mongoose.Schema.Types.Mixed },
    correctedValue: { type: mongoose.Schema.Types.Mixed },
    correctedBy: { type: String, default: 'patient' },
    correctedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' }
  }],

  // Verification metadata
  verifiedBy: {
    userId: { type: String, default: '' },
    userName: { type: String, default: '' },
    role: { type: String, default: '' },
    verifiedAt: { type: Date }
  },

  // Link to patient timeline MedicalRecord entry
  linkedMedicalRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord'
  },

  errorMessage: {
    type: String,
    default: ''
  },

  processingLogs: [{
    timestamp: { type: Date, default: Date.now },
    stage: { type: String, default: '' },
    message: { type: String, default: '' }
  }]

}, {
  timestamps: true,
  strict: false
});

MedicalDocumentSchema.index({ patientId: 1, createdAt: -1 });
MedicalDocumentSchema.index({ userId: 1, createdAt: -1 });
MedicalDocumentSchema.index({ documentCategory: 1, createdAt: -1 });

module.exports = mongoose.models.MedicalDocument || mongoose.model('MedicalDocument', MedicalDocumentSchema);
