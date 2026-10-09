import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Phone, Mail, MapPin, Calendar, Heart, Shield, Activity, Edit3, Save, X, Loader, AlertCircle, CheckCircle2, Clock, Droplets, Stethoscope, FileText, LocateFixed, ChevronDown, ChevronUp, Thermometer, Wind, Zap, Plus, Check, Bell, QrCode, Download, Printer, Maximize2, Minimize2, Pill, Camera, Trash2, Microscope } from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { api, API_BASE } from '../utils/api';
import { getLivePosition, reverseGeocode } from '../utils/geolocation';
import HeartbeatLoader from '../components/HeartbeatLoader';
import MedicalDocumentIntelligence from '../components/MedicalDocumentIntelligence';
function computeAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || m === 0 && today.getDate() < birth.getDate()) age--;
  return age;
}
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}
function formatDateForInput(dateVal) {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}
function VitalCard({
  icon: Icon,
  label,
  value,
  unit,
  color = '#059669',
  onSetup
}) {
  return <div style={{
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ padding: '6px', background: `${color}15`, borderRadius: '8px' }}>
        <Icon size={16} color={color} />
      </div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
        {label}
      </div>
    </div>
    <div style={{ marginTop: '4px' }}>
      {value ? (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{value}</span>
          {unit && <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>{unit}</span>}
        </div>
      ) : (
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '8px' }}>
          No recent reading available.
        </div>
      )}
    </div>
  </div>;
}
function SectionCard({
  id,
  title,
  icon: Icon,
  color = 'var(--primary)',
  action,
  children
}) {
  return <div id={id} className="responsive-section-card" style={{
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(15, 23, 42, 0.03)',
    padding: '24px',
    marginBottom: '1.5rem',
    scrollMarginTop: '100px'
  }}>
      <div style={{
      display: 'flex',
      alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        paddingBottom: '1rem',
        borderBottom: "1px solid var(--borderLight)"
    }}>
        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
          <div style={{
          padding: '6px'
        }}><Icon size={18} color={color} /></div>
          <h3 style={{
          fontSize: '1rem',
          fontWeight: 800,
          margin: 0
        }}>{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>;
}
export default function PatientProfile({
  currentUser,
  onProfileUpdated
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [userData, setUserData] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [qrEnlarged, setQrEnlarged] = useState(false);
  const qrCanvasRef = useRef(null);
  const [expandedHistoryIdx, setExpandedHistoryIdx] = useState(null);

  // Independent section edit states
  const [editingSections, setEditingSections] = useState({
    personal: false,
    emergency: false,
    vitals: false,
    allergies: false
  });
  const [savingSection, setSavingSection] = useState(null); // 'personal' | 'emergency' | 'vitals' | 'allergies' | null

  // Independent form states
  const [personalForm, setPersonalForm] = useState({
    name: '',
    phone: '',
    email: '',
    village: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: ''
  });
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [vitalsForm, setVitalsForm] = useState({
    bp: '',
    spo2: '',
    temp: '',
    pulse: '',
    sugar: ''
  });
  const [allergiesList, setAllergiesList] = useState([]);
  const [conditionsList, setConditionsList] = useState([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  // Profile photo independent state
  const [photoPending, setPhotoPending] = useState(null); // dataUrl | 'REMOVED' | null
  const [savingPhoto, setSavingPhoto] = useState(false);

  // Initialization helpers
  const initPersonalForm = (u, p) => ({
    name: u?.name || '',
    username: u?.username || '',
    phone: u?.phone || '',
    email: u?.email || '',
    village: u?.village || p?.village || '',
    dateOfBirth: formatDateForInput(u?.dateOfBirth || p?.dateOfBirth),
    gender: u?.gender || p?.gender || '',
    bloodGroup: u?.bloodGroup || p?.bloodGroup || ''
  });

  const parseEmergencyContacts = (ecStr) => {
    let ecList = [];
    if (ecStr) {
      ecList = ecStr.split(' | ').map(str => {
        const match = str.match(/(.*?) \((.*?)\) - (.*)/);
        if (match) return { name: match[1].trim(), relation: match[2].trim(), phone: match[3].replace('+91 ', '').trim() };
        return { name: '', relation: '', phone: str.replace('+91 ', '').trim() };
      });
    }
    if (ecList.length === 0) ecList.push({ name: '', relation: '', phone: '' });
    return ecList;
  };

  const initVitalsForm = (p) => ({
    bp: p?.vitals?.bp || '',
    spo2: p?.vitals?.spo2 !== undefined && p?.vitals?.spo2 !== null ? String(p.vitals.spo2) : '',
    temp: p?.vitals?.temp !== undefined && p?.vitals?.temp !== null ? String(p.vitals.temp) : '',
    pulse: p?.vitals?.pulse !== undefined && p?.vitals?.pulse !== null ? String(p.vitals.pulse) : '',
    sugar: p?.vitals?.sugar || ''
  });

  const syncLocalStorage = (updatedUser) => {
    const stored = localStorage.getItem('gramin_arogya_user');
    if (stored && updatedUser) {
      try {
        const parsed = JSON.parse(stored);
        localStorage.setItem('gramin_arogya_user', JSON.stringify({
          ...parsed,
          ...updatedUser
        }));
      } catch {}
    }
  };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [res, fieldRes] = await Promise.allSettled([
        api.getMyPatientProfile(),
        api.getMyFieldVisits()
      ]);
      const profile = res.status === 'fulfilled' ? res.value : null;
      const fieldData = fieldRes.status === 'fulfilled' ? fieldRes.value : null;

      if (profile && profile.success && profile.user) {
        setUserData(profile.user);
        let finalPatient = profile.patient || null;
        if (finalPatient) {
          const mergedField = [...(finalPatient.fieldReports || [])];
          if (fieldData && fieldData.success && Array.isArray(fieldData.fieldVisits)) {
            for (const fv of fieldData.fieldVisits) {
              const fvTime = new Date(fv.visitDate).getTime();
              const exists = mergedField.some(m => Math.abs(new Date(m.visitDate).getTime() - fvTime) < 60000 && m.symptoms === fv.symptoms);
              if (!exists) mergedField.push(fv);
            }
          }
          mergedField.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
          finalPatient.fieldReports = mergedField;
        }
        setPatientData(finalPatient);
        setPrescriptions(Array.isArray(profile.prescriptions) ? profile.prescriptions : []);
        setReferrals(Array.isArray(profile.referrals) ? profile.referrals : []);
        setPersonalForm(initPersonalForm(profile.user, finalPatient));
        setEmergencyContacts(parseEmergencyContacts(profile.user?.emergencyContact || finalPatient?.emergencyContact));
        setVitalsForm(initVitalsForm(finalPatient));
        setAllergiesList(Array.isArray(finalPatient?.knownAllergies) ? [...finalPatient.knownAllergies] : []);
        setConditionsList(Array.isArray(finalPatient?.chronicConditions) ? [...finalPatient.chronicConditions] : []);
      } else {
        setError(profile?.message || 'Could not load profile from database.');
      }
    } catch (e) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProfileSilently = useCallback(async () => {
    try {
      const [res, fieldRes] = await Promise.allSettled([
        api.getMyPatientProfile(),
        api.getMyFieldVisits()
      ]);
      const profile = res.status === 'fulfilled' ? res.value : null;
      const fieldData = fieldRes.status === 'fulfilled' ? fieldRes.value : null;
      if (profile && profile.success) {
        let finalPatient = profile.patient || null;
        if (finalPatient) {
          const mergedField = [...(finalPatient.fieldReports || [])];
          if (fieldData && fieldData.success && Array.isArray(fieldData.fieldVisits)) {
            for (const fv of fieldData.fieldVisits) {
              const fvTime = new Date(fv.visitDate).getTime();
              const exists = mergedField.some(m => Math.abs(new Date(m.visitDate).getTime() - fvTime) < 60000 && m.symptoms === fv.symptoms);
              if (!exists) mergedField.push(fv);
            }
          }
          mergedField.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
          finalPatient.fieldReports = mergedField;
        }
        if (finalPatient) setPatientData(finalPatient);
        if (Array.isArray(profile.prescriptions)) setPrescriptions(profile.prescriptions);
        if (Array.isArray(profile.referrals)) setReferrals(profile.referrals);
      }
    } catch {}
  }, []);

  const isAnySectionEditing = Object.values(editingSections).some(Boolean) || !!photoPending;

  useEffect(() => {
    loadProfile();
    const interval = setInterval(() => {
      if (!isAnySectionEditing) {
        loadProfileSilently();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [loadProfile, loadProfileSilently, isAnySectionEditing]);

  // Real-time synchronization for e-prescriptions (SSE + BroadcastChannel + Storage)
  useEffect(() => {
    const token = localStorage.getItem('gramin_arogya_token') || localStorage.getItem('token');
    const storedUser = localStorage.getItem('gramin_arogya_user');
    let userPhone = '';
    let patId = '';
    try {
      if (storedUser) {
        const u = JSON.parse(storedUser);
        userPhone = u.phone || '';
      }
    } catch {}
    if (patientData?.id) patId = patientData.id;
    if (patientData?.phone && !userPhone) userPhone = patientData.phone;

    let eventSource = null;
    if (token) {
      const sseBase = API_BASE || '/api';
      const sseUrl = `${sseBase}/patient/live-stream?token=${encodeURIComponent(token)}&phone=${encodeURIComponent(userPhone)}&patientId=${encodeURIComponent(patId)}`;
      try {
        eventSource = new EventSource(sseUrl);
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'PRESCRIPTION_ADDED' && data.prescription) {
              const rx = data.prescription;
              setPrescriptions(prev => {
                const exists = prev.some(p => (p.prescriptionId && p.prescriptionId === rx.prescriptionId) || (p._id && p._id === rx._id));
                if (exists) return prev;
                return [rx, ...prev];
              });
              setSuccessMsg(`New E-Prescription #${rx.prescriptionId || ''} received in real-time from ${rx.doctorName || 'Doctor'}! 📋💊`);
              loadProfileSilently();
            } else if (data.type === 'HISTORY_ADDED' || data.type === 'RECORD_UPDATED') {
              setSuccessMsg(`New Medical History & consultation recorded by ${data.visit?.doctorName || 'Doctor'}! 🩺📋`);
              loadProfileSilently();
            }
          } catch (e) {
            console.warn('SSE message parse error:', e);
          }
        };
        eventSource.onerror = () => {
          // EventSource will automatically retry connecting
        };
      } catch (e) {
        console.warn('EventSource initialization note:', e);
      }
    }

    // Cross-tab real-time sync via BroadcastChannel
    let channel = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('prescription_updates');
        channel.onmessage = (msg) => {
          if (msg?.data?.type === 'PRESCRIPTION_ADDED' && msg?.data?.prescription) {
            const rx = msg.data.prescription;
            setPrescriptions(prev => {
              const exists = prev.some(p => (p.prescriptionId && p.prescriptionId === rx.prescriptionId) || (p._id && p._id === rx._id));
              if (exists) return prev;
              return [rx, ...prev];
            });
            setSuccessMsg(`New E-Prescription #${rx.prescriptionId} received in real-time! 📋💊`);
            loadProfileSilently();
          } else if (msg?.data?.type === 'HISTORY_ADDED') {
            setSuccessMsg(`New Medical Record added by Doctor! 🩺📋`);
            loadProfileSilently();
          }
        };
      }
    } catch {}

    // Storage event for same-origin tabs
    const handleStorageChange = (e) => {
      if (e.key === 'prescription_sync_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.prescription) {
            const rx = parsed.prescription;
            setPrescriptions(prev => {
              const exists = prev.some(p => (p.prescriptionId && p.prescriptionId === rx.prescriptionId) || (p._id && p._id === rx._id));
              if (exists) return prev;
              return [rx, ...prev];
            });
            setSuccessMsg(`New E-Prescription #${rx.prescriptionId} received in real-time! 📋💊`);
            loadProfileSilently();
          }
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (eventSource) eventSource.close();
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [patientData?.id, patientData?.phone, loadProfileSilently]);

  const startEditSection = (sectionKey) => {
    setError('');
    setSuccessMsg('');
    if (sectionKey === 'personal') {
      setPersonalForm(initPersonalForm(userData, patientData));
    } else if (sectionKey === 'emergency') {
      setEmergencyContacts(parseEmergencyContacts(userData?.emergencyContact || patientData?.emergencyContact));
    } else if (sectionKey === 'vitals') {
      setVitalsForm(initVitalsForm(patientData));
    } else if (sectionKey === 'allergies') {
      setAllergiesList(Array.isArray(patientData?.knownAllergies) ? [...patientData.knownAllergies] : []);
      setConditionsList(Array.isArray(patientData?.chronicConditions) ? [...patientData.chronicConditions] : []);
      setNewAllergy('');
      setNewCondition('');
    }
    setEditingSections(prev => ({ ...prev, [sectionKey]: true }));
  };

  const cancelEditSection = (sectionKey) => {
    setError('');
    setSuccessMsg('');
    if (sectionKey === 'personal') {
      setPersonalForm(initPersonalForm(userData, patientData));
    } else if (sectionKey === 'emergency') {
      setEmergencyContacts(parseEmergencyContacts(userData?.emergencyContact || patientData?.emergencyContact));
    } else if (sectionKey === 'vitals') {
      setVitalsForm(initVitalsForm(patientData));
    } else if (sectionKey === 'allergies') {
      setAllergiesList(Array.isArray(patientData?.knownAllergies) ? [...patientData.knownAllergies] : []);
      setConditionsList(Array.isArray(patientData?.chronicConditions) ? [...patientData.chronicConditions] : []);
      setNewAllergy('');
      setNewCondition('');
    }
    setEditingSections(prev => ({ ...prev, [sectionKey]: false }));
  };

  const scrollToSectionAndEdit = (sectionId) => {
    const secMap = {
      'sec-personal': 'personal',
      'sec-profile': 'personal',
      'sec-emergency': 'emergency',
      'sec-vitals': 'vitals',
      'sec-allergies': 'allergies'
    };
    const key = secMap[sectionId] || 'personal';
    startEditSection(key);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  const handleGpsDetect = async () => {
    setGpsDetecting(true);
    try {
      const coords = await getLivePosition();
      const geo = await reverseGeocode(coords.lat, coords.lng);
      const parts = [geo.village || geo.shortAddress, geo.district && geo.district !== geo.village ? geo.district : null, geo.postcode ? `PIN ${geo.postcode}` : null].filter(Boolean);
      setPersonalForm(f => ({
        ...f,
        village: parts.join(', ') || geo.shortAddress
      }));
    } catch (e) {
      console.warn('GPS:', e);
    } finally {
      setGpsDetecting(false);
    }
  };

  const handleSavePersonal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!personalForm.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    setError('');
    setSavingSection('personal');
    try {
      // If username was changed, update and validate uniqueness
      if (personalForm.username && personalForm.username.trim().toLowerCase() !== (userData?.username || '').toLowerCase()) {
        const uRes = await api.updateUsername(personalForm.username.trim());
        if (!uRes.success) {
          setError(uRes.message || 'Username is already taken or invalid.');
          setSavingSection(null);
          return;
        } else {
          setUserData(prev => ({ ...prev, username: uRes.username }));
        }
      }

      const payload = {
        name: personalForm.name.trim(),
        phone: personalForm.phone.trim(),
        email: personalForm.email.trim(),
        village: personalForm.village.trim(),
        dateOfBirth: personalForm.dateOfBirth,
        gender: personalForm.gender,
        bloodGroup: personalForm.bloodGroup
      };
      const res = await api.updateMyPatientProfile(payload);
      if (res.success) {
        if (res.user) {
          setUserData(res.user);
          syncLocalStorage(res.user);
          if (onProfileUpdated) onProfileUpdated(res.user);
        }
        if (res.patient) setPatientData(res.patient);
        setEditingSections(prev => ({ ...prev, personal: false }));
        setSuccessMsg('Personal Information updated successfully! ✅');
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.message || 'Failed to update personal information.');
      }
    } catch {
      setError('Network error. Failed to save personal information.');
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveEmergency = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (emergencyContacts && emergencyContacts.length > 0) {
      const phones = [];
      for (const c of emergencyContacts) {
        if (!c.phone || c.phone.trim() === '') continue;
        if (c.phone.trim().length !== 10) {
          setError('Emergency contact mobile numbers must be exactly 10 digits.');
          return;
        }
        if (phones.includes(c.phone.trim())) {
          setError('Duplicate emergency contact numbers are not allowed.');
          return;
        }
        phones.push(c.phone.trim());
      }
    }
    setError('');
    setSavingSection('emergency');
    try {
      const formatted = (emergencyContacts || [])
        .filter(c => c.phone && c.phone.trim().length > 0)
        .map(c => `${c.name || 'Unknown'} (${c.relation || 'Other'}) - +91 ${c.phone.trim()}`)
        .join(' | ');

      const res = await api.updateMyPatientProfile({ emergencyContact: formatted });
      if (res.success) {
        if (res.user) {
          setUserData(res.user);
          syncLocalStorage(res.user);
          if (onProfileUpdated) onProfileUpdated(res.user);
        }
        if (res.patient) setPatientData(res.patient);
        setEditingSections(prev => ({ ...prev, emergency: false }));
        setSuccessMsg('Emergency contacts updated successfully! ✅');
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.message || 'Failed to update emergency contacts.');
      }
    } catch {
      setError('Network error. Failed to save emergency contacts.');
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveVitals = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSavingSection('vitals');
    try {
      const cleanVitals = {
        bp: vitalsForm.bp || '',
        spo2: vitalsForm.spo2 !== undefined && vitalsForm.spo2 !== '' ? Number(vitalsForm.spo2) : undefined,
        temp: vitalsForm.temp !== undefined && vitalsForm.temp !== '' ? Number(vitalsForm.temp) : undefined,
        pulse: vitalsForm.pulse !== undefined && vitalsForm.pulse !== '' ? Number(vitalsForm.pulse) : undefined,
        sugar: vitalsForm.sugar || ''
      };
      const res = await api.updateMyPatientProfile({ vitals: cleanVitals });
      if (res.success) {
        if (res.patient) setPatientData(res.patient);
        setEditingSections(prev => ({ ...prev, vitals: false }));
        setSuccessMsg('Vitals updated successfully! ✅');
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.message || 'Failed to update vitals.');
      }
    } catch {
      setError('Network error. Failed to save vitals.');
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveAllergies = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSavingSection('allergies');
    try {
      const res = await api.updateMyPatientProfile({
        knownAllergies: allergiesList,
        chronicConditions: conditionsList
      });
      if (res.success) {
        if (res.patient) setPatientData(res.patient);
        setEditingSections(prev => ({ ...prev, allergies: false }));
        setSuccessMsg('Allergies and conditions updated successfully! ✅');
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.message || 'Failed to update allergies.');
      }
    } catch {
      setError('Network error. Failed to save allergies.');
    } finally {
      setSavingSection(null);
    }
  };

  const handleImageSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPending(ev.target.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!photoPending) return;
    setSavingPhoto(true);
    setError('');
    try {
      const res = await api.updateMyPatientProfile({
        profileImage: photoPending === 'REMOVED' ? '' : photoPending
      });
      if (res.success && res.user) {
        setUserData(res.user);
        syncLocalStorage(res.user);
        if (onProfileUpdated) onProfileUpdated(res.user);
        setPhotoPending(null);
        setSuccessMsg('Profile photo updated successfully! ✅');
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.message || 'Failed to update photo.');
      }
    } catch {
      setError('Network error. Failed to upload photo.');
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleCancelPhoto = () => {
    setPhotoPending(null);
    setError('');
  };

  const addAllergy = () => {
    if (!newAllergy.trim()) return;
    setAllergiesList(prev => [...prev, newAllergy.trim()]);
    setNewAllergy('');
  };
  const removeAllergy = idx => setAllergiesList(prev => prev.filter((_, i) => i !== idx));

  const addCondition = () => {
    if (!newCondition.trim()) return;
    setConditionsList(prev => [...prev, newCondition.trim()]);
    setNewCondition('');
  };
  const removeCondition = idx => setConditionsList(prev => prev.filter((_, i) => i !== idx));

  const displayAge = computeAge(userData?.dateOfBirth || personalForm.dateOfBirth);
  const medicalHistory = patientData?.medicalHistory || [];
  const fieldReports = patientData?.fieldReports || [];
  const followUpReminders = patientData?.followUpReminders || [];
  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '10px',
    border: '1.5px solid #d1fae5',
    fontSize: '0.88rem',
    outline: 'none',
    background: '#fafffe',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  };
  const labelStyle = {
    fontSize: '0.73rem',
    fontWeight: 700,
    color: '#64748b',
    display: 'block',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  };
  if (loading) {
    return <HeartbeatLoader color="var(--primary)" size={56} text="Loading your health profile..." fullScreen={true} />;
  }
  return <div className="patient-profile-wrapper" style={{
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px 20px'
  }}>
      <style>{`
        /* Mobile-First Responsive Overrides */
        @media (max-width: 768px) {
          .patient-profile-wrapper {
            padding: 16px 12px !important;
          }
          /* Header adjustments */
          .profile-header-container {
            padding: 1.5rem !important;
          }
          .profile-header-flex {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
          }
          .profile-header-info {
            flex-direction: column !important;
            align-items: center !important;
          }
          .profile-header-stats {
            justify-content: center !important;
          }
          .profile-header-actions {
            width: 100% !important;
            justify-content: center !important;
          }
          .profile-header-actions button {
            width: 100% !important;
            justify-content: center !important;
          }
          /* General stacking classes */
          .responsive-stack {
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100% !important;
          }
          /* Vitals grid */
          .vitals-grid {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)) !important;
            gap: 12px !important;
            justify-content: stretch !important;
          }
          .vitals-grid > div {
            min-width: 0 !important;
            width: 100% !important;
          }
          /* QR Code */
          .qr-container {
            flex-direction: column !important;
            align-items: center !important;
          }
          .qr-buttons {
            flex-direction: column !important;
            width: 100% !important;
          }
          .qr-buttons button {
            width: 100% !important;
          }
          /* Tables */
          .responsive-table {
            display: block !important;
            width: 100% !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          /* Allergies & Conditions */
          .conditions-container {
            flex-direction: column !important;
          }
          .conditions-col {
            width: 100% !important;
          }
          /* History & Follow-ups */
          .history-flex {
            flex-direction: column !important;
          }
          /* Bottom Action Bar */
          .bottom-action-bar {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 12px !important;
          }
          .bottom-action-bar > div:first-child {
            justify-content: center !important;
            text-align: center !important;
            margin-bottom: 8px !important;
          }
          .bottom-action-bar > div:last-child {
            flex-direction: column !important;
            width: 100% !important;
          }
          .bottom-action-bar button {
            width: 100% !important;
            justify-content: center !important;
          }
          .print-section {
            page-break-inside: avoid;
          }
        }
      `}</style>
      {/* Header */}
      <div className="profile-header-container" style={{
        background: '#ffffff',
        padding: '2rem',
        borderRadius: '24px',
        marginBottom: '24px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
        border: '1px solid var(--borderLight)',
        position: 'relative'
      }}>
        <div className="profile-header-flex" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          {/* Avatar and Info */}
          <div className="profile-header-info" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
            {/* Avatar Section */}
            <div style={{ position: 'relative', width: '96px', height: '96px', flexShrink: 0 }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
                background: '#f1f5f9', border: '4px solid #fff', boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {(() => {
                  const displayImage = photoPending === 'REMOVED'
                    ? ''
                    : (photoPending || userData?.profileImage || currentUser?.profileImage || '');
                  
                  return displayImage ? (
                    <img 
                      src={displayImage} 
                      alt="Profile" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <User size={40} color="#94a3b8" />
                  );
                })()}
              </div>
              <label style={{
                position: 'absolute', bottom: '0', right: '0', background: 'var(--primary)',
                width: '32px', height: '32px', borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s',
              }}
              title="Change Profile Photo"
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <Camera size={14} color="#000" />
                <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleImageSelected} />
              </label>
            </div>
            
            {/* Info Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'inherit' }}>
                <span style={{ 
                  fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', 
                  color: 'var(--primary)', letterSpacing: '0.05em', 
                  background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '20px' 
                }}>
                  Registered Patient
                </span>
                {patientData?.abhaId && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', color: '#059669' }}>
                    <Shield size={14} color="#10b981" />
                    ABHA Verified
                  </span>
                )}
              </div>
              
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 4px 0', color: '#0f172a', letterSpacing: '-0.5px' }}>
                  {userData?.name || currentUser?.name || 'Patient'}
                </h1>
                <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: '#64748b', fontWeight: 700 }}>
                  {patientData?.id ? `ID: ${patientData.id}` : ''} 
                  {patientData?.abhaId ? ` • ABHA: ${patientData.abhaId}` : ''}
                </div>
              </div>

              <div className="profile-header-stats" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '4px', color: '#475569' }}>
                {userData?.phone && (
                  <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <Phone size={14} color="#94a3b8" /> {userData.phone}
                  </span>
                )}
                {displayAge !== null && (
                  <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <Calendar size={14} color="#94a3b8" /> {displayAge} years
                  </span>
                )}
                {(userData?.gender || patientData?.gender) && (
                  <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <User size={14} color="#94a3b8" /> {userData?.gender || patientData?.gender}
                  </span>
                )}
                {(userData?.bloodGroup || patientData?.bloodGroup) && (
                  <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#ef4444' }}>
                    <Droplets size={14} /> {userData?.bloodGroup || patientData?.bloodGroup}
                  </span>
                )}
                <span 
                  onClick={() => {
                    const el = document.getElementById('sec-history');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ 
                    fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', 
                    fontWeight: 700, color: '#0369a1', cursor: 'pointer',
                    background: '#f0f9ff', padding: '3px 10px', borderRadius: '12px', border: '1px solid #bae6fd'
                  }}
                  title="Click to jump to Medical History"
                >
                  <FileText size={14} color="#0369a1" /> {medicalHistory.length} Medical Visit{medicalHistory.length !== 1 ? 's' : ''}
                </span>
                <span 
                  onClick={() => {
                    const el = document.getElementById('sec-field-reports');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ 
                    fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', 
                    fontWeight: 700, color: '#0d9488', cursor: 'pointer',
                    background: '#f0fdfa', padding: '3px 10px', borderRadius: '12px', border: '1px solid #99f6e4'
                  }}
                  title="Click to jump to ASHA Field Visits"
                >
                  <Activity size={14} color="#0d9488" /> {fieldReports.length} ASHA Visit{fieldReports.length !== 1 ? 's' : ''}
                </span>
                <span 
                  onClick={() => {
                    const el = document.getElementById('sec-medical-ocr');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ 
                    fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', 
                    fontWeight: 700, color: '#059669', cursor: 'pointer',
                    background: '#ecfdf5', padding: '3px 10px', borderRadius: '12px', border: '1.5px solid #a7f3d0'
                  }}
                  title="Click to jump to Medical Record Intelligence & OCR"
                >
                  <Microscope size={14} color="#059669" /> Medical Records & OCR
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="profile-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {photoPending ? (
              <>
                {photoPending !== 'REMOVED' && (userData?.profileImage || photoPending) && (
                  <button type="button" onClick={() => setPhotoPending('REMOVED')} disabled={savingPhoto} style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
                    background: '#fff', border: '1px solid #f87171', borderRadius: '12px',
                    fontWeight: 700, fontSize: '0.84rem', color: '#ef4444', cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    <Trash2 size={14} /> Remove Photo
                  </button>
                )}
                <button type="button" onClick={handleCancelPhoto} disabled={savingPhoto} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px',
                  background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px',
                  fontWeight: 700, fontSize: '0.84rem', color: '#475569', cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <X size={15} /> Cancel
                </button>
                <button type="button" onClick={handleSavePhoto} disabled={savingPhoto} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 22px',
                  background: 'var(--primary)', border: 'none', borderRadius: '12px',
                  fontWeight: 800, fontSize: '0.84rem', color: '#000', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                }}>
                  {savingPhoto ? <HeartbeatLoader color="#000" size={15} /> : <Save size={15} />}
                  <span>{savingPhoto ? 'Saving Photo...' : 'Save Photo'}</span>
                </button>
              </>
            ) : (
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 18px',
                background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px',
                fontWeight: 700, fontSize: '0.84rem', color: '#334155', cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <Camera size={15} color="var(--primary)" />
                <span>Change Photo</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleImageSelected} />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Banners */}
      {successMsg && <div style={{
      marginBottom: '16px',
      padding: '12px 18px',
      border: "1px solid #000",
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: 700
    }}><CheckCircle2 size={18} /> {successMsg}</div>}
      {error && <div style={{
      marginBottom: '16px',
      padding: '12px 18px',
      border: "1px solid #000",
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: 700
    }}><AlertCircle size={18} /> {error}</div>}

      {/* Profile Completion Tracker */}
      {(() => {
        const missing = [];
        if (!userData?.phone && !patientData?.phone) missing.push({ id: 'sec-personal', label: 'Mobile' });
        if (!userData?.dateOfBirth && !patientData?.dateOfBirth) missing.push({ id: 'sec-personal', label: 'Date of Birth' });
        if (!patientData?.village && !userData?.village) missing.push({ id: 'sec-personal', label: 'Address' });
        if (!userData?.emergencyContact && !patientData?.emergencyContact) missing.push({ id: 'sec-emergency', label: 'Emergency Contact' });
        if (!patientData?.knownAllergies?.length) missing.push({ id: 'sec-allergies', label: 'Allergies' });
        if (!patientData?.chronicConditions?.length) missing.push({ id: 'sec-allergies', label: 'Medical Conditions' });

        if (missing.length === 0) return null;
        
        return (
          <div style={{
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(234, 88, 12, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <AlertCircle size={18} color="#ea580c" />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#9a3412' }}>Complete Your Health Profile</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {missing.map((m, i) => (
                <button key={i} type="button" onClick={() => scrollToSectionAndEdit(m.id)} style={{
                  background: '#fff', border: '1px solid #fdba74', borderRadius: '20px', padding: '6px 14px',
                  fontSize: '0.8rem', fontWeight: 700, color: '#c2410c', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}>
                  <Plus size={12} /> Set Up {m.label}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Permissions Scope Banner */}
      <div style={{
      background: 'var(--primary)',
      border: "1.5px solid #000",
      padding: '14px 18px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px'
    }}>
        <div style={{
        width: '34px',
        height: '34px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
          <Shield size={18} />
        </div>
        <div style={{
        flex: 1,
        fontSize: '0.82rem',
        lineHeight: 1.45
      }}>
          <div style={{
          fontWeight: 800,
          fontSize: '0.88rem',
          marginBottom: '2px'
        }}>
            Patient Self-Service Access & Attending Doctor Permissions
          </div>
          <div>
            <strong>You can edit:</strong> Your personal demographics, mobile number, email, residence location, emergency contact, and self-reported health notes.
          </div>
          <div style={{
          marginTop: '2px'
        }}>
            <strong>Doctor permissions:</strong> Your attending physician is authorized to verify and update your clinical baselines (Blood Group, Vitals, Diagnosed Conditions, Allergies, Clinical Health Status & Remarks).
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <SectionCard id="sec-personal" title="Personal Information" icon={User} color="#059669" action={
        editingSections.personal ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => cancelEditSection('personal')}
              disabled={savingSection === 'personal'}
              style={{
                padding: '5px 12px', fontSize: '0.78rem', fontWeight: 700,
                background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px',
                color: '#475569', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePersonal}
              disabled={savingSection === 'personal'}
              style={{
                padding: '5px 14px', fontSize: '0.78rem', fontWeight: 800,
                background: '#059669', border: 'none', borderRadius: '8px',
                color: '#ffffff', cursor: 'pointer', display: 'inline-flex',
                alignItems: 'center', gap: '5px'
              }}
            >
              {savingSection === 'personal' ? <HeartbeatLoader color="#fff" size={13} /> : <Save size={12} />}
              <span>{savingSection === 'personal' ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => startEditSection('personal')} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            border: "1px solid #000",
            padding: '5px 12px',
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: '#ffffff'
          }}>
            <Edit3 size={12} /> Edit Details
          </button>
        )
      }>
        {editingSections.personal ? <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px'
          }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input
                type="text"
                style={inputStyle}
                value={personalForm.name}
                onChange={e => setPersonalForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label style={labelStyle}>📱 Mobile</label>
              <input
                type="text"
                style={inputStyle}
                value={personalForm.phone}
                onChange={e => setPersonalForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91-XXXXX-XXXXX"
              />
            </div>
            <div>
              <label style={labelStyle}>✉️ Email</label>
              <input
                type="email"
                style={inputStyle}
                value={personalForm.email}
                onChange={e => setPersonalForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label style={labelStyle}>📅 Date of Birth</label>
              <input
                type="date"
                style={inputStyle}
                value={personalForm.dateOfBirth}
                onChange={e => setPersonalForm(f => ({ ...f, dateOfBirth: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>⚧ Gender</label>
              <select
                style={inputStyle}
                value={personalForm.gender}
                onChange={e => setPersonalForm(f => ({ ...f, gender: e.target.value }))}
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>🩸 Blood Group</label>
              <select
                style={inputStyle}
                value={personalForm.bloodGroup}
                onChange={e => setPersonalForm(f => ({ ...f, bloodGroup: e.target.value }))}
              >
                <option value="">Select...</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>👤 Username (@)</label>
              <input
                style={inputStyle}
                value={personalForm.username || ''}
                onChange={e => setPersonalForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') }))}
                placeholder="your_unique_username"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={labelStyle}>📍 Village / Location</label>
                <button
                  type="button"
                  onClick={handleGpsDetect}
                  disabled={gpsDetecting}
                  style={{
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    background: 'transparent',
                    color: '#059669'
                  }}
                >
                  <LocateFixed size={11} /> {gpsDetecting ? 'Detecting...' : 'Auto GPS'}
                </button>
              </div>
              <input
                style={inputStyle}
                value={personalForm.village}
                onChange={e => setPersonalForm(f => ({ ...f, village: e.target.value }))}
                placeholder="Village, District, PIN..."
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={() => cancelEditSection('personal')}
              disabled={savingSection === 'personal'}
              style={{
                padding: '8px 18px', fontSize: '0.84rem', fontWeight: 700,
                background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px',
                color: '#475569', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePersonal}
              disabled={savingSection === 'personal'}
              style={{
                padding: '8px 22px', fontSize: '0.84rem', fontWeight: 800,
                background: '#059669', border: 'none', borderRadius: '8px',
                color: '#ffffff', cursor: 'pointer', display: 'inline-flex',
                alignItems: 'center', gap: '6px'
              }}
            >
              {savingSection === 'personal' ? <HeartbeatLoader color="#fff" size={15} /> : <Save size={14} />}
              <span>{savingSection === 'personal' ? 'Saving...' : 'Save Personal Details'}</span>
            </button>
          </div>
        </div> : <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '16px 24px'
          }}>
            {[{
              label: 'Email',
              value: userData?.email,
              icon: Mail
            }, {
              label: 'Mobile',
              value: userData?.phone,
              icon: Phone
            }, {
              label: 'Date of Birth',
              value: formatDate(userData?.dateOfBirth),
              icon: Calendar
            }, {
              label: 'Age',
              value: displayAge ? `${displayAge} years` : null,
              icon: User
            }, {
              label: 'Gender',
              value: userData?.gender || patientData?.gender,
              icon: User
            }, {
              label: 'Blood Group',
              value: userData?.bloodGroup || patientData?.bloodGroup,
              icon: Droplets
            }, {
              label: 'Location',
              value: userData?.village || patientData?.village,
              icon: MapPin
            }, {
              label: 'Username',
              value: userData?.username,
              icon: User
            }].map(({
              label,
              value,
              icon: Icon
            }) => <div key={label} style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}><Icon size={11} /> {label}</div>
                {value ? (
                  <div style={{
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    lineHeight: 1.4
                  }}>{value}</div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditSection('personal')}
                    style={{
                      background: 'transparent', border: 'none', color: 'var(--primary)',
                      fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', padding: 0,
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      textDecoration: 'underline'
                    }}
                  >
                    Set Up {label}
                  </button>
                )}
              </div>)}
          </div>}
      </SectionCard>

      {/* Emergency Contact */}
      <SectionCard id="sec-emergency" title="Emergency Contact" icon={AlertCircle} color="#dc2626" action={
        editingSections.emergency ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => cancelEditSection('emergency')}
              disabled={savingSection === 'emergency'}
              style={{
                padding: '5px 12px', fontSize: '0.78rem', fontWeight: 700,
                background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px',
                color: '#475569', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEmergency}
              disabled={savingSection === 'emergency'}
              style={{
                padding: '5px 14px', fontSize: '0.78rem', fontWeight: 800,
                background: '#dc2626', border: 'none', borderRadius: '8px',
                color: '#ffffff', cursor: 'pointer', display: 'inline-flex',
                alignItems: 'center', gap: '5px'
              }}
            >
              {savingSection === 'emergency' ? <HeartbeatLoader color="#fff" size={13} /> : <Save size={12} />}
              <span>{savingSection === 'emergency' ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => startEditSection('emergency')} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            border: "1px solid #000",
            padding: '5px 12px',
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: '#ffffff'
          }}>
            <Edit3 size={12} /> Edit Contact
          </button>
        )
      }>
        {editingSections.emergency ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(emergencyContacts || []).map((contact, idx) => (
              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', position: 'relative' }}>
                {emergencyContacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setEmergencyContacts(prev => prev.filter((_, i) => i !== idx))}
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    title="Remove Contact"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ ...labelStyle, marginBottom: '4px' }}>Contact Name</label>
                    <input
                      style={inputStyle}
                      value={contact.name}
                      onChange={e => {
                        const newArr = [...emergencyContacts];
                        newArr[idx].name = e.target.value;
                        setEmergencyContacts(newArr);
                      }}
                      placeholder="e.g. Ramesh Makwana"
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, marginBottom: '4px' }}>Relationship</label>
                    <select
                      style={{ ...inputStyle, appearance: 'auto' }}
                      value={contact.relation}
                      onChange={e => {
                        const newArr = [...emergencyContacts];
                        newArr[idx].relation = e.target.value;
                        setEmergencyContacts(newArr);
                      }}
                    >
                      <option value="">Select Relation...</option>
                      <option value="Parent">Parent</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ ...labelStyle, marginBottom: '4px' }}>Mobile Number * (10 Digits)</label>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #d1fae5', borderRadius: '10px', background: '#fafffe', overflow: 'hidden' }}>
                      <div style={{ background: '#ecfdf5', padding: '9px 12px', color: '#047857', fontWeight: 800, fontSize: '0.88rem', borderRight: '1px solid #d1fae5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} /> +91
                      </div>
                      <input
                        style={{ ...inputStyle, border: 'none', borderRadius: 0, paddingLeft: '12px' }}
                        value={contact.phone}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          const newArr = [...emergencyContacts];
                          newArr[idx].phone = val;
                          setEmergencyContacts(newArr);
                        }}
                        placeholder="Enter 10-digit mobile number"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setEmergencyContacts(prev => [...prev, { name: '', relation: '', phone: '' }])}
              style={{
                alignSelf: 'flex-start', background: '#eff6ff', color: '#1d4ed8',
                border: '1px dashed #bfdbfe', padding: '8px 16px', borderRadius: '8px',
                fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: '6px'
              }}
            >
              <Plus size={14} /> Add Another Contact
            </button>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => cancelEditSection('emergency')}
                disabled={savingSection === 'emergency'}
                style={{
                  padding: '8px 18px', fontSize: '0.84rem', fontWeight: 700,
                  background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px',
                  color: '#475569', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEmergency}
                disabled={savingSection === 'emergency'}
                style={{
                  padding: '8px 22px', fontSize: '0.84rem', fontWeight: 800,
                  background: '#dc2626', border: 'none', borderRadius: '8px',
                  color: '#ffffff', cursor: 'pointer', display: 'inline-flex',
                  alignItems: 'center', gap: '6px'
                }}
              >
                {savingSection === 'emergency' ? <HeartbeatLoader color="#fff" size={15} /> : <Save size={14} />}
                <span>{savingSection === 'emergency' ? 'Saving...' : 'Save Emergency Contacts'}</span>
              </button>
            </div>
          </div>
        ) : <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
            <Phone size={18} color="#dc2626" />
            <span style={{
          fontSize: '1rem',
          fontWeight: 700
        }}>{(userData?.emergencyContact || patientData?.emergencyContact) ? (userData?.emergencyContact || patientData?.emergencyContact) : (
              <button type="button" onClick={() => startEditSection('emergency')} style={{
                background: 'transparent', border: 'none', color: 'var(--primary)',
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', padding: 0,
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                textDecoration: 'underline'
              }}>
                Set Up Emergency Contact
              </button>
            )}</span>
          </div>}
      </SectionCard>

      {/* Vitals */}
      <SectionCard id="sec-vitals" title="Current Vitals & Health Status" icon={Activity} color="#0ea5e9" action={
        editingSections.vitals ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => cancelEditSection('vitals')}
              disabled={savingSection === 'vitals'}
              style={{
                padding: '5px 12px', fontSize: '0.78rem', fontWeight: 700,
                background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px',
                color: '#475569', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveVitals}
              disabled={savingSection === 'vitals'}
              style={{
                padding: '5px 14px', fontSize: '0.78rem', fontWeight: 800,
                background: '#0ea5e9', border: 'none', borderRadius: '8px',
                color: '#ffffff', cursor: 'pointer', display: 'inline-flex',
                alignItems: 'center', gap: '5px'
              }}
            >
              {savingSection === 'vitals' ? <HeartbeatLoader color="#fff" size={13} /> : <Save size={12} />}
              <span>{savingSection === 'vitals' ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => startEditSection('vitals')} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            border: "1px solid #000",
            padding: '5px 12px',
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: '#ffffff'
          }}>
            <Edit3 size={12} /> Update Vitals
          </button>
        )
      }>
        {editingSections.vitals ? <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px'
          }}>
            {[
              ['bp', 'Blood Pressure', '120/80'],
              ['spo2', 'SpO2 (%)', '98'],
              ['temp', 'Temp (°F)', '98.4'],
              ['pulse', 'Pulse (bpm)', '72'],
              ['sugar', 'Blood Sugar', 'Normal']
            ].map(([key, lbl, ph]) => (
              <div key={key}>
                <label style={labelStyle}>{lbl}</label>
                <input
                  style={inputStyle}
                  value={vitalsForm[key] || ''}
                  placeholder={ph}
                  onChange={e => setVitalsForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={() => cancelEditSection('vitals')}
              disabled={savingSection === 'vitals'}
              style={{
                padding: '8px 18px', fontSize: '0.84rem', fontWeight: 700,
                background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px',
                color: '#475569', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveVitals}
              disabled={savingSection === 'vitals'}
              style={{
                padding: '8px 22px', fontSize: '0.84rem', fontWeight: 800,
                background: '#0ea5e9', border: 'none', borderRadius: '8px',
                color: '#ffffff', cursor: 'pointer', display: 'inline-flex',
                alignItems: 'center', gap: '6px'
              }}
            >
              {savingSection === 'vitals' ? <HeartbeatLoader color="#fff" size={15} /> : <Save size={14} />}
              <span>{savingSection === 'vitals' ? 'Saving...' : 'Save Vitals'}</span>
            </button>
          </div>
        </div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <VitalCard icon={Activity} label="Blood Pressure" value={patientData?.vitals?.bp} unit="mmHg" color="#0ea5e9" onSetup={() => startEditSection('vitals')} />
            <VitalCard icon={Wind} label="SpO2 Level" value={patientData?.vitals?.spo2} unit="%" color="#10b981" onSetup={() => startEditSection('vitals')} />
            <VitalCard icon={Thermometer} label="Body Temp" value={patientData?.vitals?.temp} unit="°F" color="#f59e0b" onSetup={() => startEditSection('vitals')} />
            <VitalCard icon={Heart} label="Pulse Rate" value={patientData?.vitals?.pulse} unit="bpm" color="#ef4444" onSetup={() => startEditSection('vitals')} />
            <VitalCard icon={Droplets} label="Blood Sugar" value={patientData?.vitals?.sugar} unit="" color="#8b5cf6" onSetup={() => startEditSection('vitals')} />
          </div>}
        {patientData?.currentHealthStatus?.summary && <div style={{
          marginTop: '14px',
          padding: '10px 14px',
          fontSize: '0.85rem',
          border: "1px solid #000"
        }}>
            <strong>Status:</strong> {patientData.currentHealthStatus.condition} — {patientData.currentHealthStatus.summary}
          </div>}
      </SectionCard>

      {/* Allergies & Conditions */}
      <SectionCard id="sec-allergies" title="Allergies & Chronic Conditions" icon={Shield} color="#7c3aed" action={
        editingSections.allergies ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => cancelEditSection('allergies')}
              disabled={savingSection === 'allergies'}
              style={{
                padding: '5px 12px', fontSize: '0.78rem', fontWeight: 700,
                background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px',
                color: '#475569', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAllergies}
              disabled={savingSection === 'allergies'}
              style={{
                padding: '5px 14px', fontSize: '0.78rem', fontWeight: 800,
                background: '#7c3aed', border: 'none', borderRadius: '8px',
                color: '#ffffff', cursor: 'pointer', display: 'inline-flex',
                alignItems: 'center', gap: '5px'
              }}
            >
              {savingSection === 'allergies' ? <HeartbeatLoader color="#fff" size={13} /> : <Save size={12} />}
              <span>{savingSection === 'allergies' ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => startEditSection('allergies')} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            border: "1px solid #000",
            padding: '5px 12px',
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: '#ffffff'
          }}>
            <Edit3 size={12} /> Update Notes
          </button>
        )
      }>
        <div className="conditions-container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px'
        }}>
          {/* Allergies */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚠️ Known Allergies
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', minHeight: '28px' }}>
              {(!allergiesList || allergiesList.length === 0) ? (
                editingSections.allergies ? <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>None recorded.</span> : (
                  <button type="button" onClick={() => startEditSection('allergies')} style={{
                    background: 'transparent', border: 'none', color: 'var(--primary)',
                    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', padding: 0, textDecoration: 'underline'
                  }}>Set Up Allergies</button>
                )
              ) : (allergiesList || []).map((a, i) => (
                <span key={i} style={{
                  padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600,
                  background: '#fee2e2', color: '#991b1b', borderRadius: '20px',
                  display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #fecaca'
                }}>
                  {a} {editingSections.allergies && <button type="button" onClick={() => removeAllergy(i)} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex'
                  }}><X size={12} color="#991b1b" /></button>}
                </span>
              ))}
            </div>
            {editingSections.allergies && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={{ ...inputStyle, padding: '8px 12px', fontSize: '0.85rem' }} value={newAllergy} onChange={e => setNewAllergy(e.target.value)} placeholder="e.g. Penicillin, Peanuts..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAllergy())} />
                <button type="button" onClick={addAllergy} style={{
                  background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px',
                  padding: '0 16px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}>Add</button>
              </div>
            )}
          </div>

          {/* Chronic Conditions */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🏥 Chronic Conditions
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', minHeight: '28px' }}>
              {(!conditionsList || conditionsList.length === 0) ? (
                editingSections.allergies ? <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>None recorded.</span> : (
                  <button type="button" onClick={() => startEditSection('allergies')} style={{
                    background: 'transparent', border: 'none', color: 'var(--primary)',
                    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', padding: 0, textDecoration: 'underline'
                  }}>Set Up Medical Conditions</button>
                )
              ) : (conditionsList || []).map((c, i) => (
                <span key={i} style={{
                  padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600,
                  background: '#fef3c7', color: '#92400e', borderRadius: '20px',
                  display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #fde68a'
                }}>
                  {c} {editingSections.allergies && <button type="button" onClick={() => removeCondition(i)} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex'
                  }}><X size={12} color="#92400e" /></button>}
                </span>
              ))}
            </div>
            {editingSections.allergies && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={{ ...inputStyle, padding: '8px 12px', fontSize: '0.85rem' }} value={newCondition} onChange={e => setNewCondition(e.target.value)} placeholder="e.g. Asthma, Hypertension..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCondition())} />
                <button type="button" onClick={addCondition} style={{
                  background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px',
                  padding: '0 16px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}>Add</button>
              </div>
            )}
          </div>
        </div>
        {editingSections.allergies && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={() => cancelEditSection('allergies')}
              disabled={savingSection === 'allergies'}
              style={{
                padding: '8px 18px', fontSize: '0.84rem', fontWeight: 700,
                background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px',
                color: '#475569', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAllergies}
              disabled={savingSection === 'allergies'}
              style={{
                padding: '8px 22px', fontSize: '0.84rem', fontWeight: 800,
                background: '#7c3aed', border: 'none', borderRadius: '8px',
                color: '#ffffff', cursor: 'pointer', display: 'inline-flex',
                alignItems: 'center', gap: '6px'
              }}
            >
              {savingSection === 'allergies' ? <HeartbeatLoader color="#fff" size={15} /> : <Save size={14} />}
              <span>{savingSection === 'allergies' ? 'Saving...' : 'Save Notes'}</span>
            </button>
          </div>
        )}
      </SectionCard>

      {/* ═══════════════════════ MY HEALTH QR SECTION ═══════════════════════ */}
      <SectionCard id="sec-qr" title="My Health QR Code" icon={QrCode} color="#7c3aed">
        <style>{`
          @keyframes qrPulse { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0.15)} 50%{box-shadow:0 0 0 12px rgba(124,58,237,0)} }
        `}</style>

        <div className="qr-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
          {/* QR Code Block */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: '#ffffff',
              border: '2px solid #7c3aed22',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 4px 20px rgba(124,58,237,0.10)',
              animation: 'qrPulse 3s infinite'
            }}>
              <QRCodeSVG
                value={JSON.stringify({
                  qrToken: patientData?.qrToken || patientData?.id || 'GRAMIN_HEALTH',
                  patientId: patientData?.id || '',
                  name: userData?.name || '',
                  sscCode: patientData?.sscCode || '',
                  abhaId: patientData?.abhaId || ''
                })}
                size={140}
                level="M"
                includeMargin={true}
                fgColor="#1e1b4b"
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                🔒 Secure Health QR
              </div>
              <div style={{ fontSize: '0.64rem', color: '#64748b', marginTop: '2px', maxWidth: '160px' }}>
                Safe token only — no medical data stored inside
              </div>
            </div>
          </div>

          {/* Info + Actions */}
          <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* ID Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {patientData?.id && (
                <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '10px', padding: '8px 14px' }}>
                  <div style={{ fontSize: '0.62rem', color: '#1d4ed8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Patient ID</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#1e3a8a', fontFamily: 'monospace' }}>{patientData.id}</div>
                </div>
              )}
              {patientData?.sscCode && (
                <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: '10px', padding: '8px 14px' }}>
                  <div style={{ fontSize: '0.62rem', color: '#047857', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>SSC Code</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#065f46', fontFamily: 'monospace' }}>{patientData.sscCode}</div>
                </div>
              )}
              {patientData?.abhaId && (
                <div style={{ background: '#faf5ff', border: '1.5px solid #e9d5ff', borderRadius: '10px', padding: '8px 14px' }}>
                  <div style={{ fontSize: '0.62rem', color: '#7c3aed', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>ABHA ID</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#6b21a8', fontFamily: 'monospace', wordBreak: 'break-all' }}>{patientData.abhaId}</div>
                </div>
              )}
            </div>

            {/* QR Token (safe token display) */}
            {patientData?.qrToken && (
              <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '10px 14px' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>QR Token (Safe — show to doctor/clinic)</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, fontFamily: 'monospace', color: '#1e293b', wordBreak: 'break-all' }}>{patientData.qrToken}</div>
              </div>
            )}

            {/* Actions */}
            <div className="qr-buttons no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setQrEnlarged(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1.5px solid #7c3aed', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#7c3aed', cursor: 'pointer', background: '#faf5ff' }}
              >
                <Maximize2 size={14} /> View / Enlarge
              </button>
              <button
                type="button"
                onClick={() => {
                  // Download QR as PNG via canvas
                  const canvas = document.getElementById('patient-qr-canvas-hidden');
                  if (canvas) {
                    const url = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `GraminArogya_QR_${patientData?.id || 'patient'}.png`;
                    a.click();
                  }
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1.5px solid #059669', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#059669', cursor: 'pointer', background: '#ecfdf5' }}
              >
                <Download size={14} /> Download QR
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1.5px solid #0369a1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#0369a1', cursor: 'pointer', background: '#eff6ff' }}
              >
                <Printer size={14} /> Print QR / PDF
              </button>
            </div>
          </div>
        </div>

        {/* Hidden canvas for download (QRCodeCanvas renders to actual canvas element) */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }} aria-hidden="true">
          <QRCodeCanvas
            id="patient-qr-canvas-hidden"
            value={JSON.stringify({
              qrToken: patientData?.qrToken || patientData?.id || 'GRAMIN_HEALTH',
              patientId: patientData?.id || '',
              name: userData?.name || '',
              sscCode: patientData?.sscCode || '',
              abhaId: patientData?.abhaId || ''
            })}
            size={400}
            level="M"
            includeMargin={true}
          />
        </div>
      </SectionCard>

      {/* ═══════════════════════ PRESCRIPTIONS SECTION ═══════════════════════ */}
      <SectionCard id="sec-prescriptions" title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span>My Prescriptions ({prescriptions.length})</span>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            background: '#ecfdf5',
            color: '#059669',
            border: '1px solid #a7f3d0',
            padding: '2px 8px',
            borderRadius: '999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Realtime Live
          </span>
        </div>
      } icon={Pill} color="#ea580c" action={
        <button type="button" onClick={loadProfile} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          border: "1px solid #000",
          padding: '5px 12px',
          fontSize: '0.76rem',
          fontWeight: 700,
          cursor: 'pointer',
          background: '#ffffff'
        }}>
          <Clock size={12} /> Refresh
        </button>
      }>
        {prescriptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <Pill size={36} color="#cbd5e1" style={{ display: 'block', margin: '0 auto 10px' }} />
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
              No prescriptions on record.
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Jab bhi doctor aapke liye prescription banayega, yahan real-time automatically show hogi.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {prescriptions.map((rx, idx) => (
              <div key={idx} style={{
                border: '1px solid #fed7aa',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#fff7ed',
                boxShadow: '0 2px 8px rgba(234,88,12,0.04)'
              }}>
                {/* Rx Header */}
                <div style={{
                  background: 'linear-gradient(90deg, #ea580c, #c2410c)',
                  color: '#fff',
                  padding: '12px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Pill size={16} />
                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                      {rx.prescriptionId ? `Rx #${rx.prescriptionId}` : `Rx #${idx + 1}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.74rem', color: '#fed7aa', flexWrap: 'wrap' }}>
                    {rx.prescribedAt && (
                      <span>📅 {new Date(rx.prescribedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    )}
                    {rx.doctorName && (
                      <span style={{ color: '#ffffff', fontWeight: 700 }}>👨‍⚕️ {rx.doctorName.startsWith('Dr.') ? rx.doctorName : `Dr. ${rx.doctorName}`}</span>
                    )}
                    {rx.facilityName && (
                      <span>🏥 {rx.facilityName}</span>
                    )}
                    {rx.status && (
                      <span style={{
                        background: rx.status === 'Dispensed' ? '#dcfce7' : rx.status === 'Prescribed' ? '#fef9c3' : '#f1f5f9',
                        color: rx.status === 'Dispensed' ? '#15803d' : rx.status === 'Prescribed' ? '#854d0e' : '#475569',
                        padding: '2px 9px',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '0.7rem'
                      }}>
                        {rx.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Rx Details & Medicines */}
                <div style={{ padding: '16px 18px' }}>
                  {rx.diagnosis && (
                    <div style={{ marginBottom: '12px', fontSize: '0.84rem' }}>
                      <span style={{ color: '#64748b', fontWeight: 700 }}>Provisional Diagnosis: </span>
                      <strong style={{ color: '#0f172a' }}>{rx.diagnosis}</strong>
                    </div>
                  )}

                  {Array.isArray(rx.medicines) && rx.medicines.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        💊 Prescribed Medicines & Dosage Schedule
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {rx.medicines.map((med, mIdx) => (
                          <div key={mIdx} style={{
                            background: '#ffffff',
                            border: '1px solid #fdba74',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '10px',
                            fontSize: '0.83rem'
                          }}>
                            <div>
                              <strong style={{ color: '#1e293b', fontSize: '0.88rem' }}>
                                {med.medicineName || med.name || med.medicine || 'Prescribed Medicine'}
                              </strong>
                              {(med.dosage || med.dosageForm) && (
                                <span style={{ color: '#64748b', marginLeft: '6px', fontSize: '0.78rem' }}>
                                  ({med.dosage || med.dosageForm})
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '14px', fontSize: '0.76rem', color: '#64748b', flexWrap: 'wrap' }}>
                              {med.frequency && <span>🔁 <strong>Freq:</strong> {med.frequency}</span>}
                              {med.duration && <span>⏱ <strong>Duration:</strong> {med.duration}</span>}
                              {(med.instructions || med.instruction) && (
                                <span style={{ color: '#0369a1', fontWeight: 600 }}>ℹ️ {med.instructions || med.instruction}</span>
                              )}
                              {med.prescribedQty && (
                                <span style={{ color: '#047857' }}>📦 <strong>Qty:</strong> {med.prescribedQty}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(rx.clinicalNotes || rx.notes) && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', fontSize: '0.8rem', color: '#7c2d12' }}>
                      <strong>Doctor Notes / Instructions:</strong> {rx.clinicalNotes || rx.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ═══════════════════════ DIGITAL REFERRALS SECTION ═══════════════════════ */}
      {referrals.length > 0 && (
        <SectionCard id="sec-referrals" title={`My Hospital Referrals (${referrals.length})`} icon={FileText} color="#059669">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {referrals.map((ref, idx) => (
              <div key={idx} style={{
                border: '1px solid #a7f3d0',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#f0fdf4'
              }}>
                <div style={{
                  background: 'linear-gradient(90deg, #059669, #047857)',
                  color: '#fff',
                  padding: '10px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={15} />
                    <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>
                      Referral #{ref.referralCode || ref.id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: '#a7f3d0' }}>
                    {ref.initiatedAt && <span>📅 {new Date(ref.initiatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    {ref.status && (
                      <span style={{
                        background: ref.status === 'Completed' || ref.status === 'Doctor_Attended' ? '#dcfce7' : '#fef9c3',
                        color: ref.status === 'Completed' || ref.status === 'Doctor_Attended' ? '#15803d' : '#854d0e',
                        padding: '1px 8px',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '0.7rem'
                      }}>
                        {ref.status}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px', fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: 700 }}>Referred To: </span>
                      <strong style={{ color: '#065f46' }}>{ref.referredToFacilityName || 'Specialist Facility'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: 700 }}>Referring Unit: </span>
                      <span style={{ color: '#1e293b' }}>{ref.referringUnit}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: 700 }}>Reason: </span>
                      <span style={{ color: '#1e293b' }}>{ref.referralReason}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: 700 }}>Provisional Diagnosis: </span>
                      <span style={{ color: '#1e293b' }}>{ref.provisionalDiagnosis}</span>
                    </div>
                  </div>

                  {ref.doctorHandoffNotes && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '0.8rem' }}>
                      <strong>Doctor Handoff Notes:</strong> {ref.doctorHandoffNotes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Follow-Up Reminders & Doctor Appointments */}

      <SectionCard id="sec-reminders" title={`Doctor Follow-Up Checkups (${followUpReminders.length})`} icon={Bell} color="#d97706" action={<button type="button" onClick={loadProfile} style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      border: "1px solid #000",
      padding: '5px 12px',
      fontSize: '0.76rem',
      fontWeight: 700,
      cursor: 'pointer'
    }}>
            <Clock size={12} /> Refresh
          </button>}>
        {followUpReminders.length === 0 ? <div style={{
        textAlign: 'center',
        padding: '24px 0'
      }}>
            <Bell size={32} color="#cbd5e1" style={{
          marginBottom: '8px',
          display: 'block',
          margin: '0 auto 8px'
        }} />
            <div style={{
          fontSize: '0.9rem',
          fontWeight: 700
        }}>No pending doctor checkup reminders.</div>
            <div style={{
          fontSize: '0.78rem',
          marginTop: '4px'
        }}>Jab bhi doctor aapke liye follow-up checkup schedule karega, yahan real-time appear hoga.</div>
          </div> : <div style={{ position: 'relative', paddingLeft: '16px' }}>
            <div style={{ position: 'absolute', left: '23px', top: '24px', bottom: '24px', width: '2px', background: '#fde68a', zIndex: 0 }}></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 1 }}>
              {followUpReminders.map((rem, idx) => {
                const isDone = rem.status === 'COMPLETED';
                const dueDateObj = new Date(rem.dueDate);
                const isToday = dueDateObj.toDateString() === new Date().toDateString();
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const isTomorrow = dueDateObj.toDateString() === tomorrow.toDateString();
                const dayBadge = isToday ? 'Due Today' : isTomorrow ? 'Due Tomorrow' : formatDate(rem.dueDate);
                
                const dotColor = isDone ? '#10b981' : isToday ? '#ef4444' : '#d97706';
                const bgColor = isDone ? '#f0fdf4' : isToday ? '#fef2f2' : '#fffbeb';
                const borderColor = isDone ? '#bbf7d0' : isToday ? '#fecaca' : '#fde68a';

                return (
                  <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', border: `3px solid ${dotColor}`, marginTop: '6px', flexShrink: 0, zIndex: 2 }}></div>
                    
                    <div style={{ flex: 1, background: bgColor, border: `1px solid ${borderColor}`, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                      <div style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 10px', background: isDone ? '#166534' : dotColor, color: '#fff', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                {isDone ? <Check size={12} /> : <Clock size={12} />}
                                {isDone ? 'COMPLETED' : dayBadge}
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: dotColor, padding: '4px 8px', border: `1px solid ${dotColor}`, borderRadius: '12px' }}>
                                {rem.priority} Priority
                              </span>
                            </div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
                              Doctor's Checkup: {rem.reason}
                            </div>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.8rem', display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap', color: '#64748b' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Stethoscope size={14} color="#94a3b8" /> Dr. {rem.doctorName || 'Consulting Physician'}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} color="#94a3b8" /> Target: {formatDate(rem.dueDate)}</span>
                        </div>

                        {!isDone && (
                          <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.6)', border: `1px dashed ${borderColor}`, borderRadius: '8px', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={14} color={dotColor} /> Checkup complete hone par OTP verification aayega.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>}
      </SectionCard>

      {/* Medical Record Intelligence & AI-OCR Module */}
      <MedicalDocumentIntelligence 
        onRecordSynchronized={loadProfile} 
        patientId={patientData?.id} 
      />

      {/* Medical History */}
      <SectionCard 
        id="sec-history" 
        title={`Medical History (${medicalHistory.length} Visit${medicalHistory.length !== 1 ? 's' : ''})`} 
        icon={FileText} 
        color="#0369a1"
        action={
          <button 
            type="button" 
            onClick={loadProfile} 
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', fontSize: '0.76rem', fontWeight: 700,
              background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1',
              borderRadius: '8px', cursor: 'pointer' 
            }}
          >
            Refresh
          </button>
        }
      >
        {medicalHistory.length === 0 ? <div style={{
        textAlign: 'center',
        padding: '24px 0'
      }}>
            <Stethoscope size={32} color="#cbd5e1" style={{
          marginBottom: '8px',
          display: 'block',
          margin: '0 auto 8px'
        }} />
            <div style={{
          fontSize: '0.9rem',
          fontWeight: 700
        }}>No medical visits recorded yet.</div>
            <div style={{
          fontSize: '0.78rem',
          marginTop: '4px'
        }}>Doctor se milne ke baad aapka record yahan appear hoga.</div>
          </div> : <div style={{ position: 'relative', paddingLeft: '16px' }}>
            {/* Timeline Vertical Line */}
            <div style={{ position: 'absolute', left: '23px', top: '24px', bottom: '24px', width: '2px', background: '#e2e8f0', zIndex: 0 }}></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 1 }}>
              {medicalHistory.map((visit, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  {/* Timeline Dot */}
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', border: '3px solid #0369a1', marginTop: '6px', flexShrink: 0, zIndex: 2 }}></div>
                  
                  {/* Timeline Content */}
                  <div style={{ flex: 1, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
                    <div onClick={() => setExpandedHistoryIdx(expandedHistoryIdx === idx ? null : idx)} style={{ padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: expandedHistoryIdx === idx ? '#f8fafc' : '#ffffff' }}>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{visit.diagnosis || 'Clinical Visit'}</div>
                        <div style={{ fontSize: '0.8rem', display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap', color: '#64748b' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}><Clock size={12} color="#94a3b8" /> {formatDate(visit.visitDate)}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} color="#94a3b8" /> {visit.facilityName || 'Primary Health Centre'}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Stethoscope size={12} color="#94a3b8" /> {visit.doctorName || 'Attending Physician'}</span>
                          {visit.visitType && <span style={{ padding: '2px 8px', background: '#f1f5f9', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>{visit.visitType}</span>}
                        </div>
                      </div>
                      <div style={{ padding: '4px' }}>
                        {expandedHistoryIdx === idx ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
                      </div>
                    </div>

                    {expandedHistoryIdx === idx && (
                      <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
                        {visit.symptoms && (
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>Symptoms</div>
                            <div style={{ fontSize: '0.88rem', color: '#334155' }}>{Array.isArray(visit.symptoms) ? visit.symptoms.join(', ') : visit.symptoms}</div>
                          </div>
                        )}

                        {visit.vitalsAtVisit && (visit.vitalsAtVisit.bp || visit.vitalsAtVisit.spo2 || visit.vitalsAtVisit.temp || visit.vitalsAtVisit.pulse || visit.vitalsAtVisit.sugar) && (
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>📊 Vitals Recorded at Visit</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {visit.vitalsAtVisit.bp && <span style={{ padding: '4px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem', color: '#334155' }}><strong>BP:</strong> {visit.vitalsAtVisit.bp}</span>}
                              {visit.vitalsAtVisit.spo2 && <span style={{ padding: '4px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem', color: '#334155' }}><strong>SpO2:</strong> {visit.vitalsAtVisit.spo2}%</span>}
                              {visit.vitalsAtVisit.pulse && <span style={{ padding: '4px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem', color: '#334155' }}><strong>Pulse:</strong> {visit.vitalsAtVisit.pulse} bpm</span>}
                              {visit.vitalsAtVisit.temp && <span style={{ padding: '4px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem', color: '#334155' }}><strong>Temp:</strong> {visit.vitalsAtVisit.temp} °F</span>}
                              {visit.vitalsAtVisit.sugar && <span style={{ padding: '4px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem', color: '#334155' }}><strong>Sugar:</strong> {visit.vitalsAtVisit.sugar}</span>}
                            </div>
                          </div>
                        )}

                        {Array.isArray(visit.treatments) && visit.treatments.length > 0 && (
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>🩹 Treatments & Procedures</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {visit.treatments.map((t, tIdx) => (
                                <span key={tIdx} style={{ padding: '4px 10px', fontSize: '0.8rem', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '6px', fontWeight: 600 }}>
                                  {typeof t === 'string' ? t : t.name || JSON.stringify(t)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {Array.isArray(visit.prescriptions) && visit.prescriptions.length > 0 && (
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>💊 Prescriptions</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {visit.prescriptions.map((rx, rxIdx) => {
                                const isObj = typeof rx === 'object' && rx !== null;
                                const medName = isObj ? (rx.medicine || rx.medicineName || rx.name) : rx;
                                return (
                                  <div key={rxIdx} style={{ padding: '10px 12px', fontSize: '0.85rem', border: '1px solid #f1f5f9', borderRadius: '8px', background: '#f8fafc', color: '#334155' }}>
                                    <strong style={{ color: '#0f172a' }}>{medName}</strong>
                                    {isObj && rx.dosage && <span> — {rx.dosage}</span>}
                                    {isObj && (rx.frequency || rx.duration) && <span> | {rx.frequency} {rx.duration && `× ${rx.duration}`}</span>}
                                    {isObj && rx.instructions && <span style={{ color: '#64748b' }}> ({rx.instructions})</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {Array.isArray(visit.testReports) && visit.testReports.length > 0 && (
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>🧪 Lab Reports</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {visit.testReports.map((rep, rIdx) => (
                                <div key={rIdx} style={{ padding: '10px 12px', fontSize: '0.85rem', border: '1px solid #f1f5f9', borderRadius: '8px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: '#334155' }}><strong style={{ color: '#0f172a' }}>{rep.testName}</strong>: {rep.result}</span>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', background: '#e0f2fe', color: '#0369a1', borderRadius: '12px' }}>{rep.status}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {visit.clinicalNotes && (
                          <div style={{ padding: '12px', fontSize: '0.85rem', border: '1px solid #f1f5f9', borderRadius: '8px', background: '#fffbeb', color: '#92400e' }}>
                            <strong style={{ color: '#b45309' }}>Doctor Notes:</strong> {visit.clinicalNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>}
      </SectionCard>

      {/* ASHA Field Reports / Field Visits */}
      <SectionCard 
        id="sec-field-reports" 
        title={`ASHA Field Visits (${fieldReports.length} Visit${fieldReports.length !== 1 ? 's' : ''})`} 
        icon={Activity} 
        color="#0d9488"
      >
        {fieldReports.length === 0 ? <div style={{
          textAlign: 'center', padding: '24px 0'
        }}>
          <div style={{
            background: '#f0fdf4', width: '48px', height: '48px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px'
          }}>
            <Activity size={24} color="#16a34a" />
          </div>
          <div style={{ fontWeight: 800, color: '#166534', marginBottom: '4px' }}>No Field Visits</div>
          <div style={{ fontSize: '0.85rem', color: '#15803d' }}>You have not been screened by an ASHA worker yet.</div>
        </div> : 
          <div style={{ padding: '10px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {fieldReports.map((report, idx) => (
                <div key={idx} style={{ 
                  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <strong style={{ color: '#0f172a', fontSize: '1rem' }}>{new Date(report.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                        <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                          Field Visit
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>By: {report.ashaName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase',
                        background: report.triageResult === 'RED_EMERGENCY' ? '#fee2e2' : report.triageResult === 'YELLOW_URGENT' ? '#fef3c7' : '#dcfce7',
                        color: report.triageResult === 'RED_EMERGENCY' ? '#dc2626' : report.triageResult === 'YELLOW_URGENT' ? '#d97706' : '#16a34a'
                      }}>
                        {report.triageResult.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {report.symptoms && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Symptoms</div>
                      <div style={{ fontSize: '0.9rem', color: '#334155' }}>{report.symptoms}</div>
                    </div>
                  )}

                  {report.observations && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Field Observations</div>
                      <div style={{ fontSize: '0.9rem', color: '#334155' }}>{report.observations}</div>
                    </div>
                  )}

                  {report.vitals && (report.vitals.bp || report.vitals.spo2 || report.vitals.temp) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', background: '#fff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      {report.vitals.bp && <div style={{ fontSize: '0.8rem', color: '#334155' }}><strong>BP:</strong> {report.vitals.bp}</div>}
                      {report.vitals.spo2 && <div style={{ fontSize: '0.8rem', color: '#334155' }}><strong>SpO2:</strong> {report.vitals.spo2}%</div>}
                      {report.vitals.temp && <div style={{ fontSize: '0.8rem', color: '#334155' }}><strong>Temp:</strong> {report.vitals.temp}°F</div>}
                      {report.vitals.pulse && <div style={{ fontSize: '0.8rem', color: '#334155' }}><strong>Pulse:</strong> {report.vitals.pulse} bpm</div>}
                    </div>
                  )}

                  {(report.followUpRequirement || report.referralRequirement) && (
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {report.referralRequirement && (
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>Referral Action</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a8a' }}>{report.referralRequirement}</div>
                        </div>
                      )}
                      {report.followUpRequirement && (
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>Follow-up</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a8a' }}>{report.followUpRequirement}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>}
      </SectionCard>

      {/* Hide floating SOS cluster during edit mode */}
      {isAnySectionEditing && <style>{`#floating-emergency-cluster { display: none !important; }`}</style>}

      {/* ═══════════ QR ENLARGED MODAL ═══════════ */}
      {qrEnlarged && (
        <div
          className="no-print"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(30,27,75,0.80)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setQrEnlarged(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center',
              position: 'relative',
              boxShadow: '0 24px 60px rgba(0,0,0,0.35)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setQrEnlarged(false)}
              style={{ position: 'absolute', top: '14px', right: '16px', background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer', color: '#64748b' }}
              title="Close"
            >×</button>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                🔒 My Health QR Code
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e1b4b' }}>
                {userData?.name || 'Patient'}
              </div>
              {patientData?.id && (
                <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#3730a3', marginTop: '2px' }}>
                  {patientData.id}
                </div>
              )}
            </div>

            <div style={{
              display: 'inline-block',
              background: '#f8fafc',
              border: '3px solid #7c3aed22',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '16px'
            }}>
              <QRCodeSVG
                value={JSON.stringify({
                  qrToken: patientData?.qrToken || patientData?.id || 'GRAMIN_HEALTH',
                  patientId: patientData?.id || '',
                  name: userData?.name || '',
                  sscCode: patientData?.sscCode || '',
                  abhaId: patientData?.abhaId || ''
                })}
                size={220}
                level="M"
                includeMargin={true}
                fgColor="#1e1b4b"
              />
            </div>

            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              Show this QR to your doctor, ASHA worker, or clinic staff.<br />
              <strong style={{ color: '#7c3aed' }}>Safe — no medical data is stored inside.</strong>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  const canvas = document.getElementById('patient-qr-canvas-hidden');
                  if (canvas) {
                    const url = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `GraminArogya_QR_${patientData?.id || 'patient'}.png`;
                    a.click();
                  }
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', border: '1.5px solid #059669', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, color: '#059669', cursor: 'pointer', background: '#ecfdf5' }}
              >
                <Download size={15} /> Download PNG
              </button>
              <button
                type="button"
                onClick={() => { setQrEnlarged(false); setTimeout(() => window.print(), 100); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', border: '1.5px solid #0369a1', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, color: '#0369a1', cursor: 'pointer', background: '#eff6ff' }}
              >
                <Printer size={15} /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ PRINTABLE PATIENT HEALTH CARD (visible only on print) ═══════════ */}
      <style>{`
        @media screen {
          #printable-patient-profile {
            display: none !important;
          }
        }
        @media print {
          @page {
            margin: 8mm 10mm;
            size: A4 portrait;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
            height: auto !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-patient-profile,
          #printable-patient-profile * {
            visibility: visible !important;
          }
          #printable-patient-profile {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            z-index: 99999999 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
          }
          .no-print, nav, header, footer, button, .navbar, .sos-floating-btn, .sos-pill, [role="navigation"] {
            display: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-section {
            border: 1.5px solid #cbd5e1 !important;
            border-radius: 8px !important;
            padding: 12px 16px !important;
            margin-bottom: 12px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: #ffffff !important;
          }
          .print-header {
            background: #1e1b4b !important;
            color: #ffffff !important;
            padding: 16px 20px !important;
            border-radius: 8px !important;
            margin-bottom: 14px !important;
            border: 2px solid #1e1b4b !important;
            page-break-inside: avoid !important;
          }
          .print-label {
            font-size: 8.5px !important;
            text-transform: uppercase !important;
            font-weight: 700 !important;
            color: #64748b !important;
            letter-spacing: 0.05em !important;
            margin-bottom: 2px !important;
          }
          .print-value {
            font-size: 12px !important;
            font-weight: 700 !important;
            color: #0f172a !important;
          }
          .print-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 10px 16px !important;
          }
          .print-vitals {
            display: flex !important;
            gap: 10px !important;
            flex-wrap: wrap !important;
            margin-top: 8px !important;
          }
          .vital-box {
            border: 1px solid #cbd5e1 !important;
            border-radius: 6px !important;
            padding: 6px 12px !important;
            min-width: 80px !important;
            text-align: center !important;
            background: #f8fafc !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 11px !important;
            margin-top: 8px !important;
          }
          th {
            background: #f1f5f9 !important;
            text-align: left !important;
            padding: 6px 10px !important;
            font-weight: 700 !important;
            font-size: 10px !important;
            color: #334155 !important;
            border-bottom: 2px solid #cbd5e1 !important;
          }
          td {
            padding: 6px 10px !important;
            border-bottom: 1px solid #e2e8f0 !important;
            color: #1e293b !important;
          }
          .print-footer {
            text-align: center !important;
            font-size: 9px !important;
            color: #64748b !important;
            border-top: 1px solid #cbd5e1 !important;
            padding-top: 10px !important;
            margin-top: 14px !important;
          }
        }
      `}</style>

      <div id="printable-patient-profile">
        {/* Print Header */}
        <div className="print-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '10px', letterSpacing: '0.1em', opacity: 0.85, marginBottom: '4px' }}>
                NATIONAL RURAL HEALTH MISSION — GRAMIN AROGYA
              </div>
              <div style={{ fontSize: '19px', fontWeight: 900, marginBottom: '4px' }}>
                {userData?.name || 'Patient'}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>
                {patientData?.id} &nbsp;|&nbsp; {patientData?.abhaId || 'ABHA Registered'}
              </div>
            </div>
            <div style={{ textAlign: 'center', background: '#ffffff', padding: '6px 8px', borderRadius: '8px', border: '1px solid #ffffff' }}>
              <QRCodeSVG
                value={JSON.stringify({ qrToken: patientData?.qrToken || patientData?.id, patientId: patientData?.id })}
                size={80} level="M" includeMargin={false} fgColor="#000000" bgColor="#ffffff"
              />
              <div style={{ fontSize: '8.5px', marginTop: '3px', color: '#0f172a', fontWeight: 800 }}>Health QR</div>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="print-section">
          <div style={{ fontWeight: 800, fontSize: '11px', marginBottom: '10px', textTransform: 'uppercase' }}>
            👤 Personal Information
          </div>
          <div className="print-grid">
            {[
              ['Full Name', userData?.name || '—'],
              ['Date of Birth', userData?.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString('en-IN') : '—'],
              ['Age', patientData?.age || '—'],
              ['Gender', userData?.gender || patientData?.gender || '—'],
              ['Blood Group', userData?.bloodGroup || patientData?.bloodGroup || '—'],
              ['Mobile', userData?.phone || '—'],
              ['Email', userData?.email || '—'],
              ['Village / Location', userData?.village || patientData?.village || '—'],
              ['Emergency Contact', userData?.emergencyContact || patientData?.emergencyContact || '—'],
            ].map(([label, val]) => (
              <div key={label}>
                <div className="print-label">{label}</div>
                <div className="print-value">{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* IDs */}
        <div className="print-section">
          <div style={{ fontWeight: 800, fontSize: '11px', marginBottom: '10px', textTransform: 'uppercase' }}>
            🆔 Health Identifiers
          </div>
          <div className="print-grid">
            <div><div className="print-label">Patient ID</div><div className="print-value" style={{ fontFamily: 'monospace' }}>{patientData?.id || '—'}</div></div>
            <div><div className="print-label">SSC Code</div><div className="print-value" style={{ fontFamily: 'monospace' }}>{patientData?.sscCode || '—'}</div></div>
            <div><div className="print-label">ABHA ID</div><div className="print-value" style={{ fontFamily: 'monospace' }}>{patientData?.abhaId || '—'}</div></div>
          </div>
        </div>

        {/* Medical */}
        <div className="print-section">
          <div style={{ fontWeight: 800, fontSize: '11px', marginBottom: '10px', textTransform: 'uppercase' }}>
            🩺 Medical Information
          </div>
          <div className="print-vitals">
            {[['BP', patientData?.vitals?.bp, 'mmHg'], ['SpO2', patientData?.vitals?.spo2, '%'], ['Temp', patientData?.vitals?.temp, '°F'], ['Pulse', patientData?.vitals?.pulse, 'bpm'], ['Sugar', patientData?.vitals?.sugar, '']].map(([l, v, u]) => (
              <div className="vital-box" key={l}>
                <div className="print-label">{l}</div>
                <div style={{ fontWeight: 800, fontSize: '12px' }}>{v || '—'}{u && v ? u : ''}</div>
              </div>
            ))}
          </div>
          {((patientData?.knownAllergies && patientData.knownAllergies.length > 0) || (patientData?.chronicConditions && patientData.chronicConditions.length > 0)) && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {patientData?.knownAllergies && patientData.knownAllergies.length > 0 && (
                <div><div className="print-label">⚠️ Allergies</div><div className="print-value">{Array.isArray(patientData.knownAllergies) ? patientData.knownAllergies.join(', ') : String(patientData.knownAllergies)}</div></div>
              )}
              {patientData?.chronicConditions && patientData.chronicConditions.length > 0 && (
                <div><div className="print-label">🏥 Chronic Conditions</div><div className="print-value">{Array.isArray(patientData.chronicConditions) ? patientData.chronicConditions.join(', ') : String(patientData.chronicConditions)}</div></div>
              )}
            </div>
          )}
        </div>

        {/* Prescriptions */}
        {Array.isArray(prescriptions) && prescriptions.length > 0 && (
          <div className="print-section">
            <div style={{ fontWeight: 800, fontSize: '11px', marginBottom: '10px', textTransform: 'uppercase' }}>
              💊 Prescriptions
            </div>
            {prescriptions.slice(0, 3).map((rx, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>
                  Rx #{i + 1} — {rx.doctorName || 'Dr.'} — {rx.prescribedAt ? new Date(rx.prescribedAt).toLocaleDateString('en-IN') : ''} — Status: {rx.status || ''}
                </div>
                {rx.diagnosis && <div style={{ fontSize: '10px', color: '#444', marginBottom: '4px' }}>Diagnosis: {rx.diagnosis}</div>}
                {Array.isArray(rx.medicines) && rx.medicines.length > 0 && (
                  <table>
                    <thead>
                      <tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr>
                    </thead>
                    <tbody>
                      {rx.medicines.map((m, mi) => (
                        <tr key={mi}>
                          <td>{m.name || m.medicine || '—'}</td>
                          <td>{m.dosage || '—'}</td>
                          <td>{m.frequency || '—'}</td>
                          <td>{m.duration || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="print-footer">
          Printed from GraminArogya — National Rural Health Platform &nbsp;|&nbsp; Generated: {new Date().toLocaleString('en-IN')} &nbsp;|&nbsp; This document is for authorized use only.
        </div>
      </div>

    </div>;
}
