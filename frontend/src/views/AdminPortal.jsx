import React, { useState, useEffect } from 'react';
import { ShieldCheck, Building2, Pill, AlertTriangle, Users, Plus, Trash2, CheckCircle2, Edit2, RefreshCw, Sparkles, Bed, Stethoscope, Activity, X, Save, Check, BarChart3, TrendingUp, AlertCircle, Clock, Search, Database, User, Mail, Phone, MessageSquare, Eye, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';
import { getLivePosition, reverseGeocode } from '../utils/geolocation';
import AdminMedicineDashboard from '../components/AdminMedicineDashboard';
import AdminStockAnalytics from '../components/AdminStockAnalytics';
import AdminDataMaster from '../components/AdminDataMaster';

export default function AdminPortal({
  currentUser,
  onLogout,
  activeSubTab,
  setActiveSubTab
}) {
  const [subTab, setSubTab] = useState(activeSubTab || 'facilities');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  // Admin profile states
  const [adminProfile, setAdminProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', designation: '', facilityName: '' });
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState('');

  // Contact messages states
  const [contactMessages, setContactMessages] = useState([]);
  const [contactLoading, setContactLoading] = useState(false);

  // Users for username reset
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [resetUsernameMsg, setResetUsernameMsg] = useState('');


  // Data states
  const [facilities, setFacilities] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [outbreaks, setOutbreaks] = useState([]);
  const [users, setUsers] = useState([]);

  // Analytics & Audit state
  const [stockAnalytics, setStockAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState('');

  // Forms / Modals
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [showAddOutbreak, setShowAddOutbreak] = useState(false);

  // Edit Facility State
  const [editingFacility, setEditingFacility] = useState(null);

  // New Facility Form
  const [facName, setFacName] = useState('');
  const [facType, setFacType] = useState('PHC');
  const [facVillage, setFacVillage] = useState('');
  const [facBeds, setFacBeds] = useState(12);
  const [facOxygen, setFacOxygen] = useState(6);
  const [facDistance, setFacDistance] = useState(4.5);
  const [facDoctorName, setFacDoctorName] = useState('Dr. Rajesh Verma');
  const [facDoctorSpec, setFacDoctorSpec] = useState('General Physician (MBBS)');
  const [facEmergency, setFacEmergency] = useState(false);

  // New Medicine Form
  const [medName, setMedName] = useState('');
  const [medCategory, setMedCategory] = useState('Antibiotic');
  const [medFacility, setMedFacility] = useState('');
  const [medQty, setMedQty] = useState(150);
  const [medThreshold, setMedThreshold] = useState(50);
  const [medUnit, setMedUnit] = useState('Strips');

  // New Outbreak Form
  const [obDisease, setObDisease] = useState('');
  const [obVillage, setObVillage] = useState('');
  const [obCases, setObCases] = useState(14);
  const [obAction, setObAction] = useState('Larvicide spraying & rapid testing survey initiated.');

  // New Doctor Form
  const [docName, setDocName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docPassword, setDocPassword] = useState('');
  const [docSpec, setDocSpec] = useState('General Physician');
  const [docQual, setDocQual] = useState('MBBS');
  const [docRegNum, setDocRegNum] = useState('');
  const [docCouncil, setDocCouncil] = useState('Medical Council of India');
  const [docExp, setDocExp] = useState(5);
  const [docClinic, setDocClinic] = useState('');
  const [createdDoctorCreds, setCreatedDoctorCreds] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // New Staff Form
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  useEffect(() => {
    // Auto-detect real live location on load for admin forms
    (async () => {
      try {
        const coords = await getLivePosition();
        const geo = await reverseGeocode(coords.lat, coords.lng);
        if (geo.village) {
          setFacVillage(geo.village);
          setObVillage(geo.village);
        }
      } catch (e) {}
    })();
  }, []);
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [facRes, medRes, obRes, userRes] = await Promise.all([api.getFacilities(), api.getInventory(), api.getOutbreaks(), api.getUsers()]);
      if (facRes && facRes.success) setFacilities(facRes.data || []);
      if (medRes && medRes.success) setMedicines(medRes.data || []);
      if (obRes && obRes.success) setOutbreaks(obRes.data || []);
      if (userRes && userRes.success) setUsers(userRes.users || []);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAll();
  }, []);
  const showNotification = msg => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  // 1. Facility CRUD Handlers
  const handleCreateFacility = async e => {
    e.preventDefault();
    if (!facName) return;
    try {
      const res = await api.createFacility({
        name: facName,
        type: facType,
        village: facVillage,
        distanceKm: Number(facDistance) || 5,
        beds: {
          total: Number(facBeds) || 10,
          occupied: 1,
          available: Math.max(0, (Number(facBeds) || 10) - 1)
        },
        oxygenCylinders: Number(facOxygen) || 0,
        emergencyCapable: facEmergency,
        doctors: [{
          name: facDoctorName || 'Dr. Medical Officer',
          specialty: facDoctorSpec,
          available: true,
          onDutyHours: '08:00 - 17:00'
        }],
        diagnosticsAvailable: ['Blood Glucose', 'Rapid Malaria Test', 'Hemoglobin (Hb)', 'Basic ECG']
      });
      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 60
        });
        showNotification(`Facility "${facName}" added to live MongoDB Atlas database!`);
        setShowAddFacility(false);
        setFacName('');
        fetchAll();
      }
    } catch (err) {
      console.error(err);
      showNotification('Failed to add facility');
    }
  };
  const handleUpdateFacility = async e => {
    e.preventDefault();
    if (!editingFacility) return;
    try {
      const targetId = editingFacility.id || editingFacility._id;
      const res = await api.updateFacility(targetId, {
        name: editingFacility.name,
        type: editingFacility.type,
        village: editingFacility.village,
        beds: editingFacility.beds,
        oxygenCylinders: Number(editingFacility.oxygenCylinders) || 0,
        currentWaitTimeMins: Number(editingFacility.currentWaitTimeMins) || 15,
        emergencyCapable: editingFacility.emergencyCapable
      });
      if (res.success) {
        showNotification(`Facility "${editingFacility.name}" updated successfully!`);
        setEditingFacility(null);
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleDeleteFacility = async fac => {
    const id = fac.id || fac._id;
    if (!window.confirm(`Are you sure you want to delete "${fac.name}" from database?`)) return;
    try {
      const res = await api.deleteFacility(id);
      if (res.success) {
        showNotification(`Facility deleted from database.`);
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async u => {
    if (u.username === 'admin') {
      showNotification('Cannot delete primary root admin account.');
      return;
    }
    const id = u._id || u.username;
    if (!window.confirm(`Are you sure you want to delete staff/user account "${u.name}" (@${u.username})?`)) return;
    try {
      const res = await api.deleteAdminUser(id);
      if (res.success) {
        showNotification(`User account deleted.`);
        fetchAll();
      } else {
        showNotification(res.message || 'Failed to delete user.');
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error deleting user.');
    }
  };

  // 2. Medicine CRUD Handlers
  const handleCreateMedicine = async e => {
    e.preventDefault();
    if (!medName) return;
    try {
      const res = await api.createMedicine({
        name: medName,
        category: medCategory,
        facilityName: medFacility,
        stockQty: Number(medQty) || 100,
        minThreshold: Number(medThreshold) || 40,
        unit: medUnit
      });
      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 60
        });
        showNotification(`Medicine "${medName}" registered in supply database!`);
        setShowAddMedicine(false);
        setMedName('');
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleRestockMedicine = async (med, addAmount) => {
    const id = med.id || med._id;
    try {
      const res = await api.updateMedicineStock(id, {
        addQty: addAmount
      });
      if (res.success) {
        showNotification(`Restocked +${addAmount} ${med.unit} for ${med.name}!`);
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleDeleteMedicine = async med => {
    const id = med.id || med._id;
    if (!window.confirm(`Delete "${med.name}" from inventory?`)) return;
    try {
      const res = await api.deleteMedicine(id);
      if (res.success) {
        showNotification(`Medicine item deleted.`);
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Outbreak CRUD Handlers
  const handleCreateOutbreak = async e => {
    e.preventDefault();
    if (!obDisease) return;
    try {
      const res = await api.createOutbreak({
        disease: obDisease,
        village: obVillage,
        casesThisWeek: Number(obCases) || 1,
        trend: '+25% this week',
        status: 'ACTIVE_WATCH',
        recommendedAction: obAction
      });
      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 60
        });
        showNotification(`Disease surveillance cluster broadcasted to field ASHAs!`);
        setShowAddOutbreak(false);
        setObDisease('');
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleDeleteOutbreak = async ob => {
    const id = ob._id || ob.id;
    try {
      const res = await api.deleteOutbreak(id);
      if (res.success) {
        showNotification(`Outbreak cluster marked resolved.`);
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateStaff = async e => {
    e.preventDefault();
    try {
      const res = await api.createStaff({
        name: staffName,
        password: staffPassword,
        phone: staffPhone,
        email: staffEmail
      });
      if (res.success) {
        showNotification(`Staff account created successfully! STF ID: ${res.staffId}`);
        setStaffName('');
        setStaffPassword('');
        setStaffPhone('');
        setStaffEmail('');
        fetchAll();
      } else {
        alert(res.message || 'Error creating staff');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  // 4. Doctor Management
  const handleCopyDoctorCreds = () => {
    if (!createdDoctorCreds) return;
    const text = `🏥 GraminArogya - Doctor Access Credentials
Doctor Name: ${createdDoctorCreds.name}
Doctor ID: ${createdDoctorCreds.doctorId}
Login ID / Mobile: ${createdDoctorCreds.phone}
${createdDoctorCreds.email ? `Email: ${createdDoctorCreds.email}\n` : ''}Initial Password: ${createdDoctorCreds.password}
Access: Select "Doctor ID & Pass" in Doctor Panel to log in.`;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    if (!docName.trim() || !docPassword || !docPhone.trim() || !docRegNum.trim()) {
      alert('Please fill out all required fields: Name, Initial Password, Phone Number, and Registration Number.');
      return;
    }
    try {
      const res = await api.createDoctor({
        name: docName.trim(),
        password: docPassword,
        email: docEmail.trim(),
        phone: docPhone.trim(),
        specialization: docSpec,
        qualification: docQual,
        registrationNumber: docRegNum.trim(),
        medicalCouncil: docCouncil,
        experienceYears: docExp,
        clinicName: docClinic
      });
      if (res.success) {
        confetti({ particleCount: 70, spread: 80 });
        showNotification(res.message || `Doctor Profile Created successfully! ID: ${res.doctorId}`);
        setCreatedDoctorCreds({
          doctorId: res.doctorId,
          name: docName.trim(),
          password: docPassword,
          phone: docPhone.trim(),
          email: docEmail.trim(),
          specialization: docSpec,
          registrationNumber: docRegNum.trim(),
          clinicName: docClinic
        });
        fetchAll();
      } else {
        alert(res.message || 'Error creating doctor');
      }
    } catch (err) {
      console.error(err);
      alert('Network Error while creating doctor');
    }
  };

  useEffect(() => {
    if (activeSubTab) {
      setSubTab(activeSubTab);
    }
  }, [activeSubTab]);

  const fetchAdminProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await api.getAdminProfile();
      if (res.success && res.profile) {
        setAdminProfile(res.profile);
        setProfileForm({
          name: res.profile.name || '',
          email: res.profile.email || '',
          phone: res.profile.phone || '',
          designation: res.profile.designation || 'System Administrator',
          facilityName: res.profile.facilityName || ''
        });
        setUsernameInput(res.profile.username || '');
      }
    } catch (e) {
      console.error('Error fetching admin profile:', e);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveAdminProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await api.updateAdminProfile(profileForm);
      if (res.success && res.profile) {
        setAdminProfile(res.profile);
        showNotification('Admin Profile updated successfully!');
      } else {
        alert(res.message || 'Failed to update profile');
      }
    } catch (e) {
      alert('Error saving profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdateOwnUsername = async (e) => {
    e.preventDefault();
    setUsernameSaving(true);
    setUsernameMsg('');
    try {
      const res = await api.updateUsername(usernameInput);
      if (res.success) {
        setUsernameMsg('✅ Username updated to ' + res.username);
        if (adminProfile) setAdminProfile(prev => ({ ...prev, username: res.username }));
        showNotification('Username updated successfully!');
      } else {
        setUsernameMsg('❌ ' + (res.message || 'Failed to update username'));
      }
    } catch (e) {
      setUsernameMsg('❌ Network error updating username');
    } finally {
      setUsernameSaving(false);
    }
  };

  const fetchContactMessages = async () => {
    setContactLoading(true);
    try {
      const res = await api.getContactMessages();
      if (res.success && res.messages) {
        setContactMessages(res.messages);
      }
    } catch (e) {
      console.error('Error fetching contact messages:', e);
    } finally {
      setContactLoading(false);
    }
  };

  const handleUpdateMessageStatus = async (id, status) => {
    try {
      const res = await api.updateContactMessageStatus(id, status);
      if (res.success) {
        setContactMessages(prev => prev.map(m => m._id === id ? { ...m, status } : m));
        showNotification(`Message marked as ${status}`);
      }
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const fetchUsersForReset = async () => {
    setUsersLoading(true);
    try {
      const res = await api.getUsers();
      if (res.success && res.users) {
        setUsersList(res.users);
      }
    } catch (e) {
      console.error('Error fetching users for reset:', e);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleAdminResetUsername = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !newUsername.trim()) {
      setResetUsernameMsg('❌ Please select a user and enter a new username');
      return;
    }
    setResetUsernameMsg('');
    try {
      const res = await api.adminResetUsername(selectedUserId, newUsername.trim());
      if (res.success) {
        setResetUsernameMsg(`✅ Username updated to "${newUsername.trim()}" for user.`);
        setUsersList(prev => prev.map(u => u._id === selectedUserId ? { ...u, username: newUsername.trim() } : u));
        setNewUsername('');
        showNotification('User username reset successfully!');
      } else {
        setResetUsernameMsg('❌ ' + (res.message || 'Failed to reset username'));
      }
    } catch (e) {
      setResetUsernameMsg('❌ Network error resetting username');
    }
  };

  useEffect(() => {
    if (subTab === 'profile') fetchAdminProfile();
    if (subTab === 'contact-messages') fetchContactMessages();
    if (subTab === 'username-reset') fetchUsersForReset();
  }, [subTab]);

  const tabs = [
    { id: 'profile', label: 'My Admin Profile', icon: User },
    { id: 'data-master', label: 'Data Master & CRUD Operations', icon: Database, isDanger: true },
    { id: 'facilities', label: 'Healthcare Facilities', count: facilities.length, icon: Building2 },
    { id: 'medicines', label: 'Medicine & Supply Warehouse', count: medicines.length, icon: Pill },
    { id: 'outbreaks', label: 'Epidemic Outbreaks', count: outbreaks.length, icon: AlertTriangle },
    { id: 'users', label: 'Registered Health Staff', count: users.length, icon: Users },
    { id: 'doctors', label: 'Doctor Management', count: users.filter(u => u.role === 'doctor').length, icon: Stethoscope },
    { id: 'staff', label: 'Staff Management', icon: Activity },
    { id: 'username-reset', label: 'Usernames & Accounts', count: usersList.length || users.length, icon: ShieldCheck },
    { id: 'contact-messages', label: 'Contact Messages', count: contactMessages.filter(m => m.status === 'new').length || undefined, icon: MessageSquare },
    { id: 'analytics', label: 'Stock Analytics & Audit', icon: BarChart3 }
  ];

  return <div style={{
    maxWidth: '1400px',
    margin: '0 auto',
    padding: 'clamp(14px, 3vw, 24px) clamp(10px, 3vw, 20px)'
  }}>
      {/* ═══════════ REDESIGNED HEALTHCARE ADMIN HEADER ═══════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '24px 28px',
        marginBottom: '20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ flex: '1 1 340px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              background: '#e6f4f2',
              color: '#0b6b68',
              border: '1px solid #b2d8d6',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Super Administrator Command
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              MongoDB Atlas Live
            </span>
          </div>
          <h1 style={{
            margin: '0 0 4px 0',
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.35rem, 3vw, 1.85rem)',
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.02em'
          }}>
            National Healthcare Command & Logistics
          </h1>
          <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5 }}>
            Centralized orchestration over health facilities, medical inventories, clinical workforce, and epidemic surveillance.
          </p>
        </div>
        <div className="admin-header-actions" style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
          <button onClick={onLogout} className="np-btn" style={{
          padding: '8px 14px',
          fontSize: '0.82rem',
          backgroundColor: '#000',
          color: '#fff',
          border: '1px solid #cbd5e1', borderRadius: '8px',
          cursor: 'pointer'
        }}>
            <span>Logout Admin</span>
          </button>
          <button onClick={fetchAll} className="btn-secondary" style={{
          padding: '8px 14px',
          fontSize: '0.82rem',
          cursor: 'pointer'
        }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync Database</span>
          </button>
        </div>
      </div>

      {/* Floating Notification */}
      {notice && <div style={{
      marginBottom: '18px',
      padding: '12px 18px',
      border: '1px solid #cbd5e1', borderRadius: '8px',
      background: '#f0fdf4',
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px',
      fontWeight: 700,
      fontSize: '0.88rem',
      wordBreak: 'break-word'
    }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{notice}</span>
        </div>}

      {/* ═══════════ REDESIGNED RESPONSIVE NAVIGATION TABS ═══════════ */}
      <div style={{
        background: '#ffffff',
        padding: '6px',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        marginBottom: '24px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = subTab === t.id;
          const isDanger = t.isDanger;

          return (
            <button
              key={t.id}
              onClick={() => {
                setSubTab(t.id);
                setEditingFacility(null);
              }}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                border: isDanger
                  ? (isActive ? '1px solid #dc2626' : '1px solid #fecdd3')
                  : (isActive ? '1px solid #0b6b68' : '1px solid transparent'),
                background: isDanger
                  ? (isActive ? '#dc2626' : '#fff1f2')
                  : (isActive ? '#0b6b68' : 'transparent'),
                color: isDanger
                  ? (isActive ? '#ffffff' : '#b91c1c')
                  : (isActive ? '#ffffff' : '#475569'),
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} />
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0',
                  color: isActive ? '#ffffff' : '#334155',
                  fontWeight: 800
                }}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ADMIN PROFILE VIEW */}
      {subTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: 'clamp(16px, 3vw, 28px)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#0f766e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, flexShrink: 0, boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)' }}>
                {adminProfile?.profileImage ? (
                  <img src={adminProfile.profileImage} alt="Admin" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  (adminProfile?.name || currentUser?.name || 'A').charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                    {adminProfile?.name || currentUser?.name || 'Administrator'}
                  </h2>
                  <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    ADMINISTRATOR
                  </span>
                </div>
                <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>
                  @{adminProfile?.username || currentUser?.username || 'admin'} • {adminProfile?.designation || 'Chief Health Administrator'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                  {adminProfile?.email || 'admin@graminarogya.gov.in'} • {adminProfile?.phone || 'Government Health Directorate'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '24px' }}>
              {/* Box 1: Custom Username Settings */}
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Set Account Username
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Change your personal username for unified login. Must be 3–30 alphanumeric characters.
                </p>
                <form onSubmit={handleUpdateOwnUsername} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      NEW USERNAME
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 700 }}>@</span>
                      <input
                        type="text"
                        required
                        value={usernameInput}
                        onChange={e => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 28px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600 }}
                        placeholder="your_unique_username"
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
                    {usernameSaving ? 'Saving Username...' : 'Update Username'}
                  </button>
                </form>
              </div>

              {/* Box 2: Profile Details */}
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Admin Contact & Profile Details
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Update your contact phone, email, and designation stored in database.
                </p>
                <form onSubmit={handleSaveAdminProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>DESIGNATION</label>
                    <input
                      type="text"
                      value={profileForm.designation}
                      onChange={e => setProfileForm(prev => ({ ...prev, designation: e.target.value }))}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}
                  >
                    <Save size={15} />
                    {profileSaving ? 'Saving Profile...' : 'Save Profile Changes'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USERNAME & ACCOUNT ADMINISTRATION (ADMIN RESET) */}
      {subTab === 'username-reset' && (
        <div className="glass-panel" style={{ padding: 'clamp(16px, 3vw, 24px)', borderRadius: '16px' }}>
          <div style={{ marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Username & User Account Administration
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Reset or assign unique usernames to any Patient, Doctor, Staff, or ASHA Worker account. Updates take effect immediately in the database.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Reset Form */}
            <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                Reset User's Username
              </h4>
              <form onSubmit={handleAdminResetUsername} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    SELECT USER ACCOUNT *
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                    required
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', background: '#fff' }}
                  >
                    <option value="">-- Choose Account ({usersList.length} total) --</option>
                    {usersList.map(u => (
                      <option key={u._id} value={u._id}>
                        [{u.role?.toUpperCase()}] {u.name} (Current: @{u.username || 'none'}) - {u.patId || u.doctorId || u.staffId || u.phone || u.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    NEW USERNAME * (Must be unique)
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    placeholder="e.g. dr_sharma, asha_sunita, ramesh_patel"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
                {resetUsernameMsg && (
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: resetUsernameMsg.startsWith('✅') ? '#166534' : '#991b1b' }}>
                    {resetUsernameMsg}
                  </div>
                )}
                <button
                  type="submit"
                  style={{ background: '#0f766e', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <ShieldCheck size={16} />
                  Reset & Save Username
                </button>
              </form>
            </div>

            {/* Quick stats/info */}
            <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                Account Statistics
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f766e' }}>{usersList.length}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>TOTAL USERS</div>
                </div>
                <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563eb' }}>{usersList.filter(u => u.role === 'patient').length}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>PATIENTS</div>
                </div>
                <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#16a34a' }}>{usersList.filter(u => u.role === 'doctor').length}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>DOCTORS</div>
                </div>
                <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#d97706' }}>{usersList.filter(u => u.role === 'staff' || u.role === 'asha').length}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>STAFF / ASHA</div>
                </div>
              </div>
            </div>
          </div>

          {/* User Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '10px 14px' }}>Name</th>
                  <th style={{ padding: '10px 14px' }}>Role</th>
                  <th style={{ padding: '10px 14px' }}>Current Username</th>
                  <th style={{ padding: '10px 14px' }}>Identifier / ID</th>
                  <th style={{ padding: '10px 14px' }}>Phone / Email</th>
                  <th style={{ padding: '10px 14px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u, i) => (
                  <tr key={u._id || i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>{u.name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800, background: u.role === 'doctor' ? '#dcfce7' : u.role === 'patient' ? '#dbeafe' : u.role === 'admin' ? '#fef3c7' : '#f3e8ff', color: u.role === 'doctor' ? '#166534' : u.role === 'patient' ? '#1e40af' : u.role === 'admin' ? '#92400e' : '#6b21a8' }}>
                        {u.role?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#0f766e' }}>
                      @{u.username || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {u.patId || u.doctorId || u.staffId || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>
                      {u.phone || u.email || '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button
                        onClick={() => { setSelectedUserId(u._id); setNewUsername(u.username || ''); }}
                        style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTACT US SUBMISSIONS IN ADMIN */}
      {subTab === 'contact-messages' && (
        <div className="glass-panel" style={{ padding: 'clamp(16px, 3vw, 24px)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Contact Us Inquiries & Citizen Messages
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                Review, respond to, and manage citizen queries submitted through the Contact Us page.
              </p>
            </div>
            <button
              onClick={fetchContactMessages}
              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '7px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} /> Refresh Messages
            </button>
          </div>

          {contactLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading messages...</div>
          ) : contactMessages.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
              <MessageSquare size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#475569' }}>No Contact Inquiries Yet</div>
              <div style={{ fontSize: '0.85rem' }}>Submissions through the public Contact Us page will appear here in real time.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {contactMessages.map(msg => (
                <div
                  key={msg._id}
                  style={{
                    background: msg.status === 'new' ? '#f0fdfa' : '#fff',
                    border: `1px solid ${msg.status === 'new' ? '#99f6e4' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    padding: '16px 20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>{msg.name}</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800,
                          background: msg.status === 'new' ? '#ccfbf1' : msg.status === 'read' ? '#e0f2fe' : '#dcfce7',
                          color: msg.status === 'new' ? '#0f766e' : msg.status === 'read' ? '#0369a1' : '#166534'
                        }}>
                          {msg.status?.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />{msg.email}
                        {msg.phone && <> • <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />{msg.phone}</>}
                        &nbsp;•&nbsp; {new Date(msg.createdAt).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {msg.status !== 'read' && (
                        <button
                          onClick={() => handleUpdateMessageStatus(msg._id, 'read')}
                          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Mark Read
                        </button>
                      )}
                      {msg.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateMessageStatus(msg._id, 'resolved')}
                          style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', marginBottom: '6px' }}>
                    Subject: {msg.subject}
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#334155', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f1f5f9', whiteSpace: 'pre-wrap' }}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MASTER DATA MANAGEMENT & CRUD */}
      {subTab === 'data-master' && (
        <AdminDataMaster currentUser={currentUser} />
      )}

      {/* 0. ANALYTICS & AUDIT */}
      {subTab === 'analytics' && (
        <AdminStockAnalytics currentUser={currentUser} />
      )}

      {/* 1. FACILITIES MASTER VIEW */}
      {subTab === 'facilities' && <div>
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}>
            <h3 style={{
            fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)',
            fontWeight: 800
          }}>
              Public Health Facility Infrastructure ({facilities.length} Active in Database)
            </h3>
            <button onClick={() => {
            setShowAddFacility(!showAddFacility);
            setEditingFacility(null);
          }} className="btn-primary" style={{
            padding: '8px 16px',
            fontSize: '0.85rem',
            whiteSpace: 'nowrap'
          }}>
              <Plus size={16} />
              <span>{showAddFacility ? 'Close Form' : 'Add New Facility'}</span>
            </button>
          </div>

          {/* Add Facility Form */}
          {showAddFacility && <form onSubmit={handleCreateFacility} className="glass-panel" style={{
          padding: 'clamp(14px, 3vw, 22px)',
          marginBottom: '22px',
          border: '1px solid #e2e8f0', borderRadius: '16px', background: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
              <h4 style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            marginBottom: '14px'
          }}>
                Add New Healthcare Facility to MongoDB Atlas Database
              </h4>
              <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: '12px',
            marginBottom: '14px'
          }}>
                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Facility Name *</label>
                  <input type="text" required placeholder="Enter healthcare facility name..." value={facName} onChange={e => setFacName(e.target.value)} style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1', borderRadius: '8px',
                fontSize: '0.85rem'
              }} />
                </div>
                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Tier / Type *</label>
                  <select value={facType} onChange={e => setFacType(e.target.value)} style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #cbd5e1', borderRadius: '8px',
                fontSize: '0.85rem'
              }}>
                    <option value="Sub-Centre">Sub-Centre (Level 0)</option>
                    <option value="PHC">Primary Health Centre (PHC - Level 1)</option>
                    <option value="CHC">Community Health Centre (CHC - Level 2)</option>
                    <option value="District Hospital">District Civil Hospital (Level 3)</option>
                  </select>
                </div>
                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Village / Location *</label>
                  <input type="text" required value={facVillage} onChange={e => setFacVillage(e.target.value)} style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1', borderRadius: '8px',
                fontSize: '0.85rem'
              }} />
                </div>
                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Total Inpatient Beds *</label>
                  <input type="number" required value={facBeds} onChange={e => setFacBeds(e.target.value)} style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #cbd5e1', borderRadius: '8px',
                fontSize: '0.85rem'
              }} />
                </div>
                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Oxygen Cylinders</label>
                  <input type="number" value={facOxygen} onChange={e => setFacOxygen(e.target.value)} style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #cbd5e1', borderRadius: '8px',
                fontSize: '0.85rem'
              }} />
                </div>
                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Duty Doctor Name</label>
                  <input type="text" placeholder="Enter doctor / in-charge name..." value={facDoctorName} onChange={e => setFacDoctorName(e.target.value)} style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1', borderRadius: '8px',
                fontSize: '0.85rem'
              }} />
                </div>
              </div>
              <div className="admin-form-actions" style={{
            display: 'flex',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
                <button type="button" onClick={() => setShowAddFacility(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save to MongoDB Atlas</button>
              </div>
            </form>}

          {/* Edit Facility Modal / Inline Form */}
          {editingFacility && <form onSubmit={handleUpdateFacility} className="glass-panel" style={{
          padding: 'clamp(14px, 3vw, 22px)',
          marginBottom: '22px',
          border: '1px solid #e2e8f0', borderRadius: '16px', background: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
              <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px'
          }}>
                <h4 style={{
              fontSize: '1.05rem',
              fontWeight: 800
            }}>
                  Edit Facility: {editingFacility.name}
                </h4>
                <button type="button" onClick={() => setEditingFacility(null)} style={{
              border: 'none',
              cursor: 'pointer'
            }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: '12px',
            marginBottom: '14px'
          }}>
                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Facility Name</label>
                  <input type="text" value={editingFacility.name} onChange={e => setEditingFacility({
                ...editingFacility,
                name: e.target.value
              })} style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #cbd5e1', borderRadius: '8px',
                fontSize: '0.85rem'
              }} />
                </div>
                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Available Beds</label>
                  <input type="number" value={editingFacility.beds?.available || 0} onChange={e => setEditingFacility({
                ...editingFacility,
                beds: {
                  ...editingFacility.beds,
                  available: Number(e.target.value)
                }
              })} style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #cbd5e1', borderRadius: '8px',
                fontSize: '0.85rem'
              }} />
                </div>
                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Oxygen Cylinders</label>
                  <input type="number" value={editingFacility.oxygenCylinders || 0} onChange={e => setEditingFacility({
                ...editingFacility,
                oxygenCylinders: Number(e.target.value)
              })} style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #cbd5e1', borderRadius: '8px',
                fontSize: '0.85rem'
              }} />
                </div>
                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Wait Time (Mins)</label>
                  <input type="number" value={editingFacility.currentWaitTimeMins || 15} onChange={e => setEditingFacility({
                ...editingFacility,
                currentWaitTimeMins: Number(e.target.value)
              })} style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #cbd5e1', borderRadius: '8px',
                fontSize: '0.85rem'
              }} />
                </div>
              </div>

              <div className="admin-form-actions" style={{
            display: 'flex',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
                <button type="button" onClick={() => setEditingFacility(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">
                  <Save size={15} />
                  <span>Update Facility in Database</span>
                </button>
              </div>
            </form>}

          {/* Facility Cards Grid */}
          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: '16px'
        }}>
            {facilities.map(fac => <div key={fac.id || fac._id} className="glass-card" style={{ padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>
                <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '8px',
              marginBottom: '8px'
            }}>
                  <div style={{ flex: '1 1 0%', minWidth: 0 }}>
                    <span className="badge badge-green" style={{
                  fontSize: '0.68rem'
                }}>{fac.type} • Level {fac.level}</span>
                    <h4 style={{
                  fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
                  fontWeight: 800,
                  marginTop: '4px',
                  wordBreak: 'break-word'
                }}>{fac.name}</h4>
                    <div style={{
                  fontSize: '0.78rem',
                  color: '#64748b'
                }}>{fac.village}, {fac.district} • <strong>{fac.distanceKm} km</strong></div>
                  </div>

                  <div style={{
                display: 'flex',
                gap: '6px',
                flexShrink: 0
              }}>
                    <button onClick={() => setEditingFacility(fac)} style={{
                  border: '1px solid #cbd5e1', borderRadius: '8px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  background: '#fff'
                }} title="Edit Facility">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteFacility(fac)} style={{
                  border: '1px solid #cbd5e1', borderRadius: '8px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  background: '#fff'
                }} title="Delete Facility">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '6px',
              margin: '12px 0',
              textAlign: 'center',
              background: '#f8fafc', padding: '10px 8px', borderRadius: '10px', border: '1px solid #f1f5f9'
            }}>
                  <div style={{ padding: '4px', minWidth: 0 }}>
                    <div style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#64748b'
                }}>FREE BEDS</div>
                    <div style={{
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{fac.beds?.available || 0} / {fac.beds?.total || 0}</div>
                  </div>
                  <div style={{ padding: '4px', minWidth: 0 }}>
                    <div style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#64748b'
                }}>OXYGEN</div>
                    <div style={{
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{fac.oxygenCylinders} Cylinders</div>
                  </div>
                  <div style={{ padding: '4px', minWidth: 0 }}>
                    <div style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#64748b'
                }}>DOCTORS</div>
                    <div style={{
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{(fac.doctors || []).length} Available</div>
                  </div>
                </div>

                <div style={{
              fontSize: '0.75rem',
              color: '#334155',
              wordBreak: 'break-word'
            }}>
                  <strong>Diagnostics:</strong> {(fac.diagnosticsAvailable || []).join(', ') || 'Basic OPD'}
                </div>
              </div>)}
          </div>
        </div>}

      {/* 2. MEDICINE INVENTORY MASTER VIEW */}
      {subTab === 'medicines' && (
        <AdminMedicineDashboard currentUser={currentUser} />
      )}
      {/* 3. OUTBREAKS VIEW */}
      {subTab === 'outbreaks' && <div>
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}>
            <h3 style={{
            fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)',
            fontWeight: 800
          }}>
              Active Disease Outbreak Surveillance Radar ({outbreaks.length} Active)
            </h3>
            <button onClick={() => setShowAddOutbreak(!showAddOutbreak)} className="btn-primary" style={{
            padding: '8px 16px',
            fontSize: '0.85rem',
            whiteSpace: 'nowrap'
          }}>
              <Plus size={16} />
              <span>{showAddOutbreak ? 'Close Form' : 'Broadcast Outbreak Alert'}</span>
            </button>
          </div>

          {showAddOutbreak && <form onSubmit={handleCreateOutbreak} className="glass-panel" style={{
          padding: 'clamp(14px, 3vw, 22px)',
          marginBottom: '22px',
          border: '1px solid #e2e8f0', borderRadius: '16px', background: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
              <h4 style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            marginBottom: '14px'
          }}>
                Broadcast Epidemiological Outbreak Alert to Field ASHAs
              </h4>
              <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: '12px',
            marginBottom: '14px'
          }}>
                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Disease Syndrome *</label>
                  <input type="text" required placeholder="Enter disease syndrome / condition..." value={obDisease} onChange={e => setObDisease(e.target.value)} style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1', borderRadius: '8px',
                fontSize: '0.85rem'
              }} />
                </div>
                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Village Cluster *</label>
                  <input type="text" required value={obVillage} onChange={e => setObVillage(e.target.value)} style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1', borderRadius: '8px',
                fontSize: '0.85rem'
              }} />
                </div>
                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Reported Cases This Week</label>
                  <input type="number" value={obCases} onChange={e => setObCases(e.target.value)} style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #cbd5e1', borderRadius: '8px',
                fontSize: '0.85rem'
              }} />
                </div>
                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Medical Protocol Action</label>
                  <input type="text" value={obAction} onChange={e => setObAction(e.target.value)} style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1', borderRadius: '8px',
                fontSize: '0.85rem'
              }} />
                </div>
              </div>
              <div className="admin-form-actions" style={{
            display: 'flex',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
                <button type="button" onClick={() => setShowAddOutbreak(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-emergency" style={{
              padding: '8px 16px',
              fontSize: '0.85rem'
            }}>Broadcast Alert to District</button>
              </div>
            </form>}

          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: '16px'
        }}>
            {outbreaks.map(ob => <div key={ob._id || ob.id} className="glass-card" style={{
            padding: 'clamp(14px, 2.5vw, 18px)',
            borderLeft: "4px solid #000"
          }}>
                <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  wordBreak: 'break-word'
                }}>{ob.disease}</h4>
                    <div style={{
                  fontSize: '0.78rem',
                  color: '#64748b'
                }}>{ob.village} ({ob.block})</div>
                  </div>
                  <span className="badge badge-red" style={{
                fontSize: '0.65rem',
                flexShrink: 0
              }}>{ob.casesThisWeek} Cases</span>
                </div>
                <div style={{
              padding: '10px',
              margin: '10px 0',
              fontSize: '0.78rem',
              border: '1px solid #cbd5e1', borderRadius: '8px',
              wordBreak: 'break-word'
            }}>
                  <strong>Protocol:</strong> {ob.recommendedAction}
                </div>
                <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px',
              fontSize: '0.72rem'
            }}>
                  <span style={{
                fontWeight: 600
              }}>Status: {ob.status}</span>
                  <button onClick={() => handleDeleteOutbreak(ob)} style={{
                border: '1px solid #cbd5e1', borderRadius: '8px',
                padding: '4px 10px',
                cursor: 'pointer',
                fontWeight: 700,
                background: '#fff'
              }}>
                    Mark Resolved
                  </button>
                </div>
              </div>)}
          </div>
        </div>}

      {/* 4. REGISTERED STAFF DIRECTORY */}
      {subTab === 'users' && <div className="glass-panel" style={{
      padding: 'clamp(14px, 2.5vw, 20px)'
    }}>
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}>
            <h3 style={{
            fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)',
            fontWeight: 800
          }}>
              Registered Public Health Staff & Administrators ({users.length})
            </h3>
          </div>

          <div style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
            <table style={{
            width: '100%',
            minWidth: '680px',
            borderCollapse: 'collapse',
            fontSize: '0.85rem'
          }}>
              <thead>
                <tr style={{
                textAlign: 'left',
                borderBottom: "2px solid #000"
              }}>
                  <th style={{ padding: '10px 12px' }}>NAME</th>
                  <th style={{ padding: '10px 12px' }}>USERNAME / ID</th>
                  <th style={{ padding: '10px 12px' }}>ROLE</th>
                  <th style={{ padding: '10px 12px' }}>VILLAGE / STATION</th>
                  <th style={{ padding: '10px 12px' }}>DESIGNATION</th>
                  <th style={{ padding: '10px 12px' }}>CONTACT</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => <tr key={u._id || u.username} style={{
                borderBottom: "1px solid #000"
              }}>
                    <td style={{
                    padding: '10px 12px',
                    fontWeight: 700
                  }}>{u.name}</td>
                    <td style={{
                    padding: '10px 12px',
                    fontWeight: 600
                  }}>{u.username}</td>
                    <td style={{
                    padding: '10px 12px'
                  }}>
                      <span className={`badge ${u.role === 'admin' ? 'badge-blue' : u.role === 'doctor' ? 'badge-green' : 'badge-yellow'}`} style={{
                      fontSize: '0.65rem'
                    }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{
                    padding: '10px 12px'
                  }}>{u.village || 'N/A'}</td>
                    <td style={{
                    padding: '10px 12px'
                  }}>{u.designation}</td>
                    <td style={{
                    padding: '10px 12px'
                  }}>{u.phone || 'N/A'}</td>
                  </tr>)}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '8px', textAlign: 'right' }}>
            ↔ Scroll horizontally to view all columns
          </div>
        </div>}

      {/* 5. DOCTOR MANAGEMENT DIRECTORY */}
      {subTab === 'doctors' && <div className="glass-panel" style={{ padding: 'clamp(14px, 2.5vw, 20px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)', fontWeight: 800 }}>Doctor Management & Registration</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Create doctor profiles, assign unique DOC-IDs, set login credentials, and manage doctors.</p>
            </div>
          </div>

          {/* Success Credentials Banner when a Doctor is Created */}
          {createdDoctorCreds && (
            <div style={{
              background: '#ecfdf5',
              border: '2px solid #059669',
              borderRadius: '0px',
              padding: 'clamp(14px, 3vw, 20px)',
              marginBottom: '24px',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{
                    background: '#059669',
                    color: '#ffffff',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>
                    ✓ Account Ready for Login
                  </span>
                  <h4 style={{ margin: '8px 0 4px 0', fontSize: '1.2rem', fontWeight: 800, color: '#064e3b' }}>
                    {createdDoctorCreds.name}
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: '#065f46' }}>
                    {createdDoctorCreds.specialization} &bull; Reg: {createdDoctorCreds.registrationNumber}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleCopyDoctorCreds}
                    style={{
                      background: copySuccess ? '#047857' : '#059669',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 16px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {copySuccess ? '✓ Credentials Copied!' : '📋 Copy Login Details'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedDoctorCreds(null);
                      setDocName('');
                      setDocPassword('');
                      setDocPhone('');
                      setDocEmail('');
                      setDocRegNum('');
                      setDocClinic('');
                    }}
                    style={{
                      background: '#ffffff',
                      color: '#065f46',
                      border: '1px solid #a7f3d0',
                      padding: '10px 14px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    + Register Another
                  </button>
                </div>
              </div>

              {/* Credential Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                gap: '12px',
                marginTop: '16px',
                background: '#ffffff',
                padding: '16px',
                border: '1px solid #a7f3d0'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>DOCTOR ID (LOGIN USERNAME)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f766e', fontFamily: 'monospace' }}>
                    {createdDoctorCreds.doctorId}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>LOGIN PASSWORD</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>
                    {createdDoctorCreds.password}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>REGISTERED MOBILE</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                    {createdDoctorCreds.phone}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>DOCTOR PANEL LOGIN</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#059669' }}>
                    Doctor can log in using ID ({createdDoctorCreds.doctorId}) or Mobile & Password!
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleCreateDoctor} style={{ background: '#f8fafc', padding: 'clamp(14px, 3vw, 20px)', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>
              Add / Register Doctor Account
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Doctor Name *</label>
                <input type="text" required value={docName} onChange={e => setDocName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} placeholder="Dr. First Last" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Initial Password *</label>
                <input type="text" required value={docPassword} onChange={e => setDocPassword(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} placeholder="e.g. DocSecret@123" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Phone Number *</label>
                <input type="text" required value={docPhone} onChange={e => setDocPhone(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} placeholder="10-digit Mobile (e.g. 9876543210)" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Email Address</label>
                <input type="email" value={docEmail} onChange={e => setDocEmail(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} placeholder="doctor@example.com" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Registration Number *</label>
                <input type="text" required value={docRegNum} onChange={e => setDocRegNum(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} placeholder="MCI-123456" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Medical Council</label>
                <input type="text" value={docCouncil} onChange={e => setDocCouncil(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} placeholder="e.g. Medical Council of India (MCI)" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Specialization</label>
                <input type="text" value={docSpec} onChange={e => setDocSpec(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} placeholder="General Physician" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Qualification</label>
                <input type="text" value={docQual} onChange={e => setDocQual(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} placeholder="MBBS, MD" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Experience (Years)</label>
                <input type="number" value={docExp} onChange={e => setDocExp(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Clinic / Hospital Name</label>
                <input type="text" value={docClinic} onChange={e => setDocClinic(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} placeholder="Dr. Name's Clinic" />
              </div>
            </div>
            
            <div className="admin-form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <button type="submit" className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Generate Doctor ID & Profile
              </button>
            </div>
          </form>

          {/* List of Registered Doctors */}
          <div style={{ marginTop: '30px' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '12px', color: '#1e293b' }}>
              Registered Doctors in Network ({users.filter(u => u.role === 'doctor').length})
            </h4>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                    <th style={{ padding: '10px 12px' }}>DOCTOR NAME</th>
                    <th style={{ padding: '10px 12px' }}>DOCTOR ID / USERNAME</th>
                    <th style={{ padding: '10px 12px' }}>SPECIALIZATION</th>
                    <th style={{ padding: '10px 12px' }}>CONTACT PHONE</th>
                    <th style={{ padding: '10px 12px' }}>CLINIC / FACILITY</th>
                    <th style={{ padding: '10px 12px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.role === 'doctor').map(doc => (
                    <tr key={doc._id || doc.username} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f766e' }}>
                        {doc.name}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, fontFamily: 'monospace' }}>
                        {doc.doctorId || doc.username}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {doc.designation || 'General Physician'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {doc.phone || 'N/A'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {doc.facilityName || 'Independent Clinic'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          background: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #a7f3d0',
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          ACTIVE DOCTOR
                        </span>
                      </td>
                    </tr>
                  ))}
                  {users.filter(u => u.role === 'doctor').length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        No doctors registered yet. Fill out the form above to generate a doctor profile.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '8px', textAlign: 'right' }}>
              ↔ Scroll horizontally to view all columns
            </div>
          </div>
      </div>}

      {/* 6. STAFF MANAGEMENT DIRECTORY */}
      {subTab === 'staff' && <div className="glass-panel" style={{ padding: 'clamp(14px, 2.5vw, 20px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)', fontWeight: 800 }}>Create New Staff Profile</h3>
          </div>
          
          <form onSubmit={handleCreateStaff} style={{ background: '#f8fafc', padding: 'clamp(14px, 3vw, 20px)', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Staff Name *</label>
                <input type="text" required value={staffName} onChange={e => setStaffName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} placeholder="First Last" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Initial Password *</label>
                <input type="text" required value={staffPassword} onChange={e => setStaffPassword(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} placeholder="Secure Password" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Phone Number *</label>
                <input type="text" required value={staffPhone} onChange={e => setStaffPhone(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} placeholder="10-digit Mobile" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Email Address</label>
                <input type="email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} placeholder="staff@example.com" />
              </div>
            </div>
            
            <div className="admin-form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>Generate Staff ID & Profile</button>
            </div>
          </form>

          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            <strong>Note:</strong> The system will automatically generate a unique <code>STF-XXXXXX</code> ID. The staff member can use this ID or their phone number along with the initial password to log in.
          </div>
      </div>}

    </div>;
}
