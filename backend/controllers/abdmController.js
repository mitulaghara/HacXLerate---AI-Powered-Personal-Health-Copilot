const abdmFhirService = require('../services/abdmFhirService');
const MedicalDocument = require('../models/MedicalDocument');
const Patient = require('../models/Patient');
const mongoose = require('mongoose');

/**
 * Controller for ABDM (Ayushman Bharat Digital Mission) FHIR Endpoints
 */
class ABDMController {
  /**
   * GET /api/abdm/fhir/document/:id
   * Export a single medical document as an ABDM-compliant FHIR R4 Document Bundle
   */
  async exportDocumentFhir(req, res) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ success: false, message: 'Invalid Document ID format' });
      }
      const doc = await MedicalDocument.findById(id);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      let patient = {};
      if (doc.patientId) {
        patient = await Patient.findById(doc.patientId) || {};
      }

      const fhirBundle = abdmFhirService.convertToFhirBundle(doc, patient);
      res.setHeader('Content-Type', 'application/fhir+json');
      res.setHeader('Content-Disposition', `attachment; filename="abdm_fhir_${doc._id}.json"`);
      return res.status(200).json(fhirBundle);
    } catch (err) {
      console.error('FHIR export error:', err);
      return res.status(500).json({ success: false, message: 'Failed to generate FHIR Bundle', error: err.message });
    }
  }

  /**
   * POST /api/abdm/link-abha
   * Link or create a Mock ABHA ID for the patient
   */
  async linkAbha(req, res) {
    try {
      const { patientId, customAbhaId, customAbhaAddress } = req.body;
      const targetId = patientId || req.user?.id || req.user?._id;

      let patient = null;
      if (targetId) {
        if (mongoose.Types.ObjectId.isValid(targetId)) {
          patient = await Patient.findById(targetId);
        }
        if (!patient) {
          patient = await Patient.findOne({ $or: [{ patientId: targetId }, { id: targetId }, { phone: req.user?.phone }] });
        }
      }
      if (!patient && req.user?.email) {
        patient = await Patient.findOne({ email: req.user.email });
      }

      const generatedAbha = customAbhaId || abdmFhirService.generateMockAbhaId();
      const generatedAddress = customAbhaAddress || abdmFhirService.generateMockAbhaAddress(patient?.name || 'patient');

      if (patient) {
        patient.abhaId = generatedAbha;
        patient.sscCode = generatedAddress;
        await patient.save();
      }

      return res.status(200).json({
        success: true,
        message: 'ABHA ID successfully linked to patient profile! 🇮🇳',
        abhaData: {
          abhaId: generatedAbha,
          abhaAddress: generatedAddress,
          status: 'ACTIVE_ABDM_VERIFIED',
          linkedAt: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('ABHA link error:', err);
      return res.status(500).json({ success: false, message: 'Failed to link ABHA ID', error: err.message });
    }
  }

  /**
   * POST /api/abdm/import-records
   * Simulate pulling external records from national ABDM health network
   */
  async importAbdmRecords(req, res) {
    try {
      const { patientId } = req.body;
      const targetId = patientId || req.user?.id || req.user?._id;

      let patient = null;
      if (targetId) {
        if (mongoose.Types.ObjectId.isValid(targetId)) {
          patient = await Patient.findById(targetId);
        }
        if (!patient) {
          patient = await Patient.findOne({ $or: [{ patientId: targetId }, { id: targetId }, { phone: req.user?.phone }] });
        }
      }
      if (!patient && req.user?.email) {
        patient = await Patient.findOne({ email: req.user.email });
      }

      const patientName = patient?.name || req.user?.name || 'Ayushman Beneficiary';
      const patientCode = patient?.patientId || targetId || 'PAT-001';
      const mockRecords = abdmFhirService.generateMockAbdmRecords(patientName);

      const createdDocs = [];
      for (const rec of mockRecords) {
        const doc = new MedicalDocument({
          ...rec,
          patientId: patient?._id || targetId || 'PAT-001',
          userId: req.user?._id || req.user?.id || null,
          patientName: patientName,
          patientCode: patientCode
        });
        await doc.save();
        createdDocs.push(doc);
      }

      return res.status(200).json({
        success: true,
        message: `Successfully imported ${createdDocs.length} health record(s) from ABDM National Gateway! 🏥`,
        importedCount: createdDocs.length,
        records: createdDocs
      });
    } catch (err) {
      console.error('ABDM import error:', err);
      return res.status(500).json({ success: false, message: 'Failed to import ABDM records: ' + err.message, error: err.message });
    }
  }
}

module.exports = new ABDMController();
