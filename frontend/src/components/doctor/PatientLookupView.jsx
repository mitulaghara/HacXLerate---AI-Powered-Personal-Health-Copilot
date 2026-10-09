import React, { useState } from 'react';
import { Search, Phone, QrCode, ScanLine, FileText, User, ArrowRight, UserCheck, Shield, Activity, MapPin, AlertTriangle } from 'lucide-react';
import { api } from '../../utils/api';
import { QRCodeSVG } from 'qrcode.react';
import HeartbeatLoader from '../HeartbeatLoader';

export default function PatientLookupView({ onPatientFound }) {
  const [searchMethod, setSearchMethod] = useState('mobile'); // 'mobile', 'ssc', 'id', 'qr'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [foundPatient, setFoundPatient] = useState(null);
  
  // Fake scanner state for QR
  const [isScanning, setIsScanning] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery || searchQuery.trim().length < 4) {
      setErrorMsg('Please enter a valid search query.');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    setFoundPatient(null);
    
    try {
      let res;
      if (searchMethod === 'mobile') {
        res = await api.searchPatientByMobile(searchQuery);
      } else if (searchMethod === 'ssc') {
        res = await api.searchPatientBySsc(searchQuery);
      } else if (searchMethod === 'id') {
        res = await api.searchPatientByClient(searchQuery);
      } else if (searchMethod === 'qr') {
        res = await api.lookupPatientByQr(searchQuery); 
      }
      
      if (res && res.success && res.patients && res.patients.length > 0) {
        setFoundPatient(res.patients[0]);
      } else if (res && res.success && res.data && res.data.length > 0) {
        setFoundPatient(res.data[0]);
      } else if (res && res.success && res.patient) {
        setFoundPatient(res.patient);
      } else {
        if (searchMethod === 'mobile') {
          const fallbackRes = await api.lookupPatientByPhone(searchQuery);
          if (fallbackRes && fallbackRes.success && fallbackRes.count > 0 && fallbackRes.patients) {
            setFoundPatient(fallbackRes.patients[0]);
          } else {
            setErrorMsg(`No patient records found for ${searchMethod}: ${searchQuery}`);
          }
        } else {
          setErrorMsg(`No patient records found for ${searchMethod}: ${searchQuery}`);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error searching for patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const simulateQRScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setSearchQuery('SEC-QR-SAMPLE-1234');
      setErrorMsg('QR Scanned. Click Search to fetch records.');
    }, 1500);
  };

  return (
    <div className="patient-lookup-view" style={{ padding: '20px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        .lookup-tab-group {
          display: flex;
          gap: 10px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .lookup-form {
          display: flex;
          gap: 12px;
          width: 100%;
        }
        .lookup-card-header {
          padding: 20px 24px;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        @media (max-width: 640px) {
          .lookup-tab-group button {
            flex: 1 1 calc(50% - 10px);
            justify-content: center;
            padding: 8px 12px !important;
            font-size: 0.8rem !important;
          }
          .lookup-form {
            flex-direction: column !important;
          }
          .lookup-form button {
            width: 100% !important;
            min-height: 44px !important;
            justify-content: center !important;
          }
          .lookup-card-header {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 16px !important;
          }
          .lookup-card-header button {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Search size={22} color="#0d9488" /> Patient Lookup & Verification
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>
        Securely search and access patient medical records using verified identifiers.
      </p>

      {/* Lookup Methods Tabs */}
      <div className="lookup-tab-group">
        {[
          { id: 'mobile', label: 'Mobile Number', icon: <Phone size={16} /> },
          { id: 'ssc', label: 'State ID (SSC)', icon: <Shield size={16} /> },
          { id: 'id', label: 'Patient ID', icon: <User size={16} /> },
          { id: 'qr', label: 'Scan Health QR', icon: <QrCode size={16} /> }
        ].map(method => (
          <button
            key={method.id}
            onClick={() => { setSearchMethod(method.id); setSearchQuery(''); setErrorMsg(''); setFoundPatient(null); }}
            style={{
              padding: '10px 16px',
              background: searchMethod === method.id ? '#f0fdf4' : '#f8fafc',
              border: `1px solid ${searchMethod === method.id ? '#10b981' : '#e2e8f0'}`,
              borderRadius: '8px',
              color: searchMethod === method.id ? '#0f766e' : '#475569',
              fontWeight: searchMethod === method.id ? 700 : 500,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              minHeight: '40px'
            }}
          >
            {method.icon} {method.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px', flexDirection: 'column', maxWidth: '640px', width: '100%' }}>
        {searchMethod === 'qr' ? (
          <div style={{ 
            border: '2px dashed #cbd5e1', 
            borderRadius: '12px', 
            padding: '24px 16px', 
            textAlign: 'center',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ScanLine size={48} color={isScanning ? "#0d9488" : "#94a3b8"} style={{ marginBottom: '12px', animation: isScanning ? 'pulse 1.5s infinite' : 'none' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: '#1e293b' }}>
              {isScanning ? 'Scanning QR Code...' : 'Ready to Scan Health Card QR'}
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: '#64748b', maxWidth: '300px' }}>
              Hold patient QR code in front of camera or scanner to auto-load clinical records.
            </p>
            <button
              onClick={simulateQRScan}
              disabled={isScanning}
              style={{
                padding: '10px 20px',
                background: '#0f766e',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: isScanning ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: '44px'
              }}
            >
              {isScanning ? <HeartbeatLoader size="small" /> : <QrCode size={16} />}
              {isScanning ? 'Reading Data...' : 'Scan Patient QR'}
            </button>
            {searchQuery && !isScanning && (
              <div style={{ width: '100%', marginTop: '16px' }}>
                <input 
                  type="text" 
                  value={searchQuery}
                  readOnly
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #10b981', background: '#f0fdf4', color: '#0f766e', fontWeight: 600, textAlign: 'center', boxSizing: 'border-box' }}
                />
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSearch} className="lookup-form">
            <div style={{ flex: 1, position: 'relative', width: '100%' }}>
              <Search size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder={
                  searchMethod === 'mobile' ? "Enter 10-digit mobile number..." : 
                  searchMethod === 'ssc' ? "Enter State Health Code (e.g., SSC-GJ-2026)..." : 
                  "Enter GraminArogya Patient ID..."
                }
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                  minHeight: '44px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !searchQuery}
              style={{
                padding: '0 20px',
                background: '#0d9488',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: loading || !searchQuery ? 'not-allowed' : 'pointer',
                opacity: loading || !searchQuery ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '44px',
                transition: 'all 0.2s'
              }}
            >
              {loading ? <HeartbeatLoader size="small" /> : <Search size={18} />}
              Search
            </button>
          </form>
        )}

        {searchMethod === 'qr' && searchQuery && !isScanning && (
          <button 
            onClick={handleSearch} 
            disabled={loading}
            style={{
              padding: '12px',
              background: '#0d9488',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              minHeight: '44px'
            }}
          >
            {loading ? <HeartbeatLoader size="small" /> : 'Retrieve QR Profile'}
          </button>
        )}

        {errorMsg && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} /> {errorMsg}
          </div>
        )}
      </div>

      {/* Patient Summary Card */}
      {foundPatient && (
        <div style={{ marginTop: '28px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <div className="lookup-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f0fdf4', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <UserCheck size={24} color="#0d9488" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{foundPatient.name}</h3>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: '#64748b', marginTop: '2px', fontWeight: 500, flexWrap: 'wrap' }}>
                  <span>ID: <strong>{foundPatient.id || foundPatient.patientId || 'N/A'}</strong></span>
                  <span>•</span>
                  <span>{foundPatient.age} Yrs, {foundPatient.gender}</span>
                  {foundPatient.bloodGroup && (
                    <>
                      <span>•</span>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>{foundPatient.bloodGroup}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => onPatientFound && onPatientFound(foundPatient.id || foundPatient.patientId || foundPatient._id)}
              style={{
                padding: '10px 18px',
                background: '#0f172a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
                minHeight: '44px'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#1e293b'}
              onMouseOut={(e) => e.currentTarget.style.background = '#0f172a'}
            >
              Open Medical Record <ArrowRight size={16} />
            </button>
          </div>

          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>Location</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 500, color: '#334155' }}>
                <MapPin size={16} color="#0d9488" /> {foundPatient.village || foundPatient.address?.villageTown || 'Unknown'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>Contact</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 500, color: '#334155' }}>
                <Phone size={16} color="#0d9488" /> {foundPatient.phone || 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>Known Allergies</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: foundPatient.knownAllergies?.length > 0 ? '#ef4444' : '#334155' }}>
                {foundPatient.knownAllergies?.length > 0 ? foundPatient.knownAllergies.join(', ') : 'None Reported'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>Last Chief Complaint</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#334155' }}>
                {foundPatient.chiefComplaint || 'Routine Checkup'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
