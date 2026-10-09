import React, { useState } from 'react';
import { AlertTriangle, MapPin, Ambulance, Phone, Activity, HeartPulse, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../../utils/api';
import HeartbeatLoader from '../HeartbeatLoader';
import confetti from 'canvas-confetti';

export default function EmergencyActionView({ doctorName, clinicName, onNavigateTab }) {
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [category, setCategory] = useState('Cardiac');
  const [location, setLocation] = useState('');
  const [targetFacility, setTargetFacility] = useState('District Hospital / Trauma Center');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleInitiateReferral = async (e) => {
    e.preventDefault();
    if (!patientId.trim()) {
      setErrorMsg('Patient ID or Mobile is required.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const payload = {
        patientId: patientId.trim(),
        patientName: patientName.trim() || 'Emergency Patient',
        referringUnit: `${clinicName || 'OPD Emergency Unit'} - Dr. ${doctorName || 'Attending Physician'}`,
        targetFacilityName: targetFacility,
        primaryReason: `🚨 EMERGENCY CASE: ${category}`,
        priority: 'CRITICAL',
        notes: location.trim() || 'Immediate tertiary care escalation required.',
        isEmergency: true
      };

      const res = await api.createReferral(payload);
      if (res.success) {
        confetti({ particleCount: 50, spread: 60 });
        setSuccessMsg(`Emergency Referral ${res.referral?.referralCode || ''} dispatched immediately to ${targetFacility}!`);
        setPatientId('');
        setPatientName('');
        setLocation('');
      } else {
        setErrorMsg(res.message || 'Failed to dispatch emergency referral.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Server error connecting to emergency dispatch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="emergency-workspace" style={{ padding: '16px 0', width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        .emergency-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          width: 100%;
          box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .emergency-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
      <div style={{ background: '#fef2f2', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.05)', border: 'none', borderLeft: '4px solid #ef4444', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
          <AlertTriangle size={24} /> Emergency & Critical Care Protocol
        </h2>
        <p style={{ color: '#991b1b', margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
          Use this workspace to initiate rapid response, escalate cases to higher care centers, and coordinate with ambulance services immediately.
        </p>
      </div>

      {successMsg && (
        <div style={{ padding: '14px 18px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', color: '#166534', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, fontSize: '0.9rem' }}>
          <CheckCircle2 size={18} color="#16a34a" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '14px 18px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, fontSize: '0.9rem' }}>
          <AlertTriangle size={18} color="#dc2626" />
          {errorMsg}
        </div>
      )}

      <div className="emergency-grid">
        {/* Declare Emergency Form */}
        <form onSubmit={handleInitiateReferral} style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="#dc2626" /> Escalate Case
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Patient ID / Mobile Number *</label>
            <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)} placeholder="e.g. PAT-482731 or 9876543210" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', transition: 'all 0.2s', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Patient Name</label>
            <input type="text" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Patient Full Name" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', transition: 'all 0.2s', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Emergency Category *</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', transition: 'all 0.2s', boxSizing: 'border-box' }}>
              <option value="Cardiac">Cardiac / Stroke</option>
              <option value="Trauma">Trauma / Accident</option>
              <option value="Maternal">Maternal / Obstetric</option>
              <option value="Respiratory">Severe Respiratory Distress</option>
              <option value="Poisoning">Poisoning / Snakebite</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Escalation Target Facility</label>
            <select value={targetFacility} onChange={e => setTargetFacility(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', transition: 'all 0.2s', boxSizing: 'border-box' }}>
              <option value="District Hospital / Trauma Center">District Hospital / Trauma Center</option>
              <option value="Civil Hospital Super-Speciality">Civil Hospital Super-Speciality</option>
              <option value="Medical College & Research Hospital">Medical College & Research Hospital</option>
              <option value="Community Health Centre (Emergency Ward)">Community Health Centre (Emergency Ward)</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Current Clinical Condition / Notes *</label>
            <textarea value={location} onChange={e => setLocation(e.target.value)} rows={2} placeholder="E.g., At clinic, unstable BP 170/110, SpO2 88%, immediate ICU bed required..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', transition: 'all 0.2s', boxSizing: 'border-box' }} />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            {loading ? (
              <HeartbeatLoader color="#ffffff" size={24} text="" />
            ) : (
              <>
                <ShieldAlert size={18} /> Initiate Urgent Referral
              </>
            )}
          </button>
        </form>

        {/* Action Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeartPulse size={24} color="#16a34a" />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#0f172a' }}>Direct 108 Emergency Call</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>National emergency ambulance dispatch (Toll-Free 24x7).</p>
            </div>
            <a href="tel:108" style={{ padding: '8px 14px', background: '#0f766e', color: '#fff', textDecoration: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={14} /> Call 108
            </a>
          </div>

          <div style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ambulance size={24} color="#d97706" />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#0f172a' }}>104 Health Helpline</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Medical guidance, blood availability, and health grievance support.</p>
            </div>
            <a href="tel:104" style={{ padding: '8px 14px', background: '#d97706', color: '#fff', textDecoration: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={14} /> Call 104
            </a>
          </div>

          <div style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={24} color="#475569" />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#0f172a' }}>CMO Emergency Control Room</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>District Chief Medical Officer emergency escalation desk.</p>
            </div>
            <a href="tel:18001801104" style={{ padding: '8px 14px', background: '#334155', color: '#fff', textDecoration: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={14} /> Helpdesk
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}



