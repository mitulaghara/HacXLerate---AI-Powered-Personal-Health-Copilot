import React, { useState, useEffect } from 'react';
import { Share2, Plus, Clock, MapPin, CheckCircle2, AlertCircle, ArrowRight, UserCheck, X } from 'lucide-react';
import { api } from '../../utils/api';
import HeartbeatLoader from '../HeartbeatLoader';

export default function ReferralWorkspace({ doctorId, doctorName, clinicName }) {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  
  // New Referral State
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    receivingFacility: '',
    department: 'Cardiology',
    reason: '',
    priority: 'Routine',
    clinicalNotes: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    setLoading(true);
    try {
      const res = await api.getReferrals();
      if (res && res.success) {
        setReferrals(res.data || res.referrals || []);
      }
    } catch (err) {
      console.warn("Could not load referrals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReferral = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.patientName || !formData.receivingFacility || !formData.reason) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      const payload = {
        ...formData,
        referredByDoctor: doctorName,
        referringFacility: clinicName,
        date: new Date().toISOString()
      };
      const res = await api.createReferral(payload);
      if (res && res.success) {
        setSuccessMsg('Referral created successfully');
        setShowNewModal(false);
        loadReferrals();
        setFormData({
          patientId: '',
          patientName: '',
          receivingFacility: '',
          department: 'Cardiology',
          reason: '',
          priority: 'Routine',
          clinicalNotes: ''
        });
      } else {
        setErrorMsg(res.message || 'Failed to create referral');
      }
    } catch (err) {
      setErrorMsg('Network error saving referral');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="referral-workspace" style={{ padding: '16px 0', width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        .referral-header-wrap {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .referral-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          box-sizing: border-box;
        }
        .referral-meta {
          display: flex;
          gap: 20px;
          font-size: 0.85rem;
          color: #64748b;
          flex-wrap: wrap;
        }
        .referral-modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 768px) {
          .referral-card {
            flex-direction: column;
            align-items: flex-start;
            padding: 16px;
          }
          .referral-card button {
            width: 100%;
            justify-content: center;
          }
          .referral-meta {
            flex-direction: column;
            gap: 6px;
          }
          .referral-modal-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>
      <div className="referral-header-wrap">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Share2 size={24} color="#0d9488" /> Referral Hub
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Manage outgoing and incoming patient referrals.</p>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          style={{ background: '#0d9488', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minHeight: '44px' }}
        >
          <Plus size={16} /> New Referral
        </button>
      </div>

      {successMsg && <div style={{ padding: '12px', background: '#f0fdf4', color: '#10b981', borderRadius: '8px', marginBottom: '20px', fontWeight: 600 }}>{successMsg}</div>}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <HeartbeatLoader />
        </div>
      ) : referrals.length === 0 ? (
        <div style={{ background: '#f8fafc', padding: '40px 20px', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
          <Share2 size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#334155', margin: '0 0 8px 0' }}>No Referrals Found</h3>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>You haven't created any patient referrals yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {referrals.map((ref, idx) => (
            <div key={idx} className="referral-card">
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>{ref.patientName} <span style={{ color: '#64748b', fontSize: '0.85rem' }}>({ref.patientId})</span></h4>
                  <span style={{ 
                    padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                    background: ref.priority === 'Urgent' ? '#fef2f2' : '#f0f9ff',
                    color: ref.priority === 'Urgent' ? '#ef4444' : '#0284c7'
                  }}>{ref.priority}</span>
                  <span style={{ 
                    padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                    background: ref.status === 'COMPLETED' ? '#f0fdf4' : ref.status === 'ACCEPTED' ? '#fef3c7' : '#f1f5f9',
                    color: ref.status === 'COMPLETED' ? '#16a34a' : ref.status === 'ACCEPTED' ? '#d97706' : '#64748b'
                  }}>{ref.status || 'PENDING'}</span>
                </div>
                <div className="referral-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> To: {ref.receivingFacility} ({ref.department})</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> Reason: {ref.reason}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {new Date(ref.date || ref.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f766e', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', minHeight: '40px' }}>
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New Referral Modal */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '600px', borderRadius: '16px', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', background: '#0f766e', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}><Share2 size={18} /> Create Patient Referral</h3>
              <button onClick={() => setShowNewModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmitReferral} style={{ padding: '20px', overflowY: 'auto' }}>
              {errorMsg && <div style={{ padding: '12px', background: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600 }}>{errorMsg}</div>}
              
              <div className="referral-modal-grid">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Patient ID *</label>
                  <input type="text" value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '40px', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Patient Name *</label>
                  <input type="text" value={newReferral.patientName} onChange={e => setNewReferral({...newReferral, patientName: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Receiving Facility *</label>
                  <input type="text" value={newReferral.receivingFacility} onChange={e => setNewReferral({...newReferral, receivingFacility: e.target.value})} placeholder="e.g., District Hospital" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Department / Specialist</label>
                  <input type="text" value={newReferral.department} onChange={e => setNewReferral({...newReferral, department: e.target.value})} placeholder="e.g., Cardiology" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Priority</label>
                  <select value={newReferral.priority} onChange={e => setNewReferral({...newReferral, priority: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Reason for Referral *</label>
                  <input type="text" value={newReferral.reason} onChange={e => setNewReferral({...newReferral, reason: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Clinical Notes</label>
                <textarea value={newReferral.clinicalNotes} onChange={e => setNewReferral({...newReferral, clinicalNotes: e.target.value})} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowNewModal(false)} style={{ padding: '10px 20px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 24px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Submit Referral</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
