import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, UploadCloud, CheckCircle2, AlertCircle, Clock, Sparkles, 
  Eye, Edit3, Save, Check, Trash2, RefreshCw, Search, Filter, 
  ShieldCheck, Pill, Activity, FileCheck, AlertTriangle, ChevronRight, 
  Download, ExternalLink, X, Plus, Stethoscope, Microscope
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';
import HeartbeatLoader from './HeartbeatLoader';

const CATEGORY_LABELS = {
  blood_test: 'Blood Test Report',
  diagnostic_lab: 'Diagnostic & Lab Report',
  prescription: 'Medical Prescription (Rx)',
  discharge_summary: 'Discharge Summary',
  other: 'General Medical Record'
};

const STATUS_CONFIG = {
  UPLOADED: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', label: 'Uploaded' },
  PROCESSING: { bg: '#fef3c7', text: '#b45309', border: '#fde68a', label: 'Analyzing & OCR' },
  OCR_COMPLETED: { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe', label: 'OCR Completed' },
  REQUIRES_REVIEW: { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5', label: 'Review Required' },
  VERIFIED: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', label: 'Verified & Synced' },
  FAILED: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', label: 'Processing Failed' }
};

export default function MedicalDocumentIntelligence({ onRecordSynchronized, patientId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtering & search
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Form State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('blood_test');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Review & Detail Modal State
  const [activeDoc, setActiveDoc] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState(null);
  const [savingCorrections, setSavingCorrections] = useState(false);
  const [verifyingDoc, setVerifyingDoc] = useState(false);
  const [retryingDocId, setRetryingDocId] = useState(null);
  const [activeTab, setActiveTab] = useState('structured'); // 'structured' | 'preview' | 'rawText' | 'audit'
  const [summaryLanguage, setSummaryLanguage] = useState('en');



  const cleanFilename = (name) => {
    if (!name) return 'Medical Document';
    return name.replace(/[\u202f\u00a0]/g, ' ');
  };

  const getSynthesizedClinicalSummary = (doc, data, lang = 'en') => {
    if (lang === 'hi') {
      const hiSummary = data?.summaryHindi || doc?.extractedData?.summaryHindi || doc?.aiExtraction?.extractedData?.summaryHindi;
      if (hiSummary) return hiSummary;
      return 'हिंदी सारांश उपलब्ध नहीं है (Hindi summary not available).';
    }
    const stored = data?.summary || doc?.extractedData?.summary || doc?.aiExtraction?.summary;
    if (stored && !stored.includes('not configured') && !stored.includes('unavailable') && !stored.includes('UNAVAILABLE')) {
      return stored;
    }
    const tests = data?.bloodAndLabTests || doc?.extractedData?.bloodAndLabTests || [];
    const rx = data?.prescriptions || doc?.extractedData?.prescriptions || [];
    const gen = data?.general || doc?.extractedData?.general || {};

    const abnormal = tests.filter(t => 
      t.abnormalFlag === 'HIGH' || t.abnormalFlag === 'LOW' || t.abnormalFlag === 'ABNORMAL' || t.abnormalFlag === 'CRITICAL'
    );
    const normal = tests.filter(t => t.abnormalFlag === 'NORMAL');

    const parts = [];
    if (tests.length > 0) {
      if (abnormal.length > 0) {
        const list = abnormal.map(t => `${t.testName}: ${t.measuredValue}${t.unit ? ' ' + t.unit : ''} [${t.abnormalFlag}]`).join(', ');
        parts.push(`Analyzed ${tests.length} diagnostic parameter(s). ${abnormal.length} value(s) flagged outside reference limits: ${list}.`);
        if (normal.length > 0) {
          parts.push(`${normal.length} parameter(s) within normal baseline: ${normal.map(t => t.testName).join(', ')}.`);
        }
      } else {
        parts.push(`All ${tests.length} analyzed diagnostic parameter(s) fall within standard clinical reference baselines.`);
      }
    }
    if (rx.length > 0) {
      parts.push(`Prescription contains ${rx.length} active medication(s).`);
    }
    if (gen.doctorName) {
      parts.push(`Attending Physician: ${gen.doctorName}.`);
    }
    parts.push(`Synthesized via GraminArogya Clinical Intelligence. Review and verify values below.`);
    return parts.join(' ');
  };



  useEffect(() => {
    loadDocuments();
  }, [categoryFilter, searchQuery]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.getMyMedicalDocuments({
        category: categoryFilter,
        search: searchQuery
      });
      if (res.success) {
        setDocuments(res.documents || []);
      } else {
        setErrorMsg(res.message || 'Failed to load medical documents.');
      }
    } catch (err) {
      setErrorMsg('Network error while loading medical documents.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) validateAndSetFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setErrorMsg('');
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Unsupported format. Only PDF, JPG, and PNG documents are supported.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 15MB limit.');
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a medical document to upload.');
      return;
    }

    try {
      setUploading(true);
      setErrorMsg('');
      setUploadProgress('Uploading file to secure healthcare storage...');

      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentCategory', selectedCategory);
      if (patientId) formData.append('patientId', patientId);

      setUploadProgress('Extracting text and identifying clinical markers via OCR...');
      const res = await api.uploadMedicalDocument(formData);

      if (res.success && res.document) {
        setSuccessMsg('Document uploaded and clinical markers analyzed successfully! 🎉');
        setSelectedFile(null);
        setIsUploadOpen(false);
        await loadDocuments();
        // Automatically open the review modal for newly uploaded document
        openDetailModal(res.document);
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg(res.message || 'Failed to process document.');
      }
    } catch (err) {
      setErrorMsg('Server error during document upload and OCR processing.');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const openDetailModal = (doc) => {
    setActiveDoc(doc);
    setEditableData(JSON.parse(JSON.stringify(doc.extractedData || {})));
    setIsEditing(false);
    setActiveTab('structured');
    setDetailModalOpen(true);
  };

  const handleSaveCorrections = async () => {
    if (!activeDoc || !editableData) return;
    try {
      setSavingCorrections(true);
      setErrorMsg('');
      const res = await api.updateMedicalDocumentCorrections(activeDoc._id, editableData, 'Patient manual validation');
      if (res.success && res.document) {
        setActiveDoc(res.document);
        setEditableData(JSON.parse(JSON.stringify(res.document.extractedData || {})));
        setIsEditing(false);
        setSuccessMsg('Manual corrections saved and audit trail updated! ✅');
        loadDocuments();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res.message || 'Failed to save corrections.');
      }
    } catch (err) {
      setErrorMsg('Network error while saving corrections.');
    } finally {
      setSavingCorrections(false);
    }
  };

  const handleVerifyDocument = async () => {
    if (!activeDoc) return;
    try {
      setVerifyingDoc(true);
      setErrorMsg('');
      const res = await api.verifyMedicalDocument(activeDoc._id);
      if (res.success && res.document) {
        setActiveDoc(res.document);
        setIsEditing(false);
        setSuccessMsg('Record verified! Synchronized with your medical timeline. 🚀');
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        loadDocuments();
        if (onRecordSynchronized) onRecordSynchronized();
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg(res.message || 'Failed to verify document.');
      }
    } catch (err) {
      setErrorMsg('Network error during record verification.');
    } finally {
      setVerifyingDoc(false);
    }
  };

  const handleRetryProcessing = async (docId) => {
    try {
      setRetryingDocId(docId);
      setErrorMsg('');
      const res = await api.retryMedicalDocumentProcessing(docId);
      if (res.success && res.document) {
        setSuccessMsg('OCR retry completed successfully! 🔄');
        loadDocuments();
        if (activeDoc && activeDoc._id === docId) {
          setActiveDoc(res.document);
          setEditableData(JSON.parse(JSON.stringify(res.document.extractedData || {})));
        }
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res.message || 'Retry failed.');
      }
    } catch (err) {
      setErrorMsg('Error retrying OCR processing.');
    } finally {
      setRetryingDocId(null);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this medical record? This action cannot be undone.')) return;
    try {
      const res = await api.deleteMedicalDocument(docId);
      if (res.success) {
        setSuccessMsg('Document removed successfully.');
        if (activeDoc && activeDoc._id === docId) setDetailModalOpen(false);
        loadDocuments();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res.message || 'Failed to delete document.');
      }
    } catch (err) {
      setErrorMsg('Error deleting document.');
    }
  };

  // Helper mutators for editable fields
  const handleTestFieldChange = (index, field, value) => {
    setEditableData(prev => {
      const tests = [...(prev.bloodAndLabTests || [])];
      tests[index] = { ...tests[index], [field]: value, wasCorrected: true };
      return { ...prev, bloodAndLabTests: tests };
    });
  };

  const handleAddTestRow = () => {
    setEditableData(prev => ({
      ...prev,
      bloodAndLabTests: [
        ...(prev.bloodAndLabTests || []),
        { testName: 'New Test', measuredValue: '', unit: '', referenceRange: '', abnormalFlag: 'NORMAL', wasCorrected: true }
      ]
    }));
  };

  const handleRemoveTestRow = (index) => {
    setEditableData(prev => ({
      ...prev,
      bloodAndLabTests: (prev.bloodAndLabTests || []).filter((_, i) => i !== index)
    }));
  };

  const handleRxFieldChange = (index, field, value) => {
    setEditableData(prev => {
      const rx = [...(prev.prescriptions || [])];
      rx[index] = { ...rx[index], [field]: value, wasCorrected: true };
      return { ...prev, prescriptions: rx };
    });
  };

  const handleAddRxRow = () => {
    setEditableData(prev => ({
      ...prev,
      prescriptions: [
        ...(prev.prescriptions || []),
        { medicineName: 'New Medicine', formulation: 'Tablet', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After meals', wasCorrected: true }
      ]
    }));
  };

  const handleRemoveRxRow = (index) => {
    setEditableData(prev => ({
      ...prev,
      prescriptions: (prev.prescriptions || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <div id="sec-medical-ocr" style={{
      background: '#ffffff',
      border: '1.5px solid #059669',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(5, 150, 105, 0.08)',
      padding: '24px',
      marginBottom: '2rem',
      scrollMarginTop: '100px'
    }}>
      {/* Module Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 10px rgba(5, 150, 105, 0.25)'
          }}>
            <Microscope size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Medical Record Intelligence & OCR
              </h2>
              <span style={{
                background: '#dcfce7',
                color: '#15803d',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid #bbf7d0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Sparkles size={11} /> AI + OCR Powered
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0 0' }}>
              Digitize pathology reports, prescriptions & discharge summaries with automated field extraction and patient audit validation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsUploadOpen(!isUploadOpen)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
            transition: 'all 0.2s ease'
          }}
        >
          <UploadCloud size={18} />
          <span>{isUploadOpen ? 'Close Upload Form' : 'Upload Medical Document'}</span>
        </button>
      </div>

      {/* Global Notifications */}
      {errorMsg && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          color: '#b91c1c',
          fontSize: '0.86rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600
        }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {successMsg && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '12px',
          color: '#047857',
          fontSize: '0.86rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 700
        }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#047857' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ═══════════ UPLOAD DRAWER / ZONE ═══════════ */}
      {isUploadOpen && (
        <form onSubmit={handleUploadSubmit} style={{
          marginTop: '20px',
          padding: '20px',
          background: '#f8fafc',
          border: '1.5px dashed #059669',
          borderRadius: '16px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                1. Select Document Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none'
                }}
              >
                <option value="blood_test">🩸 Blood Pathology & Lab Report</option>
                <option value="diagnostic_lab">🔬 Diagnostic & Radiology Report</option>
                <option value="prescription">💊 Medical Prescription (Digital/Handwritten Rx)</option>
                <option value="discharge_summary">🏥 Hospital Discharge Summary</option>
                <option value="other">📄 Other Health Record</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                Supported Formats & Size Limit
              </label>
              <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                Supported: <strong>PDF (Digital/Scanned)</strong>, <strong>JPG/JPEG</strong>, <strong>PNG</strong>. Max size: <strong>15 MB</strong> per document.
              </div>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{
              padding: '28px 16px',
              border: `2px dashed ${isDragOver ? '#059669' : '#94a3b8'}`,
              borderRadius: '14px',
              background: isDragOver ? '#ecfdf5' : '#ffffff',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '16px'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              style={{ display: 'none' }}
            />
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              color: '#059669'
            }}>
              <UploadCloud size={26} />
            </div>
            {selectedFile ? (
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginTop: '4px' }}>
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for processing
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                  Click or drag another file to replace
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#334155' }}>
                  Drag and drop your medical report here, or <span style={{ color: '#059669', textDecoration: 'underline' }}>browse file</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
                  OCR will automatically extract metrics, medicine doses, and physician instructions.
                </div>
              </div>
            )}
          </div>

          {/* Action Row & Progress Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              onClick={() => { setSelectedFile(null); setIsUploadOpen(false); }}
              style={{
                padding: '9px 18px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!selectedFile || uploading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                background: selectedFile && !uploading ? 'linear-gradient(135deg, #059669 0%, #0d9488 100%)' : '#94a3b8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.86rem',
                fontWeight: 800,
                cursor: selectedFile && !uploading ? 'pointer' : 'not-allowed',
                boxShadow: selectedFile ? '0 4px 12px rgba(5, 150, 105, 0.25)' : 'none'
              }}
            >
              {uploading ? (
                <>
                  <HeartbeatLoader color="#ffffff" size={16} />
                  <span>Processing OCR...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Start AI Extraction & OCR</span>
                </>
              )}
            </button>
          </div>

          {uploading && uploadProgress && (
            <div style={{ marginTop: '12px', padding: '10px', background: '#eff6ff', borderRadius: '8px', fontSize: '0.82rem', color: '#1d4ed8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HeartbeatLoader color="#1d4ed8" size={14} />
              <span>{uploadProgress}</span>
            </div>
          )}
        </form>
      )}

      {/* ═══════════ FILTERING & SEARCH CONTROLS ═══════════ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        margin: '20px 0 16px 0'
      }}>
        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Documents' },
            { id: 'blood_test', label: 'Blood Tests' },
            { id: 'diagnostic_lab', label: 'Lab Reports' },
            { id: 'prescription', label: 'Prescriptions' },
            { id: 'discharge_summary', label: 'Discharge Summaries' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: categoryFilter === tab.id ? '1.5px solid #059669' : '1px solid #e2e8f0',
                background: categoryFilter === tab.id ? '#ecfdf5' : '#ffffff',
                color: categoryFilter === tab.id ? '#047857' : '#64748b',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div style={{
          position: 'relative',
          minWidth: '220px',
          maxWidth: '300px',
          flex: 1
        }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search report, test, or hospital..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              outline: 'none',
              background: '#f8fafc',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* ═══════════ DOCUMENT LIST VIEW ═══════════ */}
      {loading ? (
        <div style={{ padding: '30px 0', textAlign: 'center' }}>
          <HeartbeatLoader color="var(--primary)" size={36} text="Fetching medical documents & OCR indices..." />
        </div>
      ) : documents.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 16px',
          background: '#f8fafc',
          borderRadius: '14px',
          border: '1px solid #e2e8f0'
        }}>
          <FileText size={40} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800, color: '#334155' }}>
            No Medical Documents Found
          </h4>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: '#64748b', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            {categoryFilter !== 'all' || searchQuery
              ? 'No documents matched the active filter or search criteria.'
              : 'Upload your lab reports, prescriptions, or discharge summaries to activate automated OCR and timeline synchronization.'}
          </p>
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              background: '#059669',
              color: '#ffffff',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <UploadCloud size={16} /> Upload First Document
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {documents.map((doc) => {
            const statusConfig = STATUS_CONFIG[doc.status] || STATUS_CONFIG.UPLOADED;
            const categoryName = CATEGORY_LABELS[doc.documentCategory] || 'Medical Document';
            const uploadDate = new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const fileSizeKb = Math.round(doc.fileSize / 1024);

            return (
              <div
                key={doc._id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  transition: 'border-color 0.2s ease'
                }}
              >
                {/* Left File Information */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: '1 1 300px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: doc.mimeType === 'application/pdf' ? '#fee2e2' : '#e0f2fe',
                    color: doc.mimeType === 'application/pdf' ? '#dc2626' : '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 800,
                    fontSize: '0.75rem'
                  }}>
                    {doc.mimeType === 'application/pdf' ? 'PDF' : 'IMG'}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0f172a' }}>
                        {doc.originalFilename}
                      </span>
                      <span style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        {categoryName}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: '#64748b', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span>Uploaded: {uploadDate}</span>
                      <span>•</span>
                      <span>Size: {fileSizeKb} KB</span>
                      {doc.extractedData?.general?.facilityOrLabName && (
                        <>
                          <span>•</span>
                          <span style={{ color: '#0369a1', fontWeight: 600 }}>
                            {doc.extractedData.general.facilityOrLabName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badges & Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Confidence Badge */}
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: doc.confidenceCategory === 'HIGH' ? '#f0fdf4' : doc.confidenceCategory === 'MEDIUM' ? '#fefce8' : '#f8fafc',
                    color: doc.confidenceCategory === 'HIGH' ? '#15803d' : doc.confidenceCategory === 'MEDIUM' ? '#a16207' : '#64748b',
                    border: '1px solid #e2e8f0'
                  }}>
                    {doc.ocrConfidence ? `OCR: ${doc.ocrConfidence}%` : 'Digital Text'}
                  </span>

                  {/* Verification Status Badge */}
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '8px',
                    background: statusConfig.bg,
                    color: statusConfig.text,
                    border: `1px solid ${statusConfig.border}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {doc.status === 'VERIFIED' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {statusConfig.label}
                  </span>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => openDetailModal(doc)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Eye size={13} />
                      <span>Inspect & Review</span>
                    </button>

                    {doc.status === 'FAILED' && (
                      <button
                        type="button"
                        onClick={() => handleRetryProcessing(doc._id)}
                        disabled={retryingDocId === doc._id}
                        style={{
                          padding: '6px 10px',
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Retry OCR processing"
                      >
                        <RefreshCw size={13} className={retryingDocId === doc._id ? 'animate-spin' : ''} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc._id)}
                      style={{
                        padding: '6px 8px',
                        background: '#ffffff',
                        color: '#ef4444',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      title="Delete document"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ DOCUMENT DETAIL & VERIFICATION MODAL ═══════════ */}
      {detailModalOpen && activeDoc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '1050px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Microscope size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    {cleanFilename(activeDoc.originalFilename)}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    {CATEGORY_LABELS[activeDoc.documentCategory] || 'Medical Record'} • Status: {activeDoc.status}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {activeDoc.status !== 'VERIFIED' && (
                  <button
                    type="button"
                    onClick={handleVerifyDocument}
                    disabled={verifyingDoc}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>{verifyingDoc ? 'Verifying...' : 'Mark as Verified & Sync'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  style={{
                    padding: '8px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={{
              display: 'flex',
              gap: '6px',
              padding: '10px 24px',
              background: '#ffffff',
              borderBottom: '1px solid #e2e8f0'
            }}>
              {[
                { id: 'structured', label: 'Structured Clinical Fields' },
                { id: 'preview', label: 'Document File Preview' },
                { id: 'rawText', label: 'Genuine OCR Raw Text' },
                { id: 'audit', label: `Audit Trail (${activeDoc.userCorrections?.length || 0})` }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    background: activeTab === t.id ? '#ecfdf5' : 'transparent',
                    color: activeTab === t.id ? '#047857' : '#64748b',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, background: '#fafbfc' }}>
              {/* TAB 1: STRUCTURED CLINICAL FIELDS */}
              {activeTab === 'structured' && editableData && (
                <div>
                  {/* AI Clinical Summary & Insights Banner */}
                  <div style={{
                    marginBottom: '20px',
                    padding: '16px 20px',
                    background: '#f0fdf4',
                    border: '1.5px solid #a7f3d0',
                    borderRadius: '14px',
                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '8px',
                          background: '#dcfce7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#059669'
                        }}>
                          <Sparkles size={15} />
                        </div>
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                          AI Health Summary
                        </span>
                        <span style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          border: '1px solid #bbf7d0',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '10px'
                        }}>
                          {activeDoc.aiExtraction?.modelUsed && activeDoc.aiExtraction.modelUsed !== 'GraminArogya Clinical Intelligence' 
                            ? activeDoc.aiExtraction.modelUsed 
                            : 'Automated Clinical Intelligence'}
                        </span>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => setSummaryLanguage(summaryLanguage === 'en' ? 'hi' : 'en')}
                          style={{
                            padding: '4px 10px',
                            background: '#ffffff',
                            border: '1px solid #10b981',
                            borderRadius: '6px',
                            color: '#047857',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {summaryLanguage === 'en' ? 'Translate to Hindi' : 'View in English'}
                        </button>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#1e293b', lineHeight: 1.6, fontWeight: 500 }}>
                      {getSynthesizedClinicalSummary(activeDoc, editableData, summaryLanguage)}
                    </p>
                  </div>

                  {/* General Metadata Card */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                        Document & Healthcare Facility Metadata
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsEditing(!isEditing)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: isEditing ? '#f1f5f9' : '#ecfdf5',
                          color: isEditing ? '#475569' : '#047857',
                          border: 'none',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Edit3 size={13} />
                        <span>{isEditing ? 'Cancel Edit' : 'Edit Values'}</span>
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Facility / Lab</div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editableData.general?.facilityOrLabName || ''}
                            onChange={(e) => setEditableData(p => ({ ...p, general: { ...p.general, facilityOrLabName: e.target.value } }))}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', marginTop: '4px' }}
                          />
                        ) : (
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                            {editableData.general?.facilityOrLabName || '—'}
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Attending Physician</div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editableData.general?.doctorName || ''}
                            onChange={(e) => setEditableData(p => ({ ...p, general: { ...p.general, doctorName: e.target.value } }))}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', marginTop: '4px' }}
                          />
                        ) : (
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                            {editableData.general?.doctorName || '—'}
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Report / Visit Date</div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editableData.general?.documentDate || ''}
                            onChange={(e) => setEditableData(p => ({ ...p, general: { ...p.general, documentDate: e.target.value } }))}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', marginTop: '4px' }}
                          />
                        ) : (
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                            {editableData.general?.documentDate || '—'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Blood & Diagnostic Test Table */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Microscope size={18} color="#059669" />
                        <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                          Pathology & Diagnostic Test Results ({editableData.bloodAndLabTests?.length || 0})
                        </h4>
                      </div>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={handleAddTestRow}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: '#dcfce7',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <Plus size={12} /> Add Test
                        </button>
                      )}
                    </div>

                    {!editableData.bloodAndLabTests || editableData.bloodAndLabTests.length === 0 ? (
                      <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic', padding: '12px 0' }}>
                        No specific pathology laboratory tests detected in this document.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                              <th style={{ padding: '8px 10px', color: '#64748b' }}>Test Name</th>
                              <th style={{ padding: '8px 10px', color: '#64748b' }}>Result</th>
                              <th style={{ padding: '8px 10px', color: '#64748b' }}>Unit</th>
                              <th style={{ padding: '8px 10px', color: '#64748b' }}>Reference Range</th>
                              <th style={{ padding: '8px 10px', color: '#64748b' }}>Status</th>
                              {isEditing && <th style={{ padding: '8px 10px' }}>Action</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {editableData.bloodAndLabTests.map((test, idx) => {
                              const isAbnormal = test.abnormalFlag === 'HIGH' || test.abnormalFlag === 'LOW' || test.abnormalFlag === 'ABNORMAL';
                              return (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: isAbnormal ? '#fffbeb' : 'transparent' }}>
                                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#1e293b' }}>
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={test.testName}
                                        onChange={(e) => handleTestFieldChange(idx, 'testName', e.target.value)}
                                        style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                      />
                                    ) : test.testName}
                                  </td>
                                  <td style={{ padding: '8px 10px', fontWeight: 800, color: isAbnormal ? '#b45309' : '#0f172a' }}>
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={test.measuredValue}
                                        onChange={(e) => handleTestFieldChange(idx, 'measuredValue', e.target.value)}
                                        style={{ width: '70px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                      />
                                    ) : test.measuredValue}
                                  </td>
                                  <td style={{ padding: '8px 10px', color: '#64748b' }}>
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={test.unit}
                                        onChange={(e) => handleTestFieldChange(idx, 'unit', e.target.value)}
                                        style={{ width: '70px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                      />
                                    ) : test.unit}
                                  </td>
                                  <td style={{ padding: '8px 10px', color: '#64748b' }}>
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={test.referenceRange}
                                        onChange={(e) => handleTestFieldChange(idx, 'referenceRange', e.target.value)}
                                        style={{ width: '90px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                      />
                                    ) : test.referenceRange}
                                  </td>
                                  <td style={{ padding: '8px 10px' }}>
                                    {isEditing ? (
                                      <select
                                        value={test.abnormalFlag}
                                        onChange={(e) => handleTestFieldChange(idx, 'abnormalFlag', e.target.value)}
                                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                      >
                                        <option value="NORMAL">Normal</option>
                                        <option value="HIGH">High</option>
                                        <option value="LOW">Low</option>
                                        <option value="ABNORMAL">Abnormal</option>
                                      </select>
                                    ) : (
                                      <span style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        background: isAbnormal ? '#fef3c7' : '#dcfce7',
                                        color: isAbnormal ? '#b45309' : '#15803d'
                                      }}>
                                        {test.abnormalFlag}
                                      </span>
                                    )}
                                  </td>
                                  {isEditing && (
                                    <td style={{ padding: '8px 10px' }}>
                                      <button type="button" onClick={() => handleRemoveTestRow(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                        <Trash2 size={13} />
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Prescriptions Section */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Pill size={18} color="#0d9488" />
                        <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                          Prescribed Medications ({editableData.prescriptions?.length || 0})
                        </h4>
                      </div>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={handleAddRxRow}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: '#ccfbf1',
                            color: '#0f766e',
                            border: '1px solid #99f6e4',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <Plus size={12} /> Add Medicine
                        </button>
                      )}
                    </div>

                    {!editableData.prescriptions || editableData.prescriptions.length === 0 ? (
                      <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic', padding: '12px 0' }}>
                        No prescriptions detected in this document.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                        {editableData.prescriptions.map((rx, idx) => (
                          <div key={idx} style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '12px'
                          }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <input
                                  type="text"
                                  placeholder="Medicine Name"
                                  value={rx.medicineName}
                                  onChange={(e) => handleRxFieldChange(idx, 'medicineName', e.target.value)}
                                  style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 700 }}
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                  <input
                                    type="text"
                                    placeholder="Dosage (500mg)"
                                    value={rx.dosage}
                                    onChange={(e) => handleRxFieldChange(idx, 'dosage', e.target.value)}
                                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Frequency (1-0-1)"
                                    value={rx.frequency}
                                    onChange={(e) => handleRxFieldChange(idx, 'frequency', e.target.value)}
                                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                                  />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <input
                                    type="text"
                                    placeholder="Instructions (After meals)"
                                    value={rx.instructions}
                                    onChange={(e) => handleRxFieldChange(idx, 'instructions', e.target.value)}
                                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem', flex: 1, marginRight: '6px' }}
                                  />
                                  <button type="button" onClick={() => handleRemoveRxRow(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                                    {rx.formulation && `${rx.formulation} `}{rx.medicineName} {rx.dosage}
                                  </span>
                                  <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                    {rx.frequency}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                                  Duration: {rx.duration || 'As directed'} • Instructions: {rx.instructions || 'After meals'}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Save Corrections Action Button */}
                  {isEditing && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                      <button
                        type="button"
                        onClick={() => { setIsEditing(false); setEditableData(JSON.parse(JSON.stringify(activeDoc.extractedData || {}))); }}
                        style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCorrections}
                        disabled={savingCorrections}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 20px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#059669',
                          color: '#fff',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        <Save size={14} />
                        <span>{savingCorrections ? 'Saving Corrections...' : 'Save Corrections'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DOCUMENT PREVIEW */}
              {activeTab === 'preview' && (
                <div style={{ textAlign: 'center' }}>
                  {activeDoc.mimeType === 'application/pdf' ? (
                    <div style={{ width: '100%', height: '550px', background: '#f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                      <iframe
                        src={api.getMedicalDocumentFileUrl(activeDoc._id)}
                        title="Medical Document PDF Preview"
                        style={{ width: '100%', height: '100%', border: 'none' }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'inline-block', maxWidth: '100%', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <img
                        src={api.getMedicalDocumentFileUrl(activeDoc._id)}
                        alt={activeDoc.originalFilename}
                        style={{ maxWidth: '100%', maxHeight: '550px', objectFit: 'contain', borderRadius: '8px' }}
                      />
                    </div>
                  )}
                  <div style={{ marginTop: '12px' }}>
                    <a
                      href={api.getMedicalDocumentFileUrl(activeDoc._id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={activeDoc.originalFilename}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        textDecoration: 'none'
                      }}
                    >
                      <Download size={14} /> Download Secure File
                    </a>
                  </div>
                </div>
              )}

              {/* TAB 3: GENUINE OCR RAW TEXT */}
              {activeTab === 'rawText' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      Engine: {activeDoc.ocrEngine} • Confidence: {activeDoc.ocrConfidence ? `${activeDoc.ocrConfidence}%` : 'Digital Stream'}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(activeDoc.rawOcrText || '')}
                      style={{ padding: '4px 10px', fontSize: '0.74rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Copy Raw Text
                    </button>
                  </div>
                  <pre style={{
                    background: '#0f172a',
                    color: '#e2e8f0',
                    padding: '16px',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '480px',
                    overflowY: 'auto'
                  }}>
                    {activeDoc.rawOcrText || 'No text extracted.'}
                  </pre>
                </div>
              )}

              {/* TAB 4: AUDIT TRAIL */}
              {activeTab === 'audit' && (
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                    Document Modification & Verification History
                  </h4>
                  {!activeDoc.userCorrections || activeDoc.userCorrections.length === 0 ? (
                    <div style={{ fontSize: '0.84rem', color: '#94a3b8', fontStyle: 'italic', padding: '16px 0' }}>
                      No manual modifications have been made to this document.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {activeDoc.userCorrections.map((entry, idx) => (
                        <div key={idx} style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '12px',
                          fontSize: '0.82rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontWeight: 700 }}>
                            <span>Modified by: {entry.correctedBy}</span>
                            <span>{new Date(entry.correctedAt).toLocaleString('en-IN')}</span>
                          </div>
                          <div style={{ marginTop: '4px', color: '#1e293b' }}>
                            <strong>Note:</strong> {entry.note}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
