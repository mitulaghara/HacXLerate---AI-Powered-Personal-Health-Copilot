import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import HeartbeatLoader from './HeartbeatLoader';
import {
  Database,
  Trash2,
  Edit3,
  Plus,
  RefreshCw,
  Users,
  Building2,
  Pill,
  AlertTriangle,
  FileText,
  Activity,
  Search,
  CheckCircle2,
  X,
  ShieldAlert,
  ArrowRight,
  UserPlus,
  Lock
} from 'lucide-react';

export default function AdminDataMaster({ currentUser }) {
  const [activeCategory, setActiveCategory] = useState('patients'); // patients, users, facilities, inventory, outbreaks, prescriptions, referrals
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [searchQuery, setSearchQuery] = useState('');

  // Data lists
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [outbreaks, setOutbreaks] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [referrals, setReferrals] = useState([]);

  // Modals
  const [editPatient, setEditPatient] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const generateRandomOfficialId = (role) => {
    const roleLower = (role || '').toLowerCase();
    const prefix = roleLower === 'doctor' ? 'DOC' : roleLower === 'asha' ? 'ASHA' : roleLower === 'pharmacist' ? 'PHM' : roleLower === 'admin' ? 'ADM' : 'STF';
    const num = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${num}`;
  };
  const [generatedOfficialId, setGeneratedOfficialId] = useState('DOC-381942');
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'doctor',
    designation: 'Medical Officer',
    phone: '',
    village: '',
    facilityId: 'FAC-PHC-001'
  });

  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const loadAllData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        statsRes,
        patientsRes,
        usersRes,
        facilitiesRes,
        inventoryRes,
        outbreaksRes,
        prescriptionsRes,
        referralsRes
      ] = await Promise.all([
        api.getAdminStats().catch(() => ({ success: false })),
        api.getPatients().catch(() => ({ success: false })),
        (api.getUsers ? api.getUsers() : api.getUsersList ? api.getUsersList() : Promise.resolve({ success: false })).catch(() => ({ success: false })),
        api.getFacilities().catch(() => ({ success: false })),
        api.getInventory().catch(() => ({ success: false })),
        api.getOutbreaks().catch(() => ({ success: false })),
        api.getPrescriptions().catch(() => ({ success: false })),
        api.getReferrals().catch(() => ({ success: false }))
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (patientsRes.success && Array.isArray(patientsRes.data)) setPatients(patientsRes.data);
      if (usersRes.success) {
        const uList = Array.isArray(usersRes.users) ? usersRes.users : Array.isArray(usersRes.data) ? usersRes.data : [];
        setUsers(uList);
      }
      if (facilitiesRes.success && Array.isArray(facilitiesRes.data)) setFacilities(facilitiesRes.data);
      if (inventoryRes.success && Array.isArray(inventoryRes.data)) setMedicines(inventoryRes.data);
      if (outbreaksRes.success && Array.isArray(outbreaksRes.data)) setOutbreaks(outbreaksRes.data);
      if (prescriptionsRes.success && Array.isArray(prescriptionsRes.data)) setPrescriptions(prescriptionsRes.data);
      if (referralsRes.success && Array.isArray(referralsRes.data)) setReferrals(referralsRes.data);
    } catch (e) {
      console.error('Failed to load admin data master records:', e);
      showNotification('Network issue loading master records', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // -------------------------------------------------------------
  // PATIENT CRUD ACTIONS
  // -------------------------------------------------------------
  const handleDeletePatient = async (p) => {
    const id = p.id || p._id;
    if (!window.confirm(`Are you sure you want to permanently delete patient record: "${p.name}" (ID: ${id})?`)) {
      return;
    }
    try {
      const res = await api.deletePatient(id);
      if (res.success) {
        showNotification(res.message || 'Patient deleted successfully.');
        setPatients(prev => prev.filter(item => (item.id !== id && item._id !== id)));
        loadAllData(true);
      } else {
        showNotification(res.message || 'Failed to delete patient', 'error');
      }
    } catch (e) {
      showNotification('Error deleting patient', 'error');
    }
  };

  const handleSaveEditPatient = async (e) => {
    e.preventDefault();
    if (!editPatient) return;
    const id = editPatient.id || editPatient._id;
    try {
      const res = await api.updatePatient(id, editPatient);
      if (res.success) {
        showNotification(res.message || 'Patient updated successfully.');
        setEditPatient(null);
        loadAllData(true);
      } else {
        showNotification(res.message || 'Failed to update patient', 'error');
      }
    } catch (e) {
      showNotification('Error updating patient', 'error');
    }
  };

  // -------------------------------------------------------------
  // USER CRUD ACTIONS
  // -------------------------------------------------------------
  const handleDeleteUser = async (u) => {
    const id = u._id || u.username;
    if (u.username === 'admin') {
      showNotification('Cannot delete primary admin account.', 'error');
      return;
    }
    if (!window.confirm(`Delete user account "${u.name}" (@${u.username}) with role [${u.role}]?`)) {
      return;
    }
    try {
      const res = await api.deleteAdminUser(id);
      if (res.success) {
        showNotification(res.message || 'User deleted.');
        setUsers(prev => prev.filter(item => item._id !== u._id && item.username !== u.username));
        loadAllData(true);
      } else {
        showNotification(res.message || 'Failed to delete user', 'error');
      }
    } catch (e) {
      showNotification('Error deleting user', 'error');
    }
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    const id = editUser._id || editUser.username;
    try {
      const payload = {
        ...editUser,
        officialId: editUser.officialId || editUser.doctorId || editUser.staffId || editUser.patId
      };
      const res = await api.updateAdminUser(id, payload);
      if (res.success) {
        showNotification(res.message || 'User updated successfully.');
        setEditUser(null);
        loadAllData(true);
      } else {
        showNotification(res.message || 'Failed to update user', 'error');
      }
    } catch (e) {
      showNotification('Error updating user', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newUserForm,
        officialId: generatedOfficialId,
        username: (newUserForm.username || '').trim() || generatedOfficialId.toLowerCase()
      };
      const res = await api.createAdminUser(payload);
      if (res.success) {
        showNotification(res.message || `New ${newUserForm.role} created! ID: ${res.officialId || generatedOfficialId}`);
        setShowAddUser(false);
        const nextRole = 'doctor';
        setGeneratedOfficialId(generateRandomOfficialId(nextRole));
        setNewUserForm({
          name: '',
          username: '',
          password: '',
          role: nextRole,
          designation: 'Medical Officer',
          phone: '',
          village: '',
          facilityId: 'FAC-PHC-001'
        });
        loadAllData(true);
      } else {
        showNotification(res.message || 'Failed to create user', 'error');
      }
    } catch (e) {
      showNotification('Error creating user', 'error');
    }
  };

  // -------------------------------------------------------------
  // OTHER ENTITY DELETIONS
  // -------------------------------------------------------------
  const handleDeleteFacility = async (fac) => {
    const id = fac.id || fac._id;
    if (!window.confirm(`Permanently delete facility "${fac.name}" (${fac.type})?`)) return;
    try {
      const res = await api.deleteFacility(id);
      if (res.success) {
        showNotification('Facility deleted.');
        setFacilities(prev => prev.filter(f => f.id !== id && f._id !== id));
        loadAllData(true);
      } else {
        showNotification(res.message || 'Delete failed', 'error');
      }
    } catch (e) {
      showNotification('Error deleting facility', 'error');
    }
  };

  const handleDeleteMedicine = async (med) => {
    const id = med.id || med._id;
    if (!window.confirm(`Permanently delete medicine stock item "${med.name}"?`)) return;
    try {
      const res = await api.deleteMedicine(id);
      if (res.success) {
        showNotification('Medicine deleted.');
        setMedicines(prev => prev.filter(m => m.id !== id && m._id !== id));
        loadAllData(true);
      } else {
        showNotification(res.message || 'Delete failed', 'error');
      }
    } catch (e) {
      showNotification('Error deleting medicine', 'error');
    }
  };

  const handleDeleteOutbreak = async (ob) => {
    const id = ob._id || ob.id;
    if (!window.confirm(`Delete outbreak alert for "${ob.disease}" in ${ob.village}?`)) return;
    try {
      const res = await api.deleteOutbreak(id);
      if (res.success) {
        showNotification('Outbreak deleted.');
        setOutbreaks(prev => prev.filter(o => o._id !== id && o.id !== id));
        loadAllData(true);
      } else {
        showNotification(res.message || 'Delete failed', 'error');
      }
    } catch (e) {
      showNotification('Error deleting outbreak', 'error');
    }
  };

  const handleDeletePrescription = async (rx) => {
    const id = rx.prescriptionId || rx._id || rx.id;
    if (!window.confirm(`Delete Prescription #${rx.prescriptionId || id} for ${rx.patientName}?`)) return;
    try {
      const res = await api.deletePrescription(id);
      if (res.success) {
        showNotification(res.message || 'Prescription deleted.');
        setPrescriptions(prev => prev.filter(p => (
          p.prescriptionId !== id &&
          p._id !== id &&
          p.id !== id &&
          p.prescriptionId !== rx.prescriptionId &&
          p._id !== rx._id
        )));
        loadAllData(true);
      } else {
        showNotification(res.message || 'Delete failed', 'error');
      }
    } catch (e) {
      showNotification('Error deleting prescription', 'error');
    }
  };

  const handleDeleteReferral = async (ref) => {
    const id = ref.referralCode || ref.id || ref._id;
    if (!window.confirm(`Delete Referral #${ref.referralCode || ref.id} for ${ref.patientName}?`)) return;
    try {
      const res = await api.deleteReferral(id);
      if (res.success) {
        showNotification('Referral deleted.');
        setReferrals(prev => prev.filter(r => r.referralCode !== id && r.id !== id && r._id !== id));
        loadAllData(true);
      } else {
        showNotification(res.message || 'Delete failed', 'error');
      }
    } catch (e) {
      showNotification('Error deleting referral', 'error');
    }
  };

  // -------------------------------------------------------------
  // BULK PURGE SPECIFIC COLLECTION
  // -------------------------------------------------------------
  const handlePurgeCollection = async (collectionName, friendlyTitle) => {
    const prompt1 = window.prompt(
      `⚠️ CRITICAL WARNING: You are about to DELETE ALL records in [${friendlyTitle}].\n\nTo confirm, type: CONFIRM_PURGE`
    );
    if (prompt1 !== 'CONFIRM_PURGE') {
      showNotification('Purge cancelled (keyword mismatch).', 'error');
      return;
    }

    try {
      const res = await api.purgeCollection(collectionName, 'CONFIRM_PURGE');
      if (res.success) {
        showNotification(res.message || `All records in ${friendlyTitle} purged!`);
        loadAllData(true);
      } else {
        showNotification(res.message || 'Purge failed', 'error');
      }
    } catch (e) {
      showNotification('Network error during purge', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '80px', display: 'flex', justifyContent: 'center' }}>
        <HeartbeatLoader text="Loading Master Database Management & CRUD Control..." />
      </div>
    );
  }

  // Filtered lists
  const filteredPatients = patients.filter(p =>
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.village || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.phone || '').includes(searchQuery)
  );

  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.designation || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFacilities = facilities.filter(f =>
    (f.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.village || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMedicines = medicines.filter(m =>
    (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.genericName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.batchNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOutbreaks = outbreaks.filter(o =>
    (o.disease || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.village || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrescriptions = prescriptions.filter(p =>
    (p.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.prescriptionId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.doctorName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReferrals = referrals.filter(r =>
    (r.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.referralCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.referringUnit || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#ffffff',
          padding: '14px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 700,
          fontSize: '0.9rem'
        }}>
          {toast.type === 'error' ? <ShieldAlert size={20} /> : <CheckCircle2 size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#7c3aed', color: '#fff', padding: '10px', borderRadius: '10px' }}>
              <Database size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Master Data Management & CRUD Control
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                Full administrative authority to Create, Read, Edit, Delete single records, or Purge entire collections.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => loadAllData(true)}
          disabled={refreshing}
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            color: '#334155'
          }}
        >
          {refreshing ? <HeartbeatLoader size={16} color="#7c3aed" /> : <RefreshCw size={16} color="#7c3aed" />}
          Refresh Database
        </button>
      </div>

      {/* System DB Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Patients', count: stats?.patients ?? patients.length, color: '#2563eb', bg: '#eff6ff', cat: 'patients' },
          { label: 'Staff / Users', count: stats?.users ?? users.length, color: '#059669', bg: '#ecfdf5', cat: 'users' },
          { label: 'Facilities', count: stats?.facilities ?? facilities.length, color: '#d97706', bg: '#fffbeb', cat: 'facilities' },
          { label: 'Medicines', count: stats?.inventory ?? medicines.length, color: '#7c3aed', bg: '#f5f3ff', cat: 'inventory' },
          { label: 'Outbreaks', count: stats?.outbreaks ?? outbreaks.length, color: '#dc2626', bg: '#fef2f2', cat: 'outbreaks' },
          { label: 'Prescriptions', count: stats?.prescriptions ?? prescriptions.length, color: '#0284c7', bg: '#f0f9ff', cat: 'prescriptions' },
          { label: 'Referrals', count: stats?.referrals ?? referrals.length, color: '#4f46e5', bg: '#eef2ff', cat: 'referrals' },
          { label: 'Audit Logs', count: stats?.auditLogs ?? 0, color: '#475569', bg: '#f8fafc', cat: 'audit-logs' }
        ].map(item => (
          <div
            key={item.label}
            onClick={() => { if (item.cat !== 'audit-logs') setActiveCategory(item.cat); }}
            style={{
              background: item.bg,
              border: `1px solid ${activeCategory === item.cat ? item.color : '#e2e8f0'}`,
              borderRadius: '12px',
              padding: '12px',
              cursor: item.cat !== 'audit-logs' ? 'pointer' : 'default',
              boxShadow: activeCategory === item.cat ? `0 0 0 2px ${item.color}33` : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: item.color }}>{item.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>{item.count}</div>
          </div>
        ))}
      </div>

      {/* Main Control Panel */}
      <div className="glass-panel" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
        
        {/* Navigation Tabs & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
          
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'patients', label: `Patients (${patients.length})`, icon: Users },
              { id: 'users', label: `Users & Staff (${users.length})`, icon: UserPlus },
              { id: 'facilities', label: `Facilities (${facilities.length})`, icon: Building2 },
              { id: 'inventory', label: `Medicines (${medicines.length})`, icon: Pill },
              { id: 'outbreaks', label: `Outbreaks (${outbreaks.length})`, icon: AlertTriangle },
              { id: 'prescriptions', label: `Prescriptions (${prescriptions.length})`, icon: FileText },
              { id: 'referrals', label: `Referrals (${referrals.length})`, icon: Activity }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveCategory(tab.id); setSearchQuery(''); }}
                  style={{
                    background: isActive ? '#0f172a' : '#f8fafc',
                    color: isActive ? '#ffffff' : '#475569',
                    border: '1px solid',
                    borderColor: isActive ? '#0f172a' : '#cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search bar & Purge Category */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder={`Search ${activeCategory}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px 8px 32px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  width: '200px'
                }}
              />
            </div>

            {/* Quick Purge Category Button */}
            <button
              onClick={() => handlePurgeCollection(activeCategory, activeCategory.toUpperCase())}
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title={`Purge all records in ${activeCategory}`}
            >
              <Trash2 size={14} />
              <span>Purge All {activeCategory}</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: PATIENTS CRUD                                          */}
        {/* ------------------------------------------------------------- */}
        {activeCategory === 'patients' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Patients Database Records ({filteredPatients.length})
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px 12px' }}>PATIENT ID</th>
                    <th style={{ padding: '10px 12px' }}>NAME</th>
                    <th style={{ padding: '10px 12px' }}>AGE / GENDER</th>
                    <th style={{ padding: '10px 12px' }}>VILLAGE / PHONE</th>
                    <th style={{ padding: '10px 12px' }}>RISK / TRIAGE</th>
                    <th style={{ padding: '10px 12px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p, idx) => (
                    <tr key={p.id || p._id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                        {p.id || String(p._id).slice(-6)}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                        {p.name}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>
                        {p.age} Yrs • {p.gender}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{p.village || 'N/A'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.phone || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH' ? '#fee2e2' : p.riskLevel === 'MODERATE' ? '#fef3c7' : '#dcfce7',
                          color: p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH' ? '#dc2626' : p.riskLevel === 'MODERATE' ? '#d97706' : '#16a34a'
                        }}>
                          {p.riskLevel === 'ROUTINE' ? 'LOW' : (p.riskLevel || 'LOW')}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setEditPatient({ ...p })}
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeletePatient(p)}
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No patient records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: USERS & STAFF CRUD                                     */}
        {/* ------------------------------------------------------------- */}
        {activeCategory === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                System Accounts & Healthcare Workers ({filteredUsers.length})
              </h3>
              <button
                onClick={() => {
                  setGeneratedOfficialId(generateRandomOfficialId(newUserForm.role));
                  setShowAddUser(true);
                }}
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={15} /> Add New User / Staff
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px 12px' }}>NAME</th>
                    <th style={{ padding: '10px 12px' }}>OFFICIAL ID / USERNAME</th>
                    <th style={{ padding: '10px 12px' }}>ROLE</th>
                    <th style={{ padding: '10px 12px' }}>DESIGNATION</th>
                    <th style={{ padding: '10px 12px' }}>PHONE / LOCATION</th>
                    <th style={{ padding: '10px 12px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, idx) => {
                    const isSelf = currentUser && (currentUser.id === u._id || currentUser.username === u.username);
                    const isMasterAdmin = u.username === 'admin';
                    const officialId = u.doctorId || u.staffId || u.patId;

                    return (
                      <tr key={u._id || u.username || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                          {u.name} {isSelf && <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: '4px' }}>YOU</span>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div>
                            {officialId ? (
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: u.role === 'doctor' ? '#ecfdf5' : '#eff6ff',
                                border: u.role === 'doctor' ? '1px solid #86efac' : '1px solid #bfdbfe',
                                color: u.role === 'doctor' ? '#15803d' : '#1d4ed8',
                                fontWeight: 800,
                                fontSize: '0.8rem',
                                fontFamily: 'monospace'
                              }}>
                                {officialId}
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                                color: '#64748b',
                                fontSize: '0.74rem',
                                fontWeight: 700
                              }}>
                                SYS-USER
                              </span>
                            )}
                            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                              @{u.username}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: u.role === 'admin' ? '#e0e7ff' : u.role === 'doctor' ? '#dcfce7' : '#fef3c7',
                            color: u.role === 'admin' ? '#4338ca' : u.role === 'doctor' ? '#16a34a' : '#d97706',
                            textTransform: 'uppercase'
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>
                          {u.designation || 'Health Personnel'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ color: '#334155' }}>{u.phone || 'N/A'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.village || 'Primary Unit'}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => setEditUser({ ...u })}
                              style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#1d4ed8',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            {!isSelf && !isMasterAdmin && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                style={{
                                  background: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  color: '#dc2626',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700
                                }}
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: FACILITIES CRUD                                        */}
        {/* ------------------------------------------------------------- */}
        {activeCategory === 'facilities' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Registered Healthcare Facilities ({filteredFacilities.length})
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px 12px' }}>FACILITY ID</th>
                    <th style={{ padding: '10px 12px' }}>NAME</th>
                    <th style={{ padding: '10px 12px' }}>TYPE</th>
                    <th style={{ padding: '10px 12px' }}>LOCATION</th>
                    <th style={{ padding: '10px 12px' }}>BEDS (AVAIL/TOTAL)</th>
                    <th style={{ padding: '10px 12px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacilities.map((f, idx) => (
                    <tr key={f.id || f._id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#d97706' }}>
                        {f.id || String(f._id).slice(-6)}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                        {f.name}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, background: '#fef3c7', color: '#b45309' }}>
                          {f.type}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>
                        {f.village}, {f.district}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#059669' }}>
                        {f.beds?.available ?? 0} / {f.beds?.total ?? 0}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <button
                          onClick={() => handleDeleteFacility(f)}
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: MEDICINE INVENTORY CRUD                                */}
        {/* ------------------------------------------------------------- */}
        {activeCategory === 'inventory' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Medicine Stock Catalog ({filteredMedicines.length})
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px 12px' }}>MEDICINE NAME</th>
                    <th style={{ padding: '10px 12px' }}>CATEGORY / FORM</th>
                    <th style={{ padding: '10px 12px' }}>BATCH</th>
                    <th style={{ padding: '10px 12px' }}>FACILITY</th>
                    <th style={{ padding: '10px 12px' }}>STOCK QTY</th>
                    <th style={{ padding: '10px 12px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicines.map((m, idx) => (
                    <tr key={m.id || m._id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                        {m.name} {m.strength && <span style={{ color: '#64748b', fontSize: '0.8rem' }}>({m.strength})</span>}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>
                        {m.category} • {m.dosageForm}
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>
                        {m.batchNumber || 'N/A'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>
                        {m.facilityName}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 800, color: m.stockQty <= m.minThreshold ? '#dc2626' : '#16a34a' }}>
                        {m.stockQty} {m.unit}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <button
                          onClick={() => handleDeleteMedicine(m)}
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: EPIDEMIC OUTBREAKS CRUD                                */}
        {/* ------------------------------------------------------------- */}
        {activeCategory === 'outbreaks' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Epidemic Surveillance Alerts ({filteredOutbreaks.length})
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px 12px' }}>DISEASE</th>
                    <th style={{ padding: '10px 12px' }}>VILLAGE / BLOCK</th>
                    <th style={{ padding: '10px 12px' }}>CASES THIS WEEK</th>
                    <th style={{ padding: '10px 12px' }}>RECOMMENDED ACTION</th>
                    <th style={{ padding: '10px 12px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOutbreaks.map((ob, idx) => (
                    <tr key={ob._id || ob.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#dc2626' }}>
                        {ob.disease}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        {ob.village} ({ob.block})
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 800, color: '#b91c1c' }}>
                        {ob.casesThisWeek} Cases
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#475569' }}>
                        {ob.recommendedAction}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <button
                          onClick={() => handleDeleteOutbreak(ob)}
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredOutbreaks.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No active outbreak alerts recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: PRESCRIPTIONS CRUD                                     */}
        {/* ------------------------------------------------------------- */}
        {activeCategory === 'prescriptions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Doctor Prescriptions ({filteredPrescriptions.length})
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px 12px' }}>RX ID</th>
                    <th style={{ padding: '10px 12px' }}>PATIENT</th>
                    <th style={{ padding: '10px 12px' }}>DOCTOR</th>
                    <th style={{ padding: '10px 12px' }}>DIAGNOSIS</th>
                    <th style={{ padding: '10px 12px' }}>MEDICINES COUNT</th>
                    <th style={{ padding: '10px 12px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrescriptions.map((p, idx) => (
                    <tr key={p.prescriptionId || p._id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                        #{p.prescriptionId || String(p._id).slice(-6)}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                        {p.patientName}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>
                        {p.doctorName}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        {p.diagnosis || 'General Clinical'}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                        {p.medicines?.length || 0} item(s)
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <button
                          onClick={() => handleDeletePrescription(p)}
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredPrescriptions.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No prescriptions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 7: REFERRALS CRUD                                         */}
        {/* ------------------------------------------------------------- */}
        {activeCategory === 'referrals' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Hospital Referrals ({filteredReferrals.length})
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px 12px' }}>REFERRAL CODE</th>
                    <th style={{ padding: '10px 12px' }}>PATIENT</th>
                    <th style={{ padding: '10px 12px' }}>ORIGIN UNIT</th>
                    <th style={{ padding: '10px 12px' }}>TARGET HOSPITAL</th>
                    <th style={{ padding: '10px 12px' }}>PRIORITY / STATUS</th>
                    <th style={{ padding: '10px 12px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReferrals.map((r, idx) => (
                    <tr key={r.referralCode || r._id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#4f46e5' }}>
                        {r.referralCode || r.id}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                        {r.patientName}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>
                        {r.referringUnit}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155', fontWeight: 600 }}>
                        {r.referredToFacilityName}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: r.priority?.includes('RED') ? '#fee2e2' : '#fef3c7',
                          color: r.priority?.includes('RED') ? '#dc2626' : '#d97706'
                        }}>
                          {r.priority} ({r.status})
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <button
                          onClick={() => handleDeleteReferral(r)}
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredReferrals.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No referrals found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------- */}
      {/* EDIT PATIENT MODAL                                            */}
      {/* ------------------------------------------------------------- */}
      {editPatient && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <form
            onSubmit={handleSaveEditPatient}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '550px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                Edit Patient Record #{editPatient.id || editPatient._id}
              </h3>
              <button type="button" onClick={() => setEditPatient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={editPatient.name || ''}
                  onChange={e => setEditPatient({ ...editPatient, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Age</label>
                <input
                  type="number"
                  value={editPatient.age || ''}
                  onChange={e => setEditPatient({ ...editPatient, age: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Gender</label>
                <select
                  value={editPatient.gender || 'Female'}
                  onChange={e => setEditPatient({ ...editPatient, gender: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Phone</label>
                <input
                  type="text"
                  value={editPatient.phone || ''}
                  onChange={e => setEditPatient({ ...editPatient, phone: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Village / Location</label>
                <input
                  type="text"
                  value={editPatient.village || ''}
                  onChange={e => setEditPatient({ ...editPatient, village: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Risk Priority</label>
                <select
                  value={editPatient.riskLevel === 'ROUTINE' ? 'LOW' : (editPatient.riskLevel || 'LOW')}
                  onChange={e => setEditPatient({ ...editPatient, riskLevel: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  <option value="LOW">Routine / Low</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical Emergency</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Chief Complaint / Symptoms</label>
              <textarea
                rows={3}
                value={editPatient.chiefComplaint || ''}
                onChange={e => setEditPatient({ ...editPatient, chiefComplaint: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setEditPatient(null)} style={{ background: '#f1f5f9', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* EDIT USER MODAL                                               */}
      {/* ------------------------------------------------------------- */}
      {editUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <form
            onSubmit={handleSaveEditUser}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                Edit User @{editUser.username}
              </h3>
              <button type="button" onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Full Name *</label>
              <input
                type="text"
                required
                value={editUser.name || ''}
                onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
              />
            </div>

            {/* Permanent Official ID (Read-only, generated once) */}
            <div style={{
              marginBottom: '14px',
              background: '#f8fafc',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Official ID ({editUser.role === 'doctor' ? 'Doctor ID' : editUser.role === 'asha' ? 'ASHA ID' : editUser.role === 'pharmacist' ? 'Pharmacist ID' : 'Staff ID'})
                </label>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={12} /> Permanent Official ID
                </span>
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '1rem',
                fontWeight: 800,
                color: '#0f172a',
                background: '#ffffff',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>{editUser.officialId || editUser.doctorId || editUser.staffId || editUser.patId || 'N/A'}</span>
                <span style={{ fontSize: '0.68rem', background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  CANNOT BE CHANGED
                </span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px' }}>
                Generated once upon registration. Strictly immutable and permanently locked.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>
                  Role <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 400 }}>(Tied to ID)</span>
                </label>
                <select
                  disabled={true}
                  value={editUser.role || 'staff'}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                >
                  <option value="doctor">Doctor</option>
                  <option value="staff">Staff / Health Worker</option>
                  <option value="asha">ASHA Worker</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Designation</label>
                <input
                  type="text"
                  value={editUser.designation || ''}
                  onChange={e => setEditUser({ ...editUser, designation: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Phone</label>
                <input
                  type="text"
                  value={editUser.phone || ''}
                  onChange={e => setEditUser({ ...editUser, phone: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Village / Location</label>
                <input
                  type="text"
                  value={editUser.village || ''}
                  onChange={e => setEditUser({ ...editUser, village: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setEditUser(null)} style={{ background: '#f1f5f9', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" style={{ background: '#059669', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CREATE NEW USER MODAL                                         */}
      {/* ------------------------------------------------------------- */}
      {showAddUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <form
            onSubmit={handleCreateUser}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Register Healthcare Personnel
                </h3>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Assign official role ID and register staff credentials
                </div>
              </div>
              <button type="button" onClick={() => setShowAddUser(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            {/* Official ID Showcase Card */}
            <div style={{
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  AUTO-GENERATED OFFICIAL ID ({newUserForm.role === 'doctor' ? 'Doctor ID' : newUserForm.role === 'asha' ? 'ASHA ID' : newUserForm.role === 'pharmacist' ? 'Pharmacist ID' : 'Staff ID'})
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803d', fontFamily: 'monospace', letterSpacing: '1px', marginTop: '2px' }}>
                  {generatedOfficialId}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#16a34a' }}>
                  System-assigned official identifier (never generated from mobile number).
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGeneratedOfficialId(generateRandomOfficialId(newUserForm.role))}
                style={{
                  background: '#ffffff',
                  border: '1px solid #86efac',
                  color: '#15803d',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <RefreshCw size={13} /> Regenerate
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Role *</label>
                <select
                  value={newUserForm.role}
                  onChange={e => {
                    const newRole = e.target.value;
                    const newId = generateRandomOfficialId(newRole);
                    setGeneratedOfficialId(newId);
                    const defaultDesignation = 
                      newRole === 'doctor' ? 'Medical Officer' :
                      newRole === 'asha' ? 'ASHA Health Worker' :
                      newRole === 'pharmacist' ? 'Pharmacist' :
                      newRole === 'admin' ? 'Health Administrator' : 'Staff Nurse / Health Worker';
                    setNewUserForm({
                      ...newUserForm,
                      role: newRole,
                      designation: defaultDesignation
                    });
                  }}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  <option value="doctor">Doctor (DOC-XXXXXX)</option>
                  <option value="staff">Staff / Health Worker (STF-XXXXXX)</option>
                  <option value="asha">ASHA Worker (ASHA-XXXXXX)</option>
                  <option value="pharmacist">Pharmacist (PHM-XXXXXX)</option>
                  <option value="admin">Administrator (ADM-XXXXXX)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Medical Officer"
                  value={newUserForm.designation}
                  onChange={e => setNewUserForm({ ...newUserForm, designation: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={newUserForm.name}
                  onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>
                  Username <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder={`Defaults to ${generatedOfficialId.toLowerCase()}`}
                  value={newUserForm.username}
                  onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUserForm.password}
                  onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>
                  Phone Number <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="+91-9876543210"
                  value={newUserForm.phone}
                  onChange={e => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Village / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Rampur"
                  value={newUserForm.village}
                  onChange={e => setNewUserForm({ ...newUserForm, village: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Assigned Facility</label>
                <select
                  value={newUserForm.facilityId}
                  onChange={e => setNewUserForm({ ...newUserForm, facilityId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  {facilities && facilities.length > 0 ? (
                    facilities.map(f => (
                      <option key={f.facilityId || f._id || f.id} value={f.facilityId || f.id}>
                        {f.name} ({f.facilityId || f.type})
                      </option>
                    ))
                  ) : (
                    <option value="FAC-PHC-001">Primary Health Centre (FAC-PHC-001)</option>
                  )}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowAddUser(false)} style={{ background: '#f1f5f9', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" style={{ background: '#059669', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
