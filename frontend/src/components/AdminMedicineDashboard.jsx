import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import HeartbeatLoader from './HeartbeatLoader';
import { Search, Filter, Plus, Edit3, Trash2, ArrowUpRight, ArrowDownRight, Package, AlertCircle, TrendingUp, TrendingDown, RefreshCw, X, Shield, Activity, Calendar, MapPin, SearchX } from 'lucide-react';

export default function AdminMedicineDashboard({ currentUser }) {
  const [medicines, setMedicines] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, history, analytics
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  
  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Form State
  const [form, setForm] = useState({
    name: '', genericName: '', category: 'General Medicine', dosageForm: 'Tablet',
    strength: '', manufacturer: 'National Medical Depot', batchNumber: '',
    expiryDate: '', unit: 'Strips', price: 0, stockQty: 0, minThreshold: 50,
    facilityId: 'FAC-PHC-001', facilityName: 'Primary Health Centre'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [medRes, metricRes, txnRes] = await Promise.all([
        api.getStock(),
        api.getStockDashboardMetrics(),
        api.getStockTransactions({ limit: 50 })
      ]);
      if (medRes.success) setMedicines(medRes.data);
      if (metricRes.success) setMetrics(metricRes.data);
      if (txnRes.success) setTransactions(txnRes.data);
    } catch (e) {
      console.error(e);
      showToast('Error loading medicine data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleOpenForm = (med = null) => {
    if (med) {
      setEditingMed(med);
      setForm({
        name: med.name || '',
        genericName: med.genericName || '',
        category: med.category || 'General Medicine',
        dosageForm: med.dosageForm || 'Tablet',
        strength: med.strength || '',
        manufacturer: med.manufacturer || '',
        batchNumber: med.batchNumber || '',
        expiryDate: med.expiryDate ? med.expiryDate.split('T')[0] : '',
        unit: med.unit || 'Strips',
        price: med.price || 0,
        stockQty: med.stockQty || 0,
        minThreshold: med.minThreshold || 50,
        facilityId: med.facilityId || 'FAC-PHC-001',
        facilityName: med.facilityName || 'Primary Health Centre'
      });
    } else {
      setEditingMed(null);
      setForm({
        name: '', genericName: '', category: 'General Medicine', dosageForm: 'Tablet',
        strength: '', manufacturer: 'National Medical Depot', batchNumber: `BATCH-${new Date().getFullYear()}-${Math.floor(100+Math.random()*900)}`,
        expiryDate: '', unit: 'Strips', price: 0, stockQty: 0, minThreshold: 50,
        facilityId: 'FAC-PHC-001', facilityName: 'Primary Health Centre'
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingMed) {
        // Edit using stockAdjustment
        const payload = {
          medicineId: editingMed.id || editingMed._id,
          newQuantity: form.stockQty,
          reason: 'Admin Manual Edit',
          ...form
        };
        const res = await api.stockAdjustment(payload);
        if (res.success) {
          showToast(`Medicine updated successfully`);
          setShowForm(false);
          loadData();
        } else {
          showToast(res.message || 'Error updating medicine');
        }
      } else {
        // Create using stockIn
        const payload = {
          ...form,
          quantity: form.stockQty,
          supplier: form.manufacturer
        };
        const res = await api.stockIn(payload);
        if (res.success) {
          showToast(`Medicine created successfully`);
          setShowForm(false);
          loadData();
        } else {
          showToast(res.message || 'Error creating medicine');
        }
      }
    } catch (err) {
      showToast('Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (med) => {
    if (!window.confirm(`Are you sure you want to delete ${med.name}?`)) return;
    try {
      const res = await api.deleteMedicine(med.id || med._id);
      if (res.success) {
        showToast('Medicine deleted');
        loadData();
      } else {
        showToast(res.message || 'Error deleting medicine');
      }
    } catch (e) {
      showToast('Network error');
    }
  };

  // Filtered meds
  const filteredMeds = medicines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (m.genericName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (m.batchNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' ? true : 
                          filterStatus === 'LOW' ? (m.status === 'Low Stock' || m.status === 'Critical Low') :
                          filterStatus === 'OUT' ? m.status === 'Out of Stock' :
                          filterStatus === 'EXPIRED' ? m.status === 'Expired' : m.status === filterStatus;
    const matchesCategory = filterCategory === 'ALL' ? true : m.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <HeartbeatLoader text="Loading Medicine Infrastructure..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 'clamp(12px, 2.5vw, 20px)', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', background: '#0f172a', color: '#fff',
          padding: '12px 24px', borderRadius: '8px', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600
        }}>
          <CheckCircle size={18} color="#34d399" />
          {toast}
        </div>
      )}

      {/* Header Metrics */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '14px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #3b82f6', background: '#eff6ff' }}>
            <div style={{ fontSize: '0.8rem', color: '#1e3a8a', fontWeight: 700 }}>Total Medicines</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1d4ed8' }}>{metrics.totalItems || medicines.length}</div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
            <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 700 }}>Low Stock Alerts</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706' }}>{metrics.lowStockItems || medicines.filter(m=>m.status==='Low Stock' || m.status==='Critical Low').length}</div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #ef4444', background: '#fef2f2' }}>
            <div style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 700 }}>Out of Stock</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626' }}>{metrics.outOfStockItems || medicines.filter(m=>m.status==='Out of Stock').length}</div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #8b5cf6', background: '#f5f3ff' }}>
            <div style={{ fontSize: '0.8rem', color: '#5b21b6', fontWeight: 700 }}>Est. Stock Value</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#7c3aed' }}>
              ₹{medicines.reduce((acc, m) => acc + (m.stockQty * (m.price || 0)), 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tab-scroll" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('inventory')} style={{ 
          background: activeTab === 'inventory' ? '#0f172a' : 'transparent', color: activeTab === 'inventory' ? '#fff' : '#64748b', 
          border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
        }}>Inventory Catalog</button>
        <button onClick={() => setActiveTab('history')} style={{ 
          background: activeTab === 'history' ? '#0f172a' : 'transparent', color: activeTab === 'history' ? '#fff' : '#64748b', 
          border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
        }}>Stock Movement History</button>
      </div>

      {/* Main Content */}
      {activeTab === 'inventory' && (
        <div className="glass-panel" style={{ padding: 'clamp(14px, 2.5vw, 20px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', flex: '1 1 300px' }}>
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input 
                  type="text" 
                  placeholder="Search medicine, batch..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ padding: '8px 12px 8px 34px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', flex: '1 1 120px' }}>
                <option value="ALL">All Status</option>
                <option value="In Stock">In Stock</option>
                <option value="LOW">Low Stock</option>
                <option value="OUT">Out of Stock</option>
                <option value="EXPIRED">Expired</option>
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', flex: '1 1 140px' }}>
                <option value="ALL">All Categories</option>
                {[...new Set(medicines.map(m=>m.category))].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={() => handleOpenForm()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
              <Plus size={16} /> Register New Medicine
            </button>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px' }}>MEDICINE & BATCH</th>
                  <th style={{ padding: '12px' }}>CATEGORY & FORM</th>
                  <th style={{ padding: '12px' }}>FACILITY</th>
                  <th style={{ padding: '12px' }}>STOCK / MIN</th>
                  <th style={{ padding: '12px' }}>STATUS</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeds.map(med => (
                  <tr key={med.id || med._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{med.name} {med.strength && <span style={{ color: '#64748b', fontWeight: 500 }}>({med.strength})</span>}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{med.genericName} | {med.batchNumber}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{med.category}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{med.dosageForm}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 500, color: '#334155' }}>{med.facilityName}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{med.stockQty} {med.unit}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Min: {med.minThreshold}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
                        background: med.status === 'In Stock' || med.status === 'Adequate' ? '#dcfce7' : 
                                    med.status === 'Low Stock' || med.status === 'Critical Low' ? '#fef3c7' : 
                                    med.status === 'Out of Stock' ? '#fee2e2' : '#f1f5f9',
                        color: med.status === 'In Stock' || med.status === 'Adequate' ? '#16a34a' : 
                               med.status === 'Low Stock' || med.status === 'Critical Low' ? '#d97706' : 
                               med.status === 'Out of Stock' ? '#dc2626' : '#64748b'
                      }}>
                        {med.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button onClick={() => handleOpenForm(med)} style={{ background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', marginRight: '6px', cursor: 'pointer', color: '#334155' }}>
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(med)} style={{ background: 'transparent', border: '1px solid #fca5a5', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredMeds.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      <Package size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                      <div>No medicines found matching your criteria.</div>
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
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="glass-panel" style={{ padding: 'clamp(14px, 2.5vw, 20px)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>Stock Movement & Usage History</h3>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px' }}>TIMESTAMP & TXN ID</th>
                  <th style={{ padding: '12px' }}>MEDICINE & BATCH</th>
                  <th style={{ padding: '12px' }}>TYPE & REASON</th>
                  <th style={{ padding: '12px' }}>QTY CHG</th>
                  <th style={{ padding: '12px' }}>USER / PATIENT</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(txn => (
                  <tr key={txn.transactionId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{new Date(txn.timestamp).toLocaleString()}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{txn.transactionId}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{txn.medicineName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{txn.batchNumber}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800,
                        background: txn.type === 'IN' ? '#dcfce7' : txn.type === 'OUT' ? '#fee2e2' : '#fef3c7',
                        color: txn.type === 'IN' ? '#16a34a' : txn.type === 'OUT' ? '#dc2626' : '#d97706'
                      }}>
                        {txn.type}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{txn.reason || 'Dispensed'}</div>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 800, color: txn.type === 'IN' ? '#16a34a' : txn.type === 'OUT' ? '#dc2626' : '#d97706' }}>
                      {txn.type === 'IN' ? '+' : txn.type === 'OUT' ? '-' : ''}{txn.quantity}
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>{txn.previousQty} → {txn.newQty}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{txn.userName || txn.dispensedBy}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{txn.patientName ? `To: ${txn.patientName}` : (txn.userRole || 'Admin')}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '8px', textAlign: 'right' }}>
            ↔ Scroll horizontally to view all columns
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 'clamp(10px, 2.5vw, 20px)'
        }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '92vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ padding: 'clamp(14px, 2.5vw, 20px)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
              <h3 style={{ margin: 0, fontSize: 'clamp(1.05rem, 2.5vw, 1.2rem)', fontWeight: 800 }}>{editingMed ? 'Edit Medicine details & Stock' : 'Register New Medicine'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 'clamp(14px, 2.5vw, 20px)' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Medicine Name *</label>
                  <input required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Generic Name</label>
                  <input value={form.genericName} onChange={e=>setForm({...form, genericName: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Category *</label>
                  <select required value={form.category} onChange={e=>setForm({...form, category: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="Antibiotic">Antibiotic</option>
                    <option value="Analgesic / Antipyretic">Analgesic / Antipyretic</option>
                    <option value="Emergency Antidote">Emergency Antidote</option>
                    <option value="Maternal Health">Maternal Health</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Vaccine">Vaccine</option>
                    <option value="General Medicine">General Medicine</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Dosage Form</label>
                    <select value={form.dosageForm} onChange={e=>setForm({...form, dosageForm: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <option value="Tablet">Tablet</option><option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option><option value="Injection">Injection</option>
                      <option value="Ointment">Ointment</option><option value="Vials">Vials</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Strength</label>
                    <input value={form.strength} placeholder="e.g. 500mg" onChange={e=>setForm({...form, strength: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>
              </div>

              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>Inventory & Batch Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Batch Number *</label>
                  <input required value={form.batchNumber} onChange={e=>setForm({...form, batchNumber: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Expiry Date</label>
                  <input type="date" value={form.expiryDate} onChange={e=>setForm({...form, expiryDate: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Manufacturer/Supplier</label>
                  <input value={form.manufacturer} onChange={e=>setForm({...form, manufacturer: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: '14px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Current Stock *</label>
                  <input type="number" required min="0" value={form.stockQty} onChange={e=>setForm({...form, stockQty: Number(e.target.value)})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Min Alert Threshold</label>
                  <input type="number" min="0" value={form.minThreshold} onChange={e=>setForm({...form, minThreshold: Number(e.target.value)})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Unit</label>
                  <input value={form.unit} onChange={e=>setForm({...form, unit: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Price (₹)</label>
                  <input type="number" min="0" value={form.price} onChange={e=>setForm({...form, price: Number(e.target.value)})} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSaving} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isSaving ? <HeartbeatLoader size={16} color="#fff" /> : <Shield size={16} />}
                  {editingMed ? 'Save Changes' : 'Register Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Ensure CheckCircle is imported if used in toast
const CheckCircle = ({ size, color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);
