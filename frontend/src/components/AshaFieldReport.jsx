import React, { useState } from 'react';
import { api } from '../utils/api';
import HeartbeatLoader from './HeartbeatLoader';
import { QrCode, Search, UserCheck, CheckCircle2, ShieldCheck, Camera, X } from 'lucide-react';
import VoiceModal from './VoiceModal';
import QrScanner from './QrScanner';

export default function AshaFieldReport({ currentUser }) {
  const [activeMode, setActiveMode] = useState(''); // 'scan' or 'manual'
  const [patientIdInput, setPatientIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [verifiedPatient, setVerifiedPatient] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    symptoms: '',
    observations: '',
    notes: '',
    vitals: { bp: '', spo2: '', temp: '', pulse: '', sugar: '' },
    triageResult: 'GREEN_ROUTINE',
    followUpRequirement: '',
    referralRequirement: ''
  });

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!patientIdInput.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.searchPatientByClient(patientIdInput.trim());
      if (res.success && res.patient) {
        setVerifiedPatient(res.patient);
        setSuccessNotice('');
      } else {
        setErrorMsg(res.message || 'Patient not found. Check the ID.');
      }
    } catch (e) {
      setErrorMsg('Failed to verify patient due to network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = async (decodedText) => {
    try {
      let qrPayload;
      try {
        qrPayload = JSON.parse(decodedText);
      } catch (err) {
        // If not JSON, maybe it's just raw ID
        qrPayload = { qrToken: decodedText };
      }
      
      setLoading(true);
      setErrorMsg('');
      setActiveMode(''); // hide scanner
      
      // Use the actual lookupByQr API endpoint
      const res = await api.lookupPatientByQr(qrPayload.qrToken || qrPayload, qrPayload.qrToken, qrPayload.patientId);
      
      if (res.success && res.patient) {
        setVerifiedPatient(res.patient);
        setSuccessNotice('QR Scan Successful!');
      } else {
        setErrorMsg(res.message || 'Invalid QR Code or Patient not found.');
        setActiveMode('scan'); // Show scanner again on fail
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Failed to process QR code.');
      setActiveMode('scan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!verifiedPatient) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const payload = {
        ...form,
        vitals: {
          bp: form.vitals.bp,
          spo2: Number(form.vitals.spo2) || null,
          temp: Number(form.vitals.temp) || null,
          pulse: Number(form.vitals.pulse) || null,
          sugar: form.vitals.sugar
        }
      };
      
      const targetId = verifiedPatient.id || verifiedPatient._id || verifiedPatient.patId;
      const res = await api.addFieldReport(targetId, payload);
      
      if (res.success) {
        setSuccessNotice(`Field Report saved securely for ${verifiedPatient.name}!`);
        // Reset form
        setForm({
          symptoms: '',
          observations: '',
          notes: '',
          vitals: { bp: '', spo2: '', temp: '', pulse: '', sugar: '' },
          triageResult: 'GREEN_ROUTINE',
          followUpRequirement: '',
          referralRequirement: ''
        });
        setVerifiedPatient(null);
        setPatientIdInput('');
        setActiveMode('');
      } else {
        setErrorMsg(res.message || 'Failed to save report.');
      }
    } catch (e) {
      setErrorMsg('Network error saving report.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      
      {!verifiedPatient ? (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck color="#2563eb" /> Patient Identification
          </h2>
          
          <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '24px' }}>
            To securely submit a field report, you must first verify the patient's identity using their physical QR Code or secure Patient ID.
          </p>

          {errorMsg && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem', fontWeight: 600, marginBottom: '20px' }}>
              {errorMsg}
            </div>
          )}
          
          {successNotice && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '8px', color: '#16a34a', fontSize: '0.85rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} /> {successNotice}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <button 
              onClick={() => setActiveMode('scan')}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                background: activeMode === 'scan' ? '#eff6ff' : '#f8fafc', 
                border: `2px dashed ${activeMode === 'scan' ? '#2563eb' : '#cbd5e1'}`, 
                borderRadius: '12px', padding: '30px 20px',
                cursor: 'pointer', transition: 'all 0.2s', color: '#334155', fontWeight: 700
              }}
              onMouseOver={e => { if(activeMode !== 'scan') e.currentTarget.style.borderColor = '#2563eb' }}
              onMouseOut={e => { if(activeMode !== 'scan') e.currentTarget.style.borderColor = '#cbd5e1' }}
            >
              <div style={{ background: '#dbeafe', padding: '16px', borderRadius: '50%' }}>
                <QrCode size={32} color="#2563eb" />
              </div>
              Scan Patient QR
            </button>
            
            <button 
              onClick={() => setActiveMode('manual')}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                background: activeMode === 'manual' ? '#f0fdf4' : '#f8fafc', 
                border: `2px dashed ${activeMode === 'manual' ? '#16a34a' : '#cbd5e1'}`, 
                borderRadius: '12px', padding: '30px 20px',
                cursor: 'pointer', transition: 'all 0.2s', color: '#334155', fontWeight: 700
              }}
              onMouseOver={e => { if(activeMode !== 'manual') e.currentTarget.style.borderColor = '#16a34a' }}
              onMouseOut={e => { if(activeMode !== 'manual') e.currentTarget.style.borderColor = '#cbd5e1' }}
            >
              <div style={{ background: '#dcfce7', padding: '16px', borderRadius: '50%' }}>
                <Search size={32} color="#16a34a" />
              </div>
              Enter Patient ID
            </button>
          </div>

          {activeMode === 'scan' && (
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '16px' }}>Please align the QR Code within the frame.</p>
              <QrScanner 
                onScanSuccess={handleScanSuccess} 
                onScanFailure={(err) => console.log('QR Code scan error:', err)}
              />
            </div>
          )}

          {activeMode === 'manual' && (
            <form onSubmit={handleVerify} style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>
                Patient ID / Mobile Number / SSC Code
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. PAT-482731 or 10-digit Mobile Number" 
                  value={patientIdInput}
                  onChange={e => setPatientIdInput(e.target.value)}
                  style={{
                    flex: 1, padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px',
                    fontSize: '1rem', outline: 'none'
                  }}
                  autoFocus
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{
                    background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px',
                    padding: '0 24px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  {loading ? <HeartbeatLoader size={18} color="#fff" /> : <UserCheck size={18} />}
                  Verify
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Verified Patient Header */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#16a34a', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div style={{ color: '#166534', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Patient</div>
                <div style={{ color: '#14532d', fontSize: '1.2rem', fontWeight: 900 }}>{verifiedPatient.name}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#166534', fontSize: '0.8rem', fontWeight: 700 }}>ID: {verifiedPatient.id}</div>
              <div style={{ color: '#166534', fontSize: '0.8rem' }}>{verifiedPatient.age} Yrs • {verifiedPatient.gender}</div>
              <button 
                onClick={() => setVerifiedPatient(null)}
                style={{ background: 'transparent', border: 'none', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', marginTop: '4px', textDecoration: 'underline' }}
              >
                Change Patient
              </button>
            </div>
          </div>

          {/* Field Report Form */}
          <form onSubmit={handleSubmitReport} className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              ASHA Field Visit Report
            </h3>

            {errorMsg && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem', fontWeight: 600, marginBottom: '20px' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Symptoms (with Voice Appending) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>
                  Symptoms & Chief Complaint *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <textarea 
                    required
                    rows={2}
                    value={form.symptoms}
                    onChange={e => setForm({...form, symptoms: e.target.value})}
                    placeholder="Enter symptoms (manually or via voice)..."
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setIsVoiceOpen(true)}
                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: '8px', padding: '0 16px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    🎤 Voice
                  </button>
                </div>
              </div>

              {/* Vitals Grid */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>
                  Field Vitals
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                  <input type="text" placeholder="BP (e.g. 120/80)" value={form.vitals.bp} onChange={e => setForm({...form, vitals: {...form.vitals, bp: e.target.value}})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  <input type="number" placeholder="SpO2 (%)" value={form.vitals.spo2} onChange={e => setForm({...form, vitals: {...form.vitals, spo2: e.target.value}})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  <input type="number" step="0.1" placeholder="Temp (°F)" value={form.vitals.temp} onChange={e => setForm({...form, vitals: {...form.vitals, temp: e.target.value}})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  <input type="number" placeholder="Pulse (bpm)" value={form.vitals.pulse} onChange={e => setForm({...form, vitals: {...form.vitals, pulse: e.target.value}})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                </div>
              </div>

              {/* Observations & Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Field Observations</label>
                <textarea rows={2} value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} placeholder="Environmental, sanitary, or physical observations..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Private ASHA Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Internal notes for health officers (not visible to patient)..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }} />
              </div>

              {/* Triage & Referrals */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Triage Priority</label>
                  <select value={form.triageResult} onChange={e => setForm({...form, triageResult: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                    <option value="GREEN_ROUTINE">Routine / Stable</option>
                    <option value="YELLOW_URGENT">Urgent (Needs doctor within 24h)</option>
                    <option value="RED_EMERGENCY">Emergency (Immediate)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>Referral Action</label>
                  <select value={form.referralRequirement} onChange={e => setForm({...form, referralRequirement: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                    <option value="">None / Treat at home</option>
                    <option value="PHC">Refer to Primary Health Centre</option>
                    <option value="CHC">Refer to Community Health Centre</option>
                    <option value="DISTRICT">Refer to District Hospital</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                disabled={saving}
                style={{
                  background: '#0f766e', color: '#fff', border: 'none', borderRadius: '8px',
                  padding: '12px 32px', fontSize: '1rem', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                {saving ? <HeartbeatLoader size={18} color="#fff" /> : <ShieldCheck size={18} />}
                Submit Secure Report
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Voice Input Modal - APPEND LOGIC IS INTRINSIC IN VoiceModal + this callback */}
      <VoiceModal 
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onTriageComplete={(result) => {
          if (result && result.originalTranscript) {
            setForm(prev => {
              const base = prev.symptoms ? prev.symptoms.trim() + ' ' : '';
              return { ...prev, symptoms: base + result.originalTranscript };
            });
          }
        }}
      />
    </div>
  );
}
