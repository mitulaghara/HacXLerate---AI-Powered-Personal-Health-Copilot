import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import HeartbeatLoader from './HeartbeatLoader';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Activity, Package, Clock, Filter, RefreshCw, Box, AlertCircle, FileText, Search } from 'lucide-react';

export default function AdminStockAnalytics({ currentUser }) {
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [logFilter, setLogFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [analyticsRes, auditRes] = await Promise.all([
        api.getDistrictStockAnalytics(),
        api.getAuditLogs({ limit: 150 })
      ]);
      
      if (analyticsRes.success) setAnalytics(analyticsRes.analytics);
      if (auditRes.success) setAuditLogs(auditRes.data || []);
    } catch (e) {
      console.error('Error fetching analytics:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <HeartbeatLoader text="Generating Stock Analytics & Audit Logs..." />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <AlertTriangle size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <h3>Failed to load Analytics</h3>
        <button onClick={() => loadData(true)} className="btn-primary" style={{ marginTop: '16px' }}>Retry</button>
      </div>
    );
  }

  const { summary, topConsumedMedicines, diseaseMedicineUsage, expiringSoonList, criticalStockMedicines } = analytics;

  // Filter audit logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesAction = logFilter === 'ALL' || log.action === logFilter;
    const matchesSearch = log.resource?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.actorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.patientId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.action?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div style={{ padding: 'clamp(12px, 2.5vw, 20px)', fontFamily: '"Inter", sans-serif', maxWidth: '1440px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.4rem)', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 color="#7c3aed" /> Stock Intelligence & Security Audit
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>Real-time aggregation of inventory flow, disease consumption, and administrative auditing.</p>
        </div>
        <button 
          onClick={() => loadData(true)} 
          style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center', fontWeight: 700, color: '#334155' }}
        >
          {refreshing ? <HeartbeatLoader size={16} color="#7c3aed" /> : <RefreshCw size={16} color="#7c3aed" />}
          Refresh Data
        </button>
      </div>

      {/* KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #3b82f6', background: '#eff6ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.8rem', color: '#1e3a8a', fontWeight: 700 }}>Total Medicines</div>
            <Package size={16} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1d4ed8' }}>{summary.totalMedicines}</div>
        </div>
        <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #10b981', background: '#ecfdf5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 700 }}>Total Stock Units</div>
            <Box size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#047857' }}>{summary.totalStockQty}</div>
        </div>
        <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 700 }}>Low Stock / OOS</div>
            <AlertTriangle size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706' }}>
            {summary.lowStockCount} <span style={{ fontSize: '1rem', color: '#b45309' }}>/ {summary.outOfStockCount}</span>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #ef4444', background: '#fef2f2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 700 }}>Expiring Soon / Expired</div>
            <Clock size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626' }}>
            {summary.expiringSoonCount} <span style={{ fontSize: '1rem', color: '#991b1b' }}>/ {summary.expiredCount}</span>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #8b5cf6', background: '#f5f3ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.8rem', color: '#5b21b6', fontWeight: 700 }}>Total Stock Value</div>
            <Activity size={16} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#7c3aed' }}>
            ₹{summary.totalStockValue?.toLocaleString('en-IN') || 0}
          </div>
        </div>
      </div>

      {/* Flow Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: 'clamp(14px, 2.5vw, 20px)', background: '#fff' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={18} color="#2563eb" /> Stock Movements
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Total Stock-In</span>
            <strong style={{ color: '#16a34a' }}>+ {summary.totalStockInUnits} Units</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Total Dispensed/Out</span>
            <strong style={{ color: '#dc2626' }}>- {summary.totalStockOutUnits} Units</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Manual Adjustments</span>
            <strong style={{ color: '#d97706' }}>{summary.totalAdjustmentEvents} Events</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Prescriptions Issued</span>
            <strong style={{ color: '#0f172a' }}>{summary.totalPrescriptionsIssued} Prescriptions</strong>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 'clamp(14px, 2.5vw, 20px)', background: '#fff' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={18} color="#ec4899" /> Top Disease Prescriptions
          </h3>
          {diseaseMedicineUsage.slice(0, 4).map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#334155' }}>{d.diseaseName}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Top: {d.topMedicines[0]?.name || 'N/A'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{d.prescriptionCount} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>Cases</span></div>
              </div>
            </div>
          ))}
          {diseaseMedicineUsage.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No prescription data available.</div>}
        </div>
      </div>

      {/* Split View: Top Consumed vs Critical Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '16px', marginBottom: '32px' }}>
        {/* Top Consumed Medicines */}
        <div className="glass-panel" style={{ padding: 'clamp(14px, 2.5vw, 20px)', background: '#fff' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={18} color="#10b981" /> Highest Consumed Medicines
          </h3>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '280px', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '8px' }}>Medicine Name</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Units Dispensed</th>
                </tr>
              </thead>
              <tbody>
                {topConsumedMedicines.map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 600, color: '#334155' }}>{m.medicineName}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{m.totalUnitsDispensed}</td>
                  </tr>
                ))}
                {topConsumedMedicines.length === 0 && (
                  <tr>
                    <td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No consumption data recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="glass-panel" style={{ padding: 'clamp(14px, 2.5vw, 20px)', background: '#fff' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={18} color="#ef4444" /> Critical Stock Alerts
          </h3>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '280px', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '8px' }}>Medicine & Facility</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Stock / Min</th>
                </tr>
              </thead>
              <tbody>
                {criticalStockMedicines.slice(0, 6).map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ fontWeight: 600, color: '#b45309' }}>{m.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.facilityName}</div>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: m.stockQty === 0 ? '#dc2626' : '#d97706' }}>{m.stockQty}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Min: {m.minThreshold}</div>
                    </td>
                  </tr>
                ))}
                {criticalStockMedicines.length === 0 && (
                  <tr>
                    <td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>All stock levels are optimal.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Facility-wise Stock Summary */}
      {analytics.facilityStockSummary && analytics.facilityStockSummary.length > 0 && (
        <div className="glass-panel" style={{ padding: 'clamp(14px, 2.5vw, 20px)', background: '#fff', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Box size={18} color="#8b5cf6" /> Facility-Wise Stock Summary
          </h3>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '550px', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px' }}>Facility Name</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Total Items</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Stock Units</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {analytics.facilityStockSummary.map((f, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: '#0f172a' }}>{f.facilityName}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#334155', fontWeight: 700 }}>{f.totalItems}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#16a34a', fontWeight: 800 }}>{f.totalStockQty}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#7c3aed', fontWeight: 800 }}>₹{f.stockValue.toLocaleString('en-IN')}</td>
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

      {/* Security & System Audit Logs */}
      <div className="glass-panel" style={{ padding: 'clamp(14px, 2.5vw, 20px)', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.2rem)', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="#7c3aed" /> Security & Admin Audit Trail
          </h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: '1 1 280px' }}>
            <div style={{ position: 'relative', flex: '1 1 180px' }}>
              <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input 
                type="text" 
                placeholder="Search logs..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px 8px 34px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <select value={logFilter} onChange={e => setLogFilter(e.target.value)} style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', flex: '1 1 140px' }}>
              <option value="ALL">All Actions</option>
              <option value="STOCK_ADJUSTMENT">Stock Adjustments</option>
              <option value="STOCK_IN">Stock In</option>
              <option value="DELETE_MEDICINE">Medicine Deletion</option>
              <option value="PATIENT_LOOKUP">Patient Lookups</option>
              <option value="LOGIN_SUCCESS">Logins</option>
              <option value="PRESCRIPTION_CREATED">Prescriptions</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px' }}>TIMESTAMP</th>
                <th style={{ padding: '12px' }}>ACTION</th>
                <th style={{ padding: '12px' }}>ACTOR / ROLE</th>
                <th style={{ padding: '12px' }}>TARGET RESOURCE</th>
                <th style={{ padding: '12px' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log._id || log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 600 }}>{new Date(log.timestamp).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800,
                      background: log.action.includes('DELETE') ? '#fee2e2' : log.action.includes('STOCK') ? '#e0e7ff' : '#f1f5f9',
                      color: log.action.includes('DELETE') ? '#dc2626' : log.action.includes('STOCK') ? '#4338ca' : '#475569'
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{log.actorName || log.actorId}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>{log.userRole || 'UNKNOWN'}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 500, color: '#334155' }}>{log.resource || 'System'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {log.patientId ? `Patient: ${log.patientId}` : ''}
                      {log.details && log.details.reason ? ` - ${log.details.reason}` : ''}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ color: log.status === 'SUCCESS' ? '#16a34a' : log.status === 'FAILURE' ? '#dc2626' : '#64748b', fontWeight: 700 }}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <FileText size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                    <div>No audit logs match your filters.</div>
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

      {/* DANGER ZONE */}
      <div className="glass-panel" style={{ padding: '24px', background: '#fef2f2', border: '1px solid #fecaca', marginTop: '32px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#991b1b', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={20} color="#dc2626" /> DANGER ZONE: System Factory Reset
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#7f1d1d', marginBottom: '20px', lineHeight: '1.5' }}>
          This action will <strong>permanently delete all system data</strong> including all Patients, Inventory, Stock Transactions, Dispensing Logs, Prescriptions, Audit Logs, and all Users (except Admin). This cannot be undone.
        </p>
        <button 
          onClick={() => {
            const pwd = window.prompt("Type your Admin password to permanently wipe all data:");
            if (pwd) {
              const confirmText = window.prompt("Type 'DELETE EVERYTHING' to confirm:");
              if (confirmText === 'DELETE EVERYTHING') {
                api.systemReset(pwd).then(res => {
                  if (res.success) {
                    alert('System has been completely wiped. Reloading application...');
                    window.location.reload();
                  } else {
                    alert(res.message || 'Factory reset failed.');
                  }
                }).catch(err => alert('Network error.'));
              } else {
                alert("Reset cancelled.");
              }
            }
          }}
          style={{
            background: '#dc2626', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px',
            fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.2)'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#b91c1c'}
          onMouseOut={e => e.currentTarget.style.background = '#dc2626'}
        >
          Erase All System Data
        </button>
      </div>

    </div>
  );
}
