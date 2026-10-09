import React, { useState, useEffect } from 'react';
import { Stethoscope, Activity, FileText, ClipboardList, Save, HeartPulse, X, Plus, Clock } from 'lucide-react';
import { api } from '../../utils/api';
import PatientMedicalHistoryView from './PatientMedicalHistoryView';
import HeartbeatLoader from '../HeartbeatLoader';

export default function ConsultationWorkspace({ patientId, doctorId, doctorName, onClose, onSaveComplete }) {
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Consultation Form State
  const [consultation, setConsultation] = useState({
    chiefComplaint: '',
    symptoms: [],
    clinicalNotes: '',
    vitals: { bp: '', pulse: '', temp: '', spo2: '', weight: '' },
    examinationFindings: '',
    diagnosis: [],
    treatmentPlan: '',
    advice: ''
  });

  const [currentSymptom, setCurrentSymptom] = useState('');
  const [currentDiagnosis, setCurrentDiagnosis] = useState('');

  useEffect(() => {
    if (patientId) {
      loadPatient();
    }
  }, [patientId]);

  const loadPatient = async () => {
    setLoading(true);
    try {
      const res = await api.getPatientById(patientId);
      if (res.success) {
        setPatientData(res.patient || res.data);
      } else {
        setErrorMsg('Failed to load patient data');
      }
    } catch (err) {
      setErrorMsg('Error loading patient data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConsultation = async () => {
    if (!consultation.chiefComplaint) {
      setErrorMsg('Chief complaint is required');
      return;
    }
    
    setSaving(true);
    setErrorMsg('');
    
    try {
      // Create medical record payload
      const payload = {
        patientId,
        doctorId,
        doctorName,
        type: 'consultation',
        chiefComplaint: consultation.chiefComplaint,
        symptoms: consultation.symptoms,
        clinicalNotes: consultation.clinicalNotes,
        vitals: consultation.vitals,
        examinationFindings: consultation.examinationFindings,
        diagnosis: consultation.diagnosis,
        treatmentPlan: consultation.treatmentPlan,
        advice: consultation.advice,
        date: new Date().toISOString()
      };
      
      const res = await api.addPatientMedicalHistory(patientId, payload);
      if (res.success) {
        setSuccessMsg('Consultation saved successfully');
        setTimeout(() => {
          if (onSaveComplete) onSaveComplete(payload);
        }, 1500);
      } else {
        setErrorMsg(res.message || 'Failed to save consultation');
      }
    } catch (err) {
      setErrorMsg('Network error. Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const addSymptom = () => {
    if (currentSymptom.trim()) {
      setConsultation({ ...consultation, symptoms: [...consultation.symptoms, currentSymptom.trim()] });
      setCurrentSymptom('');
    }
  };

  const addDiagnosis = () => {
    if (currentDiagnosis.trim()) {
      setConsultation({ ...consultation, diagnosis: [...consultation.diagnosis, currentDiagnosis.trim()] });
      setCurrentDiagnosis('');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
        <HeartbeatLoader />
      </div>
    );
  }

  if (!patientData) {
    return <div style={{ padding: '24px', color: '#ef4444' }}>{errorMsg || 'Patient not found'}</div>;
  }

  return (
    <div className="consultation-split-container">
      <style>{`
        .consultation-split-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          min-height: calc(100vh - 140px);
          width: 100%;
          box-sizing: border-box;
        }
        @media (max-width: 1024px) {
          .consultation-split-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
            min-height: auto;
          }
        }
        @media (max-width: 640px) {
          .consultation-form-row {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
      {/* Left side: Patient History */}
      <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#0d9488" /> Patient History Review
          </h2>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>{patientData.name} ({patientData.patientId})</div>
        </div>
        <div style={{ padding: '20px' }}>
          {/* We reuse PatientMedicalHistoryView but pass a prop to make it compact/readonly if supported, or just render it */}
          <PatientMedicalHistoryView patientId={patientId} readOnly={true} hideHeader={true} />
        </div>
      </div>

      {/* Right side: Active Consultation Form */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '16px 24px', background: '#0f766e', color: '#fff', position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Stethoscope size={18} /> Active Consultation
          </h2>
          <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '16px' }}>Live EHR</span>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {errorMsg && <div style={{ padding: '12px', background: '#fef2f2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.85rem' }}>{errorMsg}</div>}
          {successMsg && <div style={{ padding: '12px', background: '#f0fdf4', color: '#15803d', borderRadius: '8px', fontSize: '0.85rem' }}>{successMsg}</div>}

          {/* Chief Complaint */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Chief Complaint *</label>
            <input 
              type="text" 
              value={consultation.chiefComplaint} 
              onChange={e => setConsultation({...consultation, chiefComplaint: e.target.value})}
              placeholder="E.g. Fever and body ache for 3 days..."
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>

          {/* Symptoms & Vitals Row */}
          <div className="consultation-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Symptoms</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input 
                  type="text" 
                  value={currentSymptom}
                  onChange={e => setCurrentSymptom(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSymptom()}
                  placeholder="Add symptom..."
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={addSymptom} style={{ padding: '8px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}><Plus size={16} color="#475569" /></button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {consultation.symptoms.map((sym, i) => (
                  <div key={i} style={{ background: '#f0fdf4', color: '#0f766e', padding: '4px 10px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {sym} <X size={12} style={{ cursor: 'pointer' }} onClick={() => setConsultation({...consultation, symptoms: consultation.symptoms.filter((_, idx) => idx !== i)})} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Current Vitals</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input type="text" placeholder="BP (mmHg)" value={consultation.vitals.bp} onChange={e => setConsultation({...consultation, vitals: {...consultation.vitals, bp: e.target.value}})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                <input type="text" placeholder="Pulse (bpm)" value={consultation.vitals.pulse} onChange={e => setConsultation({...consultation, vitals: {...consultation.vitals, pulse: e.target.value}})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                <input type="text" placeholder="Temp (°F)" value={consultation.vitals.temp} onChange={e => setConsultation({...consultation, vitals: {...consultation.vitals, temp: e.target.value}})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                <input type="text" placeholder="SpO2 (%)" value={consultation.vitals.spo2} onChange={e => setConsultation({...consultation, vitals: {...consultation.vitals, spo2: e.target.value}})} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* Examination & Diagnosis Row */}
          <div className="consultation-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Examination Findings</label>
              <textarea 
                value={consultation.examinationFindings}
                onChange={e => setConsultation({...consultation, examinationFindings: e.target.value})}
                placeholder="Physical examination notes..."
                rows={3}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Diagnosis</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input 
                  type="text" 
                  value={currentDiagnosis}
                  onChange={e => setCurrentDiagnosis(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addDiagnosis()}
                  placeholder="Add diagnosis..."
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={addDiagnosis} style={{ padding: '8px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}><Plus size={16} color="#475569" /></button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {consultation.diagnosis.map((diag, i) => (
                  <div key={i} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {diag} <X size={12} style={{ cursor: 'pointer' }} onClick={() => setConsultation({...consultation, diagnosis: consultation.diagnosis.filter((_, idx) => idx !== i)})} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Treatment Plan */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Treatment Plan & Advice</label>
            <textarea 
              value={consultation.treatmentPlan}
              onChange={e => setConsultation({...consultation, treatmentPlan: e.target.value})}
              placeholder="Medications, lifestyle changes, instructions..."
              rows={3}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem' }}
            />
          </div>

        </div>

        {/* Action Footer */}
        <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <button style={{ background: 'transparent', border: '1px solid #cbd5e1', color: '#475569', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '44px', flex: '1 1 180px' }}>
            <FileText size={16} /> Draft E-Prescription
          </button>
          
          <button 
            onClick={handleSaveConsultation}
            disabled={saving}
            style={{ 
              background: '#0d9488', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', 
              fontWeight: 700, fontSize: '0.95rem', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '44px', flex: '1 1 200px',
              boxShadow: '0 4px 6px rgba(13, 148, 136, 0.2)'
            }}>
            {saving ? <HeartbeatLoader size="small" /> : <Save size={16} />}
            Complete Consultation
          </button>
        </div>
      </div>
    </div>
  );
}

