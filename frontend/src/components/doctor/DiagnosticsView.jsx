import React, { useState, useEffect } from 'react';
import { ClipboardList, FileText, Search, Clock, CheckCircle, ExternalLink, Activity } from 'lucide-react';
import { api } from '../../utils/api';
import HeartbeatLoader from '../HeartbeatLoader';

export default function DiagnosticsView({ doctorId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await api.getDoctorPatients();
      if (res.success) {
        const allReports = [];
        const patientList = res.data || res.patients || [];
        patientList.forEach(p => {
          if (p.medicalHistory) {
            p.medicalHistory.forEach(record => {
              if (record.type === 'lab_report' || record.labReports) {
                const reportsArray = record.type === 'lab_report' ? [record] : record.labReports;
                reportsArray.forEach(r => {
                  allReports.push({
                    id: r._id || Math.random().toString(),
                    patientName: p.name || 'Patient',
                    patientId: p.id || p.patientId || 'PAT-RECORD',
                    testName: r.testName || r.title || record.diagnosis || 'Diagnostic Workup',
                    date: r.date || record.visitDate || record.date || new Date(),
                    status: r.status || 'COMPLETED',
                    resultUrl: r.url || r.fileUrl || null
                  });
                });
              }
            });
          }
        });
        setReports(allReports);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(r => 
    r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.testName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="diagnostics-workspace" style={{ padding: '16px 0', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <ClipboardList size={24} color="#0d9488" /> Diagnostics & Reports
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Review requested tests and uploaded diagnostic reports.</p>
        </div>
        <div style={{ position: 'relative', width: '100%', maxWidth: '320px', flex: '1 1 220px' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search patient, ID, or test..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <HeartbeatLoader />
        </div>
      ) : filteredReports.length === 0 ? (
        <div style={{ background: '#f8fafc', padding: '50px 20px', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
          <Activity size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#334155', margin: '0 0 8px 0' }}>No Reports Found</h3>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>There are no diagnostic reports matching your criteria.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '550px' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Patient</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Test Name</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Date</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{report.patientName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{report.patientId}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 500, color: '#334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={16} color="#0d9488" /> {report.testName}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569' }}>
                      {new Date(report.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ 
                        padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                        background: report.status === 'COMPLETED' ? '#f0fdf4' : '#fffbeb',
                        color: report.status === 'COMPLETED' ? '#16a34a' : '#d97706',
                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        {report.status === 'COMPLETED' ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {report.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {report.resultUrl ? (
                        <a href={report.resultUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f766e', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
                          View <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No File</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
