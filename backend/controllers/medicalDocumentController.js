const fs = require('fs');
const path = require('path');
const multer = require('multer');
const MedicalDocument = require('../models/MedicalDocument');
const Patient = require('../models/Patient');
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const ocrService = require('../services/ocrService');
const { logAudit } = require('../middleware/authMiddleware');

// Ensure local secure upload directory exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'medical_documents');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage configuration with sanitized filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    let cleanName = file.originalname;
    try {
      cleanName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch {}
    cleanName = cleanName.replace(/[\u202f\u00a0]/g, ' ').replace(/[^a-zA-Z0-9._ -]/g, '_');
    cb(null, `med_doc_${timestamp}_${cleanName}`);
  }
});

// File filter for allowed extensions and MIME types
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Supported document formats are PDF, JPG, and PNG only.'), false);
  }
};

// Max 15MB limit
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }
});

/**
 * Helper: Resolve the active patient record for the request
 */
const resolvePatientForUser = async (req) => {
  const user = await User.findById(req.user.id || req.user._id);
  if (!user) return null;

  const role = (user.role || '').toLowerCase();

  // If doctor or admin uploading or inspecting for a specific patient
  if ((role === 'doctor' || role === 'admin' || role === 'staff' || role === 'cmo') && (req.body.patientId || req.query.patientId || req.params.patientId)) {
    const targetPatId = req.body.patientId || req.query.patientId || req.params.patientId;
    const pat = await Patient.findOne({
      $or: [
        { id: targetPatId },
        { _id: targetPatId.match(/^[0-9a-fA-F]{24}$/) ? targetPatId : null }
      ]
    });
    if (pat) {
      return { user, patient: pat };
    }
  }

  // Patient / Citizen accessing their own records
  const cleanPhone = (user.phone || '').replace(/\D/g, '').slice(-10);
  const patId = `PAT-${cleanPhone.slice(-6) || user._id.toString().slice(-6).toUpperCase()}`;

  let patient = await Patient.findOne({
    $or: [
      { userId: user._id },
      { id: patId },
      ...(user.phone ? [{ phone: user.phone }] : []),
      ...(cleanPhone ? [{ phone: new RegExp(cleanPhone) }] : [])
    ]
  });

  // If patient profile doesn't exist yet, lazily create one for this citizen user
  if (!patient) {
    patient = await Patient.create({
      id: patId,
      userId: user._id,
      name: user.name || 'Citizen Patient',
      phone: user.phone || '',
      email: user.email || '',
      chiefComplaint: 'Medical Record Hub Patient'
    });
  }

  return { user, patient };
};

/**
 * POST /api/medical-documents/upload
 * Upload document, trigger real OCR & baseline extraction pipeline
 */
exports.uploadMedicalDocument = [
  upload.single('document'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No medical document file provided for upload.' });
      }

      const resolved = await resolvePatientForUser(req);
      if (!resolved || !resolved.patient) {
        // Clean up file if user resolution fails
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ success: false, message: 'Patient profile not found.' });
      }

      const { user, patient } = resolved;
      const documentCategory = req.body.documentCategory || 'other';

      let cleanDisplayName = req.file.originalname;
      try {
        cleanDisplayName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      } catch {}
      cleanDisplayName = cleanDisplayName.replace(/[\u202f\u00a0]/g, ' ');

      // Create initial DB record
      const medicalDoc = new MedicalDocument({
        patientId: patient.id,
        userId: user._id,
        patientCode: patient.id,
        patientName: patient.name,
        originalFilename: cleanDisplayName,
        sanitizedFilename: req.file.filename,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        storagePath: req.file.path,
        documentCategory,
        status: 'PROCESSING',
        verificationStatus: 'UNVERIFIED',
        processingLogs: [{
          stage: 'UPLOAD',
          message: `Document received and saved to secure storage: ${req.file.originalname}`
        }]
      });

      await medicalDoc.save();

      // Trigger OCR & Structured Extraction asynchronously / synchronously
      try {
        const ocrResult = await ocrService.processDocument({
          filePath: req.file.path,
          mimeType: req.file.mimetype,
          originalFilename: req.file.originalname,
          documentCategory
        });

        medicalDoc.rawOcrText = ocrResult.rawOcrText;
        medicalDoc.ocrEngine = ocrResult.ocrEngine;
        medicalDoc.ocrConfidence = ocrResult.ocrConfidence;
        medicalDoc.confidenceCategory = ocrResult.confidenceCategory;
        medicalDoc.extractedData = ocrResult.extractedData;
        medicalDoc.aiExtraction = ocrResult.aiExtraction;
        medicalDoc.status = ocrResult.status;
        medicalDoc.verificationStatus = ocrResult.verificationStatus;
        if (ocrResult.processingLogs) {
          medicalDoc.processingLogs.push(...ocrResult.processingLogs);
        }

        await medicalDoc.save();

        await logAudit({
          action: 'MEDICAL_DOCUMENT_UPLOAD',
          req,
          patientId: patient.id,
          resource: 'MedicalDocument',
          details: { docId: medicalDoc._id, category: documentCategory, filename: req.file.originalname }
        });

        return res.status(201).json({
          success: true,
          message: 'Document uploaded and analyzed successfully.',
          document: medicalDoc
        });
      } catch (ocrError) {
        console.error('OCR pipeline error:', ocrError);
        medicalDoc.status = 'FAILED';
        medicalDoc.errorMessage = ocrError.message;
        medicalDoc.processingLogs.push({
          stage: 'ERROR',
          message: `OCR processing failure: ${ocrError.message}`
        });
        await medicalDoc.save();

        return res.status(201).json({
          success: true,
          message: 'Document uploaded, but OCR processing encountered an issue. You can retry processing or review manually.',
          document: medicalDoc
        });
      }
    } catch (err) {
      console.error('uploadMedicalDocument error:', err);
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(500).json({ success: false, message: err.message || 'Internal server error during upload.' });
    }
  }
];

/**
 * GET /api/medical-documents
 * List all medical documents for authenticated patient
 */
exports.getMyMedicalDocuments = async (req, res) => {
  try {
    const resolved = await resolvePatientForUser(req);
    if (!resolved || !resolved.patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const { patient } = resolved;
    const { category, search } = req.query;

    const query = {
      $or: [
        { patientId: patient.id },
        { patientCode: patient.id },
        { userId: resolved.user._id }
      ]
    };

    if (category && category !== 'all') {
      query.documentCategory = category;
    }

    let documents = await MedicalDocument.find(query).sort({ createdAt: -1 });

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      documents = documents.filter(doc =>
        (doc.originalFilename && doc.originalFilename.toLowerCase().includes(s)) ||
        (doc.extractedData?.general?.facilityOrLabName && doc.extractedData.general.facilityOrLabName.toLowerCase().includes(s)) ||
        (doc.extractedData?.general?.doctorName && doc.extractedData.general.doctorName.toLowerCase().includes(s)) ||
        (doc.rawOcrText && doc.rawOcrText.toLowerCase().includes(s))
      );
    }

    return res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (err) {
    console.error('getMyMedicalDocuments error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/medical-documents/:id
 * Retrieve full details of a specific medical document
 */
exports.getMedicalDocumentById = async (req, res) => {
  try {
    const resolved = await resolvePatientForUser(req);
    if (!resolved) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Medical document not found.' });
    }

    // Patient authorization check: verify user owns document or is doctor/admin
    const userRole = (resolved.user.role || '').toLowerCase();
    const isOwner = doc.userId?.toString() === resolved.user._id.toString() ||
                    doc.patientId === resolved.patient?.id ||
                    doc.patientCode === resolved.patient?.id;

    if (!isOwner && !['admin', 'doctor', 'cmo', 'staff'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not have permission to view this document.' });
    }

    return res.json({
      success: true,
      document: doc
    });
  } catch (err) {
    console.error('getMedicalDocumentById error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/medical-documents/:id/file
 * Securely stream document file for preview or download (authorized access only)
 */
exports.streamMedicalDocumentFile = async (req, res) => {
  try {
    const resolved = await resolvePatientForUser(req);
    if (!resolved) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Medical document not found.' });
    }

    // Authorization check
    const userRole = (resolved.user.role || '').toLowerCase();
    const isOwner = doc.userId?.toString() === resolved.user._id.toString() ||
                    doc.patientId === resolved.patient?.id ||
                    doc.patientCode === resolved.patient?.id;

    if (!isOwner && !['admin', 'doctor', 'cmo', 'staff'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not have permission to access this file.' });
    }

    // Path traversal check
    const safePath = path.resolve(doc.storagePath);
    if (!safePath.startsWith(path.resolve(UPLOAD_DIR))) {
      return res.status(400).json({ success: false, message: 'Invalid document storage path.' });
    }

    if (!fs.existsSync(safePath)) {
      return res.status(404).json({ success: false, message: 'Physical document file not found on server.' });
    }

    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.originalFilename)}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const fileStream = fs.createReadStream(safePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('streamMedicalDocumentFile error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/medical-documents/:id/corrections
 * Update corrected extracted fields and maintain audit trail
 */
exports.updateMedicalDocumentCorrections = async (req, res) => {
  try {
    const resolved = await resolvePatientForUser(req);
    if (!resolved) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Medical document not found.' });
    }

    const userRole = (resolved.user.role || '').toLowerCase();
    const isOwner = doc.userId?.toString() === resolved.user._id.toString() ||
                    doc.patientId === resolved.patient?.id;

    if (!isOwner && !['admin', 'doctor'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { correctedData, auditNote } = req.body;
    if (!correctedData) {
      return res.status(400).json({ success: false, message: 'No correction data provided.' });
    }

    // Record audit trail
    if (!doc.userCorrections) doc.userCorrections = [];
    doc.userCorrections.push({
      field: 'extractedData',
      originalValue: doc.extractedData,
      correctedValue: correctedData,
      correctedBy: resolved.user.name || resolved.user.role || 'patient',
      correctedAt: new Date(),
      note: auditNote || 'User manual corrections applied.'
    });

    // Update structured data
    doc.extractedData = correctedData;
    doc.verificationStatus = 'MANUALLY_VERIFIED';
    doc.status = 'REQUIRES_REVIEW'; // Remains in review until explicit verification confirmation

    await doc.save();

    await logAudit({
      action: 'MEDICAL_DOCUMENT_CORRECTION',
      req,
      patientId: doc.patientId,
      resource: 'MedicalDocument',
      details: { docId: doc._id }
    });

    return res.json({
      success: true,
      message: 'Corrections saved successfully and audit trail logged.',
      document: doc
    });
  } catch (err) {
    console.error('updateMedicalDocumentCorrections error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/medical-documents/:id/verify
 * Mark document as manually verified and synchronize with patient's MedicalRecord timeline
 */
exports.verifyMedicalDocument = async (req, res) => {
  try {
    const resolved = await resolvePatientForUser(req);
    if (!resolved) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Medical document not found.' });
    }

    const userRole = (resolved.user.role || '').toLowerCase();
    const isOwner = doc.userId?.toString() === resolved.user._id.toString() ||
                    doc.patientId === resolved.patient?.id;

    if (!isOwner && !['admin', 'doctor'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    doc.status = 'VERIFIED';
    doc.verificationStatus = 'MANUALLY_VERIFIED';
    doc.verifiedBy = {
      userId: resolved.user._id.toString(),
      userName: resolved.user.name || 'Patient',
      role: resolved.user.role || 'patient',
      verifiedAt: new Date()
    };

    // Mark all child items as verified
    if (doc.extractedData?.bloodAndLabTests) {
      doc.extractedData.bloodAndLabTests.forEach(t => { t.isVerified = true; });
    }
    if (doc.extractedData?.prescriptions) {
      doc.extractedData.prescriptions.forEach(p => { p.isVerified = true; });
    }

    // Synchronize to MedicalRecord collection and patient.medicalHistory
    try {
      const extracted = doc.extractedData || {};
      const visitDate = extracted.general?.documentDate ? new Date(extracted.general.documentDate) : doc.createdAt;
      const validVisitDate = isNaN(visitDate.getTime()) ? new Date() : visitDate;

      // Transform lab tests
      const testReports = (extracted.bloodAndLabTests || []).map(t => ({
        testName: t.testName || 'Lab Test',
        result: `${t.measuredValue || ''} ${t.unit || ''}`.trim(),
        normalRange: t.referenceRange || '',
        status: t.abnormalFlag === 'HIGH' || t.abnormalFlag === 'LOW' || t.abnormalFlag === 'ABNORMAL' ? 'Abnormal' : 'Normal',
        testDate: validVisitDate
      }));

      // Transform prescriptions
      const prescriptions = (extracted.prescriptions || []).map(p => ({
        medicine: `${p.formulation ? p.formulation + ' ' : ''}${p.medicineName} ${p.dosage || ''}`.trim(),
        dosage: p.dosage || '',
        frequency: p.frequency || 'Once daily',
        duration: p.duration || 'As prescribed',
        instructions: p.instructions || ''
      }));

      const newMedicalRecord = await MedicalRecord.create({
        patientId: resolved.patient._id,
        patientCode: resolved.patient.id,
        visitDate: validVisitDate,
        visitType: extracted.general?.documentType || 'Uploaded Health Record',
        facilityName: extracted.general?.facilityOrLabName || 'Diagnostic Centre / Clinic',
        doctorName: extracted.general?.doctorName || 'Consultant Physician',
        diagnosis: extracted.dischargeSummary?.diagnoses?.join(', ') || extracted.general?.documentType || 'Medical Report',
        clinicalNotes: `${extracted.clinicalNotes || ''} (Verified from uploaded document: ${doc.originalFilename})`.trim(),
        testReports,
        prescriptions,
        treatments: extracted.dischargeSummary?.treatments || []
      });

      doc.linkedMedicalRecordId = newMedicalRecord._id;

      // Also mirror to patient.medicalHistory array
      if (!resolved.patient.medicalHistory) resolved.patient.medicalHistory = [];
      resolved.patient.medicalHistory.unshift({
        _id: newMedicalRecord._id,
        visitDate: validVisitDate,
        visitType: newMedicalRecord.visitType,
        facilityName: newMedicalRecord.facilityName,
        doctorName: newMedicalRecord.doctorName,
        diagnosis: newMedicalRecord.diagnosis,
        clinicalNotes: newMedicalRecord.clinicalNotes,
        testReports,
        prescriptions
      });
      await resolved.patient.save();
    } catch (syncErr) {
      console.warn('Sync to MedicalRecord warning:', syncErr.message);
    }

    await doc.save();

    await logAudit({
      action: 'MEDICAL_DOCUMENT_VERIFY',
      req,
      patientId: doc.patientId,
      resource: 'MedicalDocument',
      details: { docId: doc._id }
    });

    return res.json({
      success: true,
      message: 'Medical document verified and synchronized with patient health record timeline.',
      document: doc
    });
  } catch (err) {
    console.error('verifyMedicalDocument error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/medical-documents/:id/retry
 * Retry OCR and structured extraction pipeline
 */
exports.retryMedicalDocumentProcessing = async (req, res) => {
  try {
    const resolved = await resolvePatientForUser(req);
    if (!resolved) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Medical document not found.' });
    }

    if (!fs.existsSync(doc.storagePath)) {
      return res.status(400).json({ success: false, message: 'Physical document file missing on server. Please upload again.' });
    }

    doc.status = 'PROCESSING';
    doc.errorMessage = '';
    doc.processingLogs.push({ stage: 'RETRY', message: 'User requested OCR retry' });
    await doc.save();

    try {
      const ocrResult = await ocrService.processDocument({
        filePath: doc.storagePath,
        mimeType: doc.mimeType,
        originalFilename: doc.originalFilename,
        documentCategory: doc.documentCategory
      });

      doc.rawOcrText = ocrResult.rawOcrText;
      doc.ocrEngine = ocrResult.ocrEngine;
      doc.ocrConfidence = ocrResult.ocrConfidence;
      doc.confidenceCategory = ocrResult.confidenceCategory;
      doc.extractedData = ocrResult.extractedData;
      doc.aiExtraction = ocrResult.aiExtraction;
      doc.status = ocrResult.status;
      doc.verificationStatus = ocrResult.verificationStatus;
      if (ocrResult.processingLogs) {
        doc.processingLogs.push(...ocrResult.processingLogs);
      }

      await doc.save();

      return res.json({
        success: true,
        message: 'OCR retry completed successfully.',
        document: doc
      });
    } catch (retryErr) {
      doc.status = 'FAILED';
      doc.errorMessage = retryErr.message;
      doc.processingLogs.push({ stage: 'RETRY_FAIL', message: retryErr.message });
      await doc.save();

      return res.status(500).json({ success: false, message: `Retry failed: ${retryErr.message}`, document: doc });
    }
  } catch (err) {
    console.error('retryMedicalDocumentProcessing error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/medical-documents/:id
 * Delete document and remove physical file
 */
exports.deleteMedicalDocument = async (req, res) => {
  try {
    const resolved = await resolvePatientForUser(req);
    if (!resolved) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Medical document not found.' });
    }

    const userRole = (resolved.user.role || '').toLowerCase();
    const isOwner = doc.userId?.toString() === resolved.user._id.toString() ||
                    doc.patientId === resolved.patient?.id;

    if (!isOwner && !['admin', 'doctor'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Delete file if exists
    if (doc.storagePath && fs.existsSync(doc.storagePath)) {
      try { fs.unlinkSync(doc.storagePath); } catch (e) {}
    }

    await MedicalDocument.findByIdAndDelete(doc._id);

    await logAudit({
      action: 'MEDICAL_DOCUMENT_DELETE',
      req,
      patientId: doc.patientId,
      resource: 'MedicalDocument',
      details: { docId: doc._id }
    });

    return res.json({
      success: true,
      message: 'Medical document removed successfully.'
    });
  } catch (err) {
    console.error('deleteMedicalDocument error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/medical-documents/configure-ai
 * Save or update OpenAI or Gemini API Key
 */
exports.configureAiKey = async (req, res) => {
  try {
    const { provider, apiKey, model } = req.body;
    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({ success: false, message: 'API key is required.' });
    }

    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    if (provider === 'gemini') {
      process.env.GEMINI_API_KEY = apiKey.trim();
      if (model) process.env.GEMINI_MODEL = model;
      if (envContent.includes('GEMINI_API_KEY=')) {
        envContent = envContent.replace(/GEMINI_API_KEY=.*(\r?\n|$)/, `GEMINI_API_KEY=${apiKey.trim()}\n`);
      } else {
        envContent += `\nGEMINI_API_KEY=${apiKey.trim()}\n`;
      }
    } else {
      process.env.OPENAI_API_KEY = apiKey.trim();
      if (model) process.env.OPENAI_MODEL = model;
      if (envContent.includes('OPENAI_API_KEY=')) {
        envContent = envContent.replace(/OPENAI_API_KEY=.*(\r?\n|$)/, `OPENAI_API_KEY=${apiKey.trim()}\n`);
      } else {
        envContent += `\nOPENAI_API_KEY=${apiKey.trim()}\n`;
      }
    }

    fs.writeFileSync(envPath, envContent);
    const aiMedicalService = require('../services/aiMedicalService');
    aiMedicalService.refreshClients();

    return res.json({
      success: true,
      message: `${provider === 'gemini' ? 'Google Gemini' : 'OpenAI'} API Key configured successfully!`,
      activeProvider: aiMedicalService.getActiveProvider()
    });
  } catch (err) {
    console.error('configureAiKey error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/medical-documents/:id/re-analyze
 * Re-analyze document with AI
 */
exports.reAnalyzeDocument = async (req, res) => {
  try {
    const doc = await MedicalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const aiMedicalService = require('../services/aiMedicalService');
    const aiResult = await aiMedicalService.extractStructuredMedicalData(
      doc.rawOcrText,
      doc.documentCategory,
      doc.extractedData,
      doc.ocrEngine,
      doc.ocrConfidence
    );

    doc.aiExtraction = {
      status: aiResult.status || 'COMPLETED',
      modelUsed: aiResult.modelUsed,
      summary: aiResult.summary,
      error: aiResult.error || '',
      extractedAt: new Date()
    };

    if (aiResult.extractedData && aiResult.modelUsed !== 'GraminArogya Clinical Intelligence') {
      const ocrService = require('../services/ocrService');
      doc.extractedData = ocrService.mergeAIWithBaseline(doc.extractedData, aiResult.extractedData, doc.ocrConfidence);
    }

    await doc.save();

    return res.json({
      success: true,
      message: 'Document re-analyzed with AI successfully!',
      document: doc
    });
  } catch (err) {
    console.error('reAnalyzeDocument error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
