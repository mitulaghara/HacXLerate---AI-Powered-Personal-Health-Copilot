import React, { useState, useEffect, useMemo } from 'react';
import {
  Mic, Activity, HeartPulse, UserPlus, ShieldAlert, CheckCircle2,
  AlertTriangle, Send, WifiOff, Phone, MessageSquare, Sparkles,
  RefreshCw, Clock, MapPin, Search, Filter, ChevronDown, ChevronUp,
  Navigation, Stethoscope, Building2, Share2, Check, ArrowRight,
  User, Save, Mail
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';
import { saveToOfflineQueue, getOfflineQueue, formatSmsPayload } from '../utils/offlineStorage';
import { getLivePosition, reverseGeocode } from '../utils/geolocation';
import HeartbeatLoader from '../components/HeartbeatLoader';
import VoiceModal from '../components/VoiceModal';

/**
 * Premium, Production-Ready ASHA Worker Patient Intake & AI Triage Workspace
 * Engineered for community health workers with mobile-first responsiveness,
 * clean healthcare UI/UX, touch-friendly inputs, zero nested scrollbars,
 * and universal HeartbeatLoader integration.
 */
import AshaFieldReport from '../components/AshaFieldReport';

export default function StaffPortal({
  onSelectPatientForRouting,
  isOnline,
  currentUser,
  activeSubTab,
  setActiveSubTab
}) {
  const [activeTab, setActiveTab] = useState(activeSubTab || 'screening'); // 'screening', 'field-report', 'profile'
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  // ASHA Profile States
  const [staffProfile, setStaffProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', designation: '', village: '' });
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState('');
  const [profileNotice, setProfileNotice] = useState('');
  // Consultation list & async states
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  const [patientId, setPatientId] = useState(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState('Female');
  const [village, setVillage] = useState('');
  const [phone, setPhone] = useState('+91-');
  const [abhaId, setAbhaId] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [bp, setBp] = useState('120/80');
  const [spo2, setSpo2] = useState(98);
  const [temp, setTemp] = useState(98.6);
  const [pulse, setPulse] = useState(74);
  const [sugar, setSugar] = useState('Normal');
  const [currentRegion, setCurrentRegion] = useState('');
  const [showSmsTelemetry, setShowSmsTelemetry] = useState(false);

  useEffect(() => {
    if (activeSubTab) {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

  const fetchStaffProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await api.getStaffProfile();
      if (res.success && res.profile) {
        setStaffProfile(res.profile);
        setProfileForm({
          name: res.profile.name || '',
          email: res.profile.email || '',
          phone: res.profile.phone || '',
          designation: res.profile.designation || 'Community ASHA Health Worker',
          village: res.profile.village || ''
        });
        setUsernameInput(res.profile.username || '');
      }
    } catch (e) {
      console.error('Error fetching staff profile:', e);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'profile') {
      fetchStaffProfile();
    }
  }, [activeTab]);

  const handleSaveStaffProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await api.updateStaffProfile(profileForm);
      if (res.success && res.profile) {
        setStaffProfile(res.profile);
        setProfileNotice('Profile updated successfully in database! ✅');
        setTimeout(() => setProfileNotice(''), 4000);
      } else {
        alert(res.message || 'Failed to update profile');
      }
    } catch (e) {
      alert('Error saving profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdateAshaUsername = async (e) => {
    e.preventDefault();
    setUsernameSaving(true);
    setUsernameMsg('');
    try {
      const res = await api.updateUsername(usernameInput);
      if (res.success) {
        setUsernameMsg('✅ Username updated to ' + res.username);
        if (staffProfile) setStaffProfile(prev => ({ ...prev, username: res.username }));
        setProfileNotice('Username updated successfully! ✅');
        setTimeout(() => setProfileNotice(''), 4000);
      } else {
        setUsernameMsg('❌ ' + (res.message || 'Failed to update username'));
      }
    } catch (e) {
      setUsernameMsg('❌ Network error updating username');
    } finally {
      setUsernameSaving(false);
    }
  };

  // Search & Filter state for Recent Consultations
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');

  // AI Assessment & Risk preview
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [triageCategory, setTriageCategory] = useState('GREEN_ROUTINE');
  const [recommendedTier, setRecommendedTier] = useState('Local PHC');
  const [actionGuidance, setActionGuidance] = useState('Standard OPD consultation recommended.');
  const [smsPreview, setSmsPreview] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Offline queue items count
  const offlineCount = useMemo(() => {
    return getOfflineQueue().length;
  }, [patients, successNotice]);

  // Auto-detect real live GPS village & district on initial mount
  useEffect(() => {
    let isMounted = true;
    setDetectingGps(true);
    getLivePosition()
      .then(async coords => {
        if (!isMounted) return;
        const geo = await reverseGeocode(coords.lat, coords.lng);
        if (geo.village && isMounted) {
          setVillage(geo.village);
        }
        if ((geo.district || geo.village) && isMounted) {
          setCurrentRegion(geo.shortAddress || `${geo.village || ''}, ${geo.district || ''}`);
        }
      })
      .catch(() => {
        if (isMounted) setCurrentRegion('Gramin Sub-Centre Unit');
      })
      .finally(() => {
        if (isMounted) setDetectingGps(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch real patient consultation records
  const fetchPatients = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoadingPatients(true);

      const res = await api.getPatients();
      if (res.success && Array.isArray(res.data)) {
        setPatients(res.data);
      }
    } catch (e) {
      console.warn('Network issue fetching patients; utilizing cached state');
    } finally {
      setLoadingPatients(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Manual GPS Trigger
  const handleDetectGps = async () => {
    try {
      setDetectingGps(true);
      const coords = await getLivePosition();
      const geo = await reverseGeocode(coords.lat, coords.lng);
      if (geo.village) setVillage(geo.village);
      const locText = geo.shortAddress || `${geo.village || ''}, ${geo.district || ''}`;
      if (locText) setCurrentRegion(locText);
      setSuccessNotice(`📍 Live GPS Locked: ${locText}`);
      setTimeout(() => setSuccessNotice(''), 4000);
    } catch (e) {
      console.warn('GPS detection notice:', e);
    } finally {
      setDetectingGps(false);
    }
  };

  // Quick symptom chips for field data entry
  const commonSymptoms = [
    { label: 'High Fever (बुखार)', text: 'High fever with chills for 2 days' },
    { label: 'Chest Pain (सीने में दर्द)', text: 'Acute chest pain radiating to left shoulder' },
    { label: 'Shortness of Breath (सांस फूलना)', text: 'Severe shortness of breath and respiratory distress' },
    { label: 'Pregnancy Pain (प्रसव दर्द)', text: 'Third-trimester severe abdominal pain and contractions' },
    { label: 'Diarrhea / Vomiting (दस्त-उल्टी)', text: 'Persistent loose motions and acute vomiting with weakness' },
    { label: 'Trauma / Fracture (चोट/फ्रैक्चर)', text: 'Accidental trauma injury with suspected limb fracture' },
    { label: 'Snake Bite (सर्पदंश)', text: 'Suspected venomous snake bite on lower extremity' }
  ];

  const handleAppendSymptom = (text) => {
    setChiefComplaint(prev => {
      if (!prev) return text;
      if (prev.toLowerCase().includes(text.toLowerCase())) return prev;
      return `${prev}. ${text}`;
    });
  };

  // Generate standard ABHA ID
  const handleGenerateAbha = () => {
    const randomFourA = Math.floor(1000 + Math.random() * 9000);
    const randomFourB = Math.floor(1000 + Math.random() * 9000);
    const cleanDigits = phone.replace(/\D/g, '').slice(-4) || '9100';
    setAbhaId(`ABHA-${cleanDigits}-${randomFourA}-${randomFourB}`);
  };

  // Compute live triage risk preview as vitals and symptoms change (Preserves clinical rules)
  useEffect(() => {
    const complaintLower = chiefComplaint.toLowerCase();
    let calculatedRisk = 'LOW';
    let category = 'GREEN_ROUTINE';
    let tier = 'Health & Wellness Sub-Centre / Local PHC';
    let guidance = 'Standard clinical evaluation with Medical Officer or Community Health Officer (CHO).';

    if (
      spo2 < 92 ||
      complaintLower.includes('chest pain') ||
      complaintLower.includes('heart') ||
      complaintLower.includes('snake') ||
      complaintLower.includes('behosh') ||
      complaintLower.includes('saans') ||
      complaintLower.includes('unconscious')
    ) {
      calculatedRisk = 'CRITICAL';
      category = 'RED_EMERGENCY';
      tier = 'District Hospital / Trauma & Cardiology Unit';
      guidance = '🚨 Immediate emergency routing and 108 ambulance dispatch recommended. Oxygen stabilization required.';
    } else if (
      spo2 < 95 ||
      temp > 101 ||
      complaintLower.includes('fever') ||
      complaintLower.includes('pregnancy') ||
      complaintLower.includes('bukhar') ||
      complaintLower.includes('vomit') ||
      complaintLower.includes('fracture') ||
      complaintLower.includes('diarrhea') ||
      complaintLower.includes('dast')
    ) {
      calculatedRisk = 'MODERATE';
      category = 'YELLOW_PRIORITY';
      tier = 'PHC or CHC with Active Diagnostics & Labor Room';
      guidance = 'Requires prompt physician consultation, blood work (CBC/Malaria), or obstetric assessment.';
    }

    setRiskLevel(calculatedRisk);
    setTriageCategory(category);
    setRecommendedTier(tier);
    setActionGuidance(guidance);

    // Format zero-internet SMS payload
    setSmsPreview(formatSmsPayload({
      name,
      age,
      gender,
      chiefComplaint,
      vitals: { bp, spo2, temp, pulse },
      riskLevel: calculatedRisk
    }));
  }, [chiefComplaint, bp, spo2, temp, pulse, name, age, gender]);

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !chiefComplaint.trim()) {
      alert('Please fill in the patient name and chief complaint.');
      return;
    }

    setSaving(true);

    const patientPayload = {
      id: patientId, // Pass patientId if we are editing an existing record
      name: name.trim(),
      age: Number(age) || 28,
      gender,
      village: village.trim() || currentRegion || 'Rural Sub-Centre Habitation',
      phone: phone.trim(),
      abhaId: abhaId.trim() || `ABHA-91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      chiefComplaint: chiefComplaint.trim(),
      symptomTags: [chiefComplaint.slice(0, 32)],
      vitals: {
        bp,
        spo2: Number(spo2),
        temp: Number(temp),
        pulse: Number(pulse),
        sugar
      },
      riskLevel,
      triageCategory,
      recommendedFacilityType: recommendedTier,
      ashaWorkerName: currentUser?.name
        ? `${currentUser.name} (ASHA)`
        : 'Community ASHA Health Worker'
    };

    if (!isOnline) {
      saveToOfflineQueue(patientPayload);
      setSuccessNotice('Saved locally in Offline Queue! Will auto-sync when network connects.');
      setPatients(prev => [patientPayload, ...prev]);
      setSaving(false);
      resetForm();
      setTimeout(() => setSuccessNotice(''), 6000);
      return;
    }

    try {
      const res = await api.registerPatient(patientPayload);
      if (res.success) {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.75 }
        });
        setSuccessNotice(`Patient ${patientId ? 'updated' : 'registered'} successfully & triaged as ${riskLevel} Priority!`);
        await fetchPatients(true);
        if (!patientId) {
          resetForm();
        }
      } else {
        saveToOfflineQueue(patientPayload);
        setSuccessNotice('Central database unavailable: Saved in local Offline Queue.');
      }
    } catch (err) {
      saveToOfflineQueue(patientPayload);
      setSuccessNotice('Network error: Safely saved in Offline Store.');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessNotice(''), 6000);
    }
  };

  const handleEditPatient = (p) => {
    setPatientId(p.id || p._id);
    setName(p.name || '');
    setAge(p.age || 28);
    setGender(p.gender || 'Female');
    setVillage(p.village || '');
    setPhone(p.phone || '+91-');
    setAbhaId(p.abhaId || '');
    setChiefComplaint(p.chiefComplaint || '');
    if (p.vitals) {
      setBp(p.vitals.bp || '120/80');
      setSpo2(p.vitals.spo2 || 98);
      setTemp(p.vitals.temp || 98.6);
      setPulse(p.vitals.pulse || 74);
      setSugar(p.vitals.sugar || 'Normal');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setPatientId(null);
    setName('');
    setChiefComplaint('');
    setSpo2(98);
    setTemp(98.6);
    setPulse(74);
    setBp('120/80');
    setSugar('Normal');
    setPhone('+91-');
    setAbhaId('');
  };

  // Filtered recent consultations list
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.village && p.village.toLowerCase().includes(q)) ||
        (p.chiefComplaint && p.chiefComplaint.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q));

      const matchesRisk = filterRisk === 'ALL' || p.riskLevel === filterRisk;
      return matchesSearch && matchesRisk;
    });
  }, [patients, searchQuery, filterRisk]);

  return (
    <div style={{
      maxWidth: '1440px',
      margin: '0 auto',
      padding: '1.5rem 1rem 4rem 1rem',
      boxSizing: 'border-box'
    }}>
      <style>{`
        /* Responsive Grid & Spacing */
        .asha-portal-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 1.5rem;
          align-items: start;
        }

        .asha-section-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .asha-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .asha-input-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .asha-input-field {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.92rem;
          font-family: inherit;
          color: #0f172a;
          background: #ffffff;
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .asha-input-field:focus {
          outline: none;
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
        }

        .asha-gender-btn {
          flex: 1;
          padding: 9px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .asha-gender-btn.active {
          background: #0d9488;
          border-color: #0d9488;
          color: #ffffff;
        }

        .asha-chip-btn {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 5px 10px;
          font-size: 0.74rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .asha-chip-btn:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        @media (max-width: 1024px) {
          .asha-portal-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }

        @media (max-width: 640px) {
          .asha-portal-header-actions {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .asha-portal-header-actions button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TOP ASHA FIELD IDENTITY & CONTROLS BANNER                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        {/* Worker Profile & Region */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0,
            boxShadow: '0 4px 10px rgba(5, 150, 105, 0.25)'
          }}>
            <HeartPulse size={26} strokeWidth={2} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.04em'
              }}>
                ASHA FIELD WORKER
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: isOnline ? '#15803d' : '#b45309'
              }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: isOnline ? '#10b981' : '#f59e0b',
                  display: 'inline-block'
                }} />
                {isOnline ? 'Online Sync Active' : `Offline Queue (${offlineCount})`}
              </span>
            </div>

            <h1 style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: '#0f172a',
              marginTop: '4px',
              lineHeight: 1.2
            }}>
              {currentUser?.name ? `${currentUser.name} · Patient Intake & AI Triage` : 'Frontline Patient Intake & AI Triage'}
            </h1>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: '#64748b',
              marginTop: '2px',
              flexWrap: 'wrap'
            }}>
              <MapPin size={13} color="#0d9488" />
              <span>{currentRegion || 'Sub-Centre Habitation'}</span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span>National Rural Health Mission</span>
            </div>
          </div>
        </div>

        {/* Top Actions: Voice AI & Live GPS Lock */}
        <div className="asha-portal-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleDetectGps}
            disabled={detectingGps}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#334155',
              cursor: detectingGps ? 'not-allowed' : 'pointer',
              minHeight: '42px',
              transition: 'all 0.15s ease'
            }}
            title="Auto-detect current GPS coordinates"
          >
            {detectingGps ? (
              <HeartbeatLoader size={20} color="#0d9488" />
            ) : (
              <Navigation size={15} color="#0d9488" />
            )}
            <span>{detectingGps ? 'Locking GPS...' : 'Sync GPS Location'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsVoiceOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: '42px',
              boxShadow: '0 3px 8px rgba(13, 148, 136, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <Mic size={17} />
            <span>Voice AI Intake</span>
            <Sparkles size={14} color="#fef08a" />
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successNotice && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 700,
          color: '#166534',
          boxShadow: '0 2px 4px rgba(22, 101, 52, 0.05)'
        }}>
          <CheckCircle2 size={18} color="#15803d" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TABS SWITCHER                                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('screening')}
          style={{
            background: activeTab === 'screening' ? '#0f172a' : 'transparent',
            color: activeTab === 'screening' ? '#fff' : '#64748b',
            border: 'none', padding: '10px 24px', borderRadius: '8px',
            fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          New Health Screening
        </button>
        <button
          onClick={() => setActiveTab('field-report')}
          style={{
            background: activeTab === 'field-report' ? '#0f172a' : 'transparent',
            color: activeTab === 'field-report' ? '#fff' : '#64748b',
            border: 'none', padding: '10px 24px', borderRadius: '8px',
            fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Patient Field Report
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            background: activeTab === 'profile' ? '#0f172a' : 'transparent',
            color: activeTab === 'profile' ? '#fff' : '#64748b',
            border: 'none', padding: '10px 24px', borderRadius: '8px',
            fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <User size={16} /> My ASHA Profile
        </button>
      </div>

      {profileNotice && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#166534', fontWeight: 700, fontSize: '0.9rem' }}>
          {profileNotice}
        </div>
      )}

      {activeTab === 'profile' ? (
        <div className="glass-panel" style={{ padding: 'clamp(16px, 3vw, 28px)', borderRadius: '16px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#0f766e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, flexShrink: 0, boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)' }}>
              {staffProfile?.profileImage ? (
                <img src={staffProfile.profileImage} alt="ASHA Worker" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                (staffProfile?.name || currentUser?.name || 'A').charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                  {staffProfile?.name || currentUser?.name || 'ASHA Worker'}
                </h2>
                <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  COMMUNITY HEALTH WORKER (ASHA)
                </span>
              </div>
              <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>
                @{staffProfile?.username || currentUser?.username || 'asha'} • Staff ID: {staffProfile?.staffId || currentUser?.staffId || 'STF-ASHA'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                {staffProfile?.phone || currentUser?.phone || 'Field Worker'} • Village: {staffProfile?.village || currentUser?.village || 'Primary Health Circle'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '24px' }}>
            {/* Box 1: Custom Username Settings */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                Account Username
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#64748b' }}>
                Choose your unique login username (3–30 characters, letters, numbers, dot, underscore, dash).
              </p>
              <form onSubmit={handleUpdateAshaUsername} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    YOUR USERNAME
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 700 }}>@</span>
                    <input
                      type="text"
                      required
                      value={usernameInput}
                      onChange={e => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 28px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600 }}
                      placeholder="e.g. asha_sunita"
                    />
                  </div>
                </div>
                {usernameMsg && (
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: usernameMsg.startsWith('✅') ? '#166534' : '#991b1b' }}>
                    {usernameMsg}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={usernameSaving}
                  style={{ background: '#0f766e', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Save size={15} />
                  {usernameSaving ? 'Saving...' : 'Update Username'}
                </button>
              </form>
            </div>

            {/* Box 2: Profile Details */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                Personal & Contact Details
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#64748b' }}>
                Update your registered contact number, email, and assigned field block.
              </p>
              <form onSubmit={handleSaveStaffProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>FULL NAME</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>PHONE</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>EMAIL</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>DESIGNATION</label>
                    <input
                      type="text"
                      value={profileForm.designation}
                      onChange={e => setProfileForm(prev => ({ ...prev, designation: e.target.value }))}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>VILLAGE / CIRCLE</label>
                    <input
                      type="text"
                      value={profileForm.village}
                      onChange={e => setProfileForm(prev => ({ ...prev, village: e.target.value }))}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={profileSaving}
                  style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}
                >
                  <Save size={15} />
                  {profileSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : activeTab === 'field-report' ? (
        <AshaFieldReport currentUser={currentUser} />
      ) : (
      <>
        {/* ───────────────────────────────────────────────────────────── */}
        {/* 2. MAIN WORKSPACE GRID                                        */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="asha-portal-grid">
        
        {/* ── LEFT COLUMN: PATIENT REGISTRATION FORM ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="asha-section-card">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669'
                }}>
                  <UserPlus size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {patientId ? 'Edit Patient Consultation' : 'New Patient Consultation Form'}
                  </h2>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Record field intake, clinical symptoms & vital signs
                  </div>
                </div>
              </div>

              {!isOnline && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#fffbeb',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>
                  <WifiOff size={12} />
                  Offline
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {/* Section 1: Demographics */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  1. Patient Demographics & Identification
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div className="asha-input-group">
                    <label className="asha-input-label">Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Radhika Devi"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="asha-input-field"
                    />
                  </div>

                  <div className="asha-input-group">
                    <label className="asha-input-label">Age (Years) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="120"
                      value={age}
                      onChange={e => setAge(e.target.value)}
                      className="asha-input-field"
                    />
                  </div>

                  <div className="asha-input-group">
                    <label className="asha-input-label">Gender</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['Female', 'Male', 'Other'].map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`asha-gender-btn ${gender === g ? 'active' : ''}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
                  <div className="asha-input-group">
                    <label className="asha-input-label">Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="+91-9876543210"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="asha-input-field"
                    />
                  </div>

                  <div className="asha-input-group">
                    <div className="asha-input-label">
                      <span>ABHA Health ID</span>
                      <button
                        type="button"
                        onClick={handleGenerateAbha}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0d9488',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Auto-Generate
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. ABHA-91-1044-8821"
                      value={abhaId}
                      onChange={e => setAbhaId(e.target.value)}
                      className="asha-input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Location */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  2. Habitation & Village Sector
                </div>

                <div className="asha-input-group">
                  <div className="asha-input-label">
                    <span>Village / Hamlet Location *</span>
                    <button
                      type="button"
                      onClick={handleDetectGps}
                      disabled={detectingGps}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0d9488',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: detectingGps ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {detectingGps ? (
                        <HeartbeatLoader size={14} color="#0d9488" />
                      ) : (
                        <Navigation size={12} />
                      )}
                      <span>{detectingGps ? 'Detecting...' : 'Use Live GPS'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter village, panchayat, or sub-centre name..."
                    value={village}
                    onChange={e => setVillage(e.target.value)}
                    className="asha-input-field"
                  />
                </div>
              </div>

              {/* Section 3: Clinical Symptoms */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    3. Chief Clinical Symptoms *
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsVoiceOpen(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0d9488',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Mic size={13} />
                    <span>Speak in Hindi / Regional</span>
                  </button>
                </div>

                <div className="asha-input-group">
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe patient's symptoms, onset duration, and clinical history..."
                    value={chiefComplaint}
                    onChange={e => setChiefComplaint(e.target.value)}
                    className="asha-input-field"
                    style={{ resize: 'vertical', lineHeight: 1.5 }}
                  />
                </div>

                {/* Quick Symptom Chips */}
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>
                    Quick-add common field symptoms:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {commonSymptoms.map(s => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => handleAppendSymptom(s.text)}
                        className="asha-chip-btn"
                      >
                        + {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 4: Field Vitals Check */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#475569',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: '10px'
                }}>
                  <HeartPulse size={15} color="#059669" />
                  <span>4. Field Vitals Check (NCD & Maternal Screening)</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  <div className="asha-input-group">
                    <label className="asha-input-label">Blood Pressure (BP)</label>
                    <input
                      type="text"
                      value={bp}
                      onChange={e => setBp(e.target.value)}
                      placeholder="120/80"
                      className="asha-input-field"
                    />
                  </div>

                  <div className="asha-input-group">
                    <div className="asha-input-label">
                      <span>SpO2 (%)</span>
                      {spo2 < 92 && (
                        <span style={{ color: '#dc2626', fontSize: '0.68rem', fontWeight: 800 }}>
                          CRITICAL
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={spo2}
                      onChange={e => setSpo2(e.target.value)}
                      className="asha-input-field"
                      style={{
                        borderColor: spo2 < 92 ? '#ef4444' : spo2 < 95 ? '#f59e0b' : '#cbd5e1',
                        background: spo2 < 92 ? '#fef2f2' : '#ffffff',
                        fontWeight: spo2 < 92 ? 800 : 500
                      }}
                    />
                  </div>

                  <div className="asha-input-group">
                    <label className="asha-input-label">Temp (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={temp}
                      onChange={e => setTemp(e.target.value)}
                      className="asha-input-field"
                    />
                  </div>

                  <div className="asha-input-group">
                    <label className="asha-input-label">Pulse (bpm)</label>
                    <input
                      type="number"
                      value={pulse}
                      onChange={e => setPulse(e.target.value)}
                      className="asha-input-field"
                    />
                  </div>

                  <div className="asha-input-group">
                    <label className="asha-input-label">Blood Sugar</label>
                    <select
                      value={sugar}
                      onChange={e => setSugar(e.target.value)}
                      className="asha-input-field"
                      style={{ padding: '9px 10px' }}
                    >
                      <option value="Normal">Normal (Fasting &lt; 100)</option>
                      <option value="Pre-Diabetic">Pre-Diabetic (100 - 125)</option>
                      <option value="High">High (&gt; 126 mg/dL)</option>
                      <option value="Not Tested">Not Tested</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 5: Feature-Phone SMS / IVR Telemetry Accordion */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <button
                  type="button"
                  onClick={() => setShowSmsTelemetry(!showSmsTelemetry)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#475569'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={14} color="#0d9488" />
                    <span>Zero-Internet GSM SMS / IVR Telemetry Payload</span>
                  </div>
                  {showSmsTelemetry ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showSmsTelemetry && (
                  <div style={{ padding: '0 14px 12px 14px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '8px', marginBottom: '4px' }}>
                      Standardized USSD/SMS telemetry format for zero-data feature phones:
                    </div>
                    <code style={{
                      display: 'block',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '0.75rem',
                      color: '#0f172a',
                      wordBreak: 'break-all',
                      fontFamily: 'monospace'
                    }}>
                      {smsPreview}
                    </code>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '10px',
                    background: saving
                      ? '#0f766e'
                      : 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.28)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {saving ? (
                    <HeartbeatLoader size={24} color="#ffffff" text="Saving & Triaging..." />
                  ) : (
                    <>
                      <Send size={18} />
                      <span>{isOnline ? (patientId ? 'Update Patient' : 'Save & Trigger Intelligent Triage') : 'Save Locally in Offline Queue'}</span>
                    </>
                  )}
                </button>
                
                {patientId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    style={{
                      padding: '14px 20px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#475569',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* ── RIGHT COLUMN: AI CLINICAL TRIAGE MATRIX & RECENT CONSULTATIONS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Real-Time AI Clinical Triage Matrix */}
          <div className="asha-section-card" style={{
            borderLeft: `5px solid ${riskLevel === 'CRITICAL' ? '#ef4444' : riskLevel === 'MODERATE' ? '#f59e0b' : '#10b981'}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color={riskLevel === 'CRITICAL' ? '#ef4444' : riskLevel === 'MODERATE' ? '#d97706' : '#059669'} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Real-Time AI Clinical Triage Matrix
                </h3>
              </div>

              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '16px',
                letterSpacing: '0.04em',
                background: riskLevel === 'CRITICAL' ? '#fee2e2' : riskLevel === 'MODERATE' ? '#fef3c7' : '#dcfce7',
                color: riskLevel === 'CRITICAL' ? '#b91c1c' : riskLevel === 'MODERATE' ? '#b45309' : '#15803d',
                border: `1px solid ${riskLevel === 'CRITICAL' ? '#fca5a5' : riskLevel === 'MODERATE' ? '#fde68a' : '#bbf7d0'}`
              }}>
                {riskLevel} RISK ({triageCategory})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Facility Tier Box */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px'
              }}>
                <div style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#64748b',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}>
                  Recommended Healthcare Facility Tier:
                </div>
                <div style={{
                  fontSize: '0.98rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Building2 size={18} color="#0d9488" />
                  <span>{recommendedTier}</span>
                </div>
              </div>

              {/* Protocol Guidance Box */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px'
              }}>
                <div style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#64748b',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}>
                  ASHA Field Protocol Guidance:
                </div>
                <div style={{
                  fontSize: '0.86rem',
                  color: '#1e293b',
                  marginTop: '4px',
                  lineHeight: 1.5,
                  fontWeight: 500
                }}>
                  {actionGuidance}
                </div>
              </div>

              {/* Explicit Responsible AI Disclaimer */}
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.74rem',
                color: '#166534',
                lineHeight: 1.5
              }}>
                💡 <strong>Responsible Clinical AI:</strong> AI algorithmic scoring assists frontline health workers in triage prioritization and referral routing. It does not replace clinical diagnosis by a licensed medical practitioner.
              </div>
            </div>
          </div>

          {/* Recent Village Consultations Stream */}
          <div className="asha-section-card">
            
            {/* Header, Search & Filter Controls */}
            <div style={{ marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="#0d9488" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Recent Village Consultations ({patients.length})
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => fetchPatients(true)}
                  disabled={refreshing}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: refreshing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Refresh consultations"
                >
                  {refreshing ? (
                    <HeartbeatLoader size={16} color="#0d9488" />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  <span>Refresh</span>
                </button>
              </div>

              {/* Search & Risk Filter Row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search consultations by name, village, or symptoms..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="asha-input-field"
                    style={{ paddingLeft: '32px', fontSize: '0.82rem', padding: '7px 10px 7px 32px' }}
                  />
                </div>

                {/* Risk Filter Chips */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['ALL', 'CRITICAL', 'MODERATE', 'LOW'].map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFilterRisk(lvl)}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '14px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        border: filterRisk === lvl ? '1px solid #0d9488' : '1px solid #e2e8f0',
                        background: filterRisk === lvl ? '#0d9488' : '#ffffff',
                        color: filterRisk === lvl ? '#ffffff' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Patient Consultations Cards List (Zero inner horizontal scrollbar) */}
            <div>
              {loadingPatients ? (
                <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                  <HeartbeatLoader size={36} color="#059669" text="Loading Village Records..." />
                </div>
              ) : filteredPatients.length === 0 ? (
                <div style={{
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '0.85rem'
                }}>
                  No consultation records matching your query.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredPatients.map((p, idx) => {
                    const isCritical = p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH';
                    const isMod = p.riskLevel === 'MODERATE';
                    return (
                      <div
                        key={p.id || p._id || idx}
                        style={{
                          background: '#ffffff',
                          border: `1px solid ${isCritical ? '#fca5a5' : '#e2e8f0'}`,
                          borderRadius: '10px',
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                          transition: 'border-color 0.15s ease'
                        }}
                      >
                        {/* Top row: Name, age/gender, risk badge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '0.94rem', color: '#0f172a' }}>
                              {p.name}
                            </strong>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              ({p.age}y · {p.gender})
                            </span>
                          </div>

                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            letterSpacing: '0.04em',
                            background: isCritical ? '#fee2e2' : isMod ? '#fef3c7' : '#dcfce7',
                            color: isCritical ? '#b91c1c' : isMod ? '#b45309' : '#15803d',
                            border: `1px solid ${isCritical ? '#fca5a5' : isMod ? '#fde68a' : '#bbf7d0'}`
                          }}>
                            {p.riskLevel}
                          </span>
                        </div>

                        {/* Middle: Chief complaint */}
                        <div style={{
                          fontSize: '0.82rem',
                          color: '#334155',
                          lineHeight: 1.45,
                          background: '#f8fafc',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #f1f5f9'
                        }}>
                          {p.chiefComplaint}
                        </div>

                        {/* Bottom: Location, Vitals & Route Button */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          flexWrap: 'wrap',
                          marginTop: '2px'
                        }}>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span>📍 {p.village || 'Sub-Centre'}</span>
                            <span>•</span>
                            <span>SpO2: {p.vitals?.spo2 || 98}%</span>
                            <span>•</span>
                            <span>BP: {p.vitals?.bp || '120/80'}</span>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleEditPatient(p)}
                              style={{
                                background: '#f8fafc',
                                color: '#0f172a',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => onSelectPatientForRouting(p)}
                              style={{
                                background: '#f0fdf4',
                                color: '#065f46',
                                border: '1px solid #a7f3d0',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <span>Route & Refer</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </>
      )}
      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onTriageComplete={(result) => {
          // The VoiceModal handles parsing and returning structured data.
          // We need to auto-fill the form, appending to chiefComplaint if it already exists.
          if (result && result.structuredData) {
            setChiefComplaint(prev => {
              const newText = result.originalTranscript || result.structuredData.symptoms || '';
              if (!prev) return newText;
              return prev.trim() + ' ' + newText;
            });
            
            // Fill vitals if available
            if (result.structuredData.vitals) {
              if (result.structuredData.vitals.bp) setBp(result.structuredData.vitals.bp);
              if (result.structuredData.vitals.spo2) setSpo2(result.structuredData.vitals.spo2);
              if (result.structuredData.vitals.temp) setTemp(result.structuredData.vitals.temp);
              if (result.structuredData.vitals.pulse) setPulse(result.structuredData.vitals.pulse);
            }
            if (result.structuredData.estimatedAge) setAge(result.structuredData.estimatedAge);
          }
        }}
      />
    </div>
  );
}
