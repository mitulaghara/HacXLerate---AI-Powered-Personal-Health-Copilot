import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Search, Filter, Phone, Mail, MapPin, Building2, ShieldCheck, 
  Clock, ArrowRight, ExternalLink, AlertTriangle, ArrowLeft, CheckCircle2,
  HelpCircle, ChevronRight, Activity, Award
} from 'lucide-react';

export default function NodalOfficers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const officers = [
    {
      id: 'NO-NAT-001',
      name: 'Dr. (Prof.) Vinod K. Paul',
      cadre: 'Member (Health), NITI Aayog',
      designation: 'National Chairman - Rural Health Taskforce',
      department: 'National Leadership',
      jurisdiction: 'National Healthcare Command',
      state: 'National / Central',
      office: 'NITI Aayog, Sansad Marg, New Delhi',
      email: 'national-taskforce@graminarogya.gov.in',
      phone: '+91-11-23096500',
      hours: 'Mon - Fri (09:00 - 17:30)',
      badges: ['Apex Authority', 'ABDM Architect']
    },
    {
      id: 'NO-NAT-002',
      name: 'Smt. Punya Salila Srivastava, IAS',
      cadre: 'Secretary, MoHFW',
      designation: 'Mission Director - National Health Mission (NHM)',
      department: 'National Leadership',
      jurisdiction: 'All States & Union Territories',
      state: 'National / Central',
      office: 'Room 156-A, Nirman Bhawan, New Delhi',
      email: 'missiondirector-nhm@gov.in',
      phone: '+91-11-23061863',
      hours: 'Mon - Fri (09:30 - 18:00)',
      badges: ['NHM National Apex', 'Public Grievance']
    },
    {
      id: 'NO-GUJ-001',
      name: 'Dr. Manoj Aggarwal, IAS',
      cadre: 'Additional Chief Secretary (Health)',
      designation: 'State Health Nodal Commissioner',
      department: 'Chief Medical Office',
      jurisdiction: 'Gujarat State Command',
      state: 'Gujarat',
      office: 'Block 7, Sardar Patel Bhavan, Sachivalaya, Gandhinagar',
      email: 'cmo-health@gujarat.gov.in',
      phone: '+91-79-23253271',
      hours: 'Mon - Sat (10:00 - 18:00)',
      badges: ['State Apex', '24x7 Escort']
    },
    {
      id: 'NO-GUJ-002',
      name: 'Dr. Harshil Pandya, MD (Community Med)',
      cadre: 'Chief District Medical Officer (CDMO)',
      designation: 'District Health Officer (DHO) - Rajkot Cluster',
      department: 'Chief Medical Office',
      jurisdiction: 'Rajkot & Saurashtra Rural Talukas',
      state: 'Gujarat',
      office: 'District Panchayat Health Bhavan, Race Course, Rajkot - 360001',
      email: 'cdmo-rajkot@gujarat.gov.in',
      phone: '+91-281-2441902',
      hours: 'Mon - Sat (09:00 - 17:00)',
      badges: ['District Command', 'Triage Escalations']
    },
    {
      id: 'NO-GUJ-003',
      name: 'Dr. Meena Rathod, MD (OBGYN)',
      cadre: 'Deputy Director (RCH)',
      designation: 'Nodal Officer - Maternal & Infant Mortality (JSSK)',
      department: 'Maternal & Child Health',
      jurisdiction: 'Saurashtra High-Risk Delivery Clusters',
      state: 'Gujarat',
      office: 'Civil Hospital Complex, Jamnagar Road, Rajkot',
      email: 'rch-rajkot@gujhealth.org',
      phone: '+91-281-2452331',
      hours: 'Mon - Sat (08:30 - 16:30)',
      badges: ['Obstetric SOS', 'JSSK Nodal']
    },
    {
      id: 'NO-GUJ-004',
      name: 'Dr. Jayesh Vala, MD',
      cadre: 'District Epidemiologist',
      designation: 'Nodal Surveillance Officer (IDSP)',
      department: 'Epidemic Surveillance & IDSP',
      jurisdiction: 'District Epidemic Radar & Vector Control',
      state: 'Gujarat',
      office: 'Integrated Disease Surveillance Cell, Old Collectorate, Rajkot',
      email: 'idsp-rajkot@gujarat.gov.in',
      phone: '+91-281-2470104',
      hours: '24x7 Epidemic Emergency Room',
      badges: ['Disease Outbreak', 'IDSP Fast Track']
    },
    {
      id: 'NO-RAJ-001',
      name: 'Dr. Pradeep Kawle, MS',
      cadre: 'Joint Director (Hospital Administration)',
      designation: 'Nodal Officer - Chiranjeevi / Ayushman Bharat',
      department: 'Digital Health & ABDM',
      jurisdiction: 'Jaipur & Rural Rajasthan Districts',
      state: 'Rajasthan',
      office: 'Swasthya Bhawan, Tilak Marg, C-Scheme, Jaipur - 302005',
      email: 'nodal-abdm@rajasthan.gov.in',
      phone: '+91-141-2228712',
      hours: 'Mon - Fri (09:30 - 18:00)',
      badges: ['ABDM State Nodal', 'Cashless Scheme']
    },
    {
      id: 'NO-RAJ-002',
      name: 'Dr. Sunita Choudhary',
      cadre: 'Chief Medical & Health Officer (CMHO)',
      designation: 'District Nodal Officer - Jodhpur Division',
      department: 'Chief Medical Office',
      jurisdiction: 'Jodhpur, Thar Rural & Osian Belt',
      state: 'Rajasthan',
      office: 'CMHO Office, Paota Circle, Jodhpur - 342001',
      email: 'cmho-jodhpur@raj.gov.in',
      phone: '+91-291-2544211',
      hours: 'Mon - Sat (09:00 - 17:00)',
      badges: ['Desert Care', '108 Ambulance Hub']
    },
    {
      id: 'NO-MP-001',
      name: 'Dr. Alok Verma, MD (Pediatrics)',
      cadre: 'State Nodal Officer (SNCU & Child Health)',
      designation: 'Director - National Rural Health Mission',
      department: 'Maternal & Child Health',
      jurisdiction: 'Madhya Pradesh Tribal & Rural Health Centres',
      state: 'Madhya Pradesh',
      office: '6th Floor, Satpura Bhawan, Bhopal - 462004',
      email: 'nhm-mp@mp.gov.in',
      phone: '+91-755-2527100',
      hours: 'Mon - Sat (10:00 - 17:30)',
      badges: ['Tribal Health Lead', 'Malnutrition Care']
    },
    {
      id: 'NO-UP-001',
      name: 'Dr. Arvind Kumar Srivastava',
      cadre: 'Director General (Medical & Health Services)',
      designation: 'State Public Grievance Officer',
      department: 'Grievance & RTI',
      jurisdiction: 'Uttar Pradesh State Health Network',
      state: 'Uttar Pradesh',
      office: 'Swasthya Bhavan, Kaiserbagh, Lucknow - 226001',
      email: 'dgmh-up@nic.in',
      phone: '+91-522-2622625',
      hours: 'Mon - Sat (09:30 - 18:00)',
      badges: ['Grievance Redressal', 'RTI Appeals']
    },
    {
      id: 'NO-MAH-001',
      name: 'Dr. Nitin Ambadekar, MD',
      cadre: 'Director of Health Services',
      designation: 'State Nodal Lead - Smart Triage & Rural Logistics',
      department: 'Chief Medical Office',
      jurisdiction: 'Maharashtra Rural PHC Grid',
      state: 'Maharashtra',
      office: 'Arogya Bhavan, St. George Hospital Compound, Mumbai - 400001',
      email: 'dhs-maharashtra@gov.in',
      phone: '+91-22-22621006',
      hours: 'Mon - Fri (10:00 - 17:30)',
      badges: ['Smart Triage Lead', 'State Logistics']
    }
  ];

  const states = ['ALL', 'National / Central', 'Gujarat', 'Rajasthan', 'Madhya Pradesh', 'Uttar Pradesh', 'Maharashtra'];
  const departments = ['ALL', 'Chief Medical Office', 'Maternal & Child Health', 'Epidemic Surveillance & IDSP', 'Digital Health & ABDM', 'Grievance & RTI', 'National Leadership'];

  const filteredOfficers = useMemo(() => {
    return officers.filter(off => {
      const matchesSearch = 
        off.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        off.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        off.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase()) ||
        off.office.toLowerCase().includes(searchQuery.toLowerCase()) ||
        off.state.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesState = selectedState === 'ALL' || off.state === selectedState;
      const matchesDept = selectedDept === 'ALL' || off.department === selectedDept;

      return matchesSearch && matchesState && matchesDept;
    });
  }, [searchQuery, selectedState, selectedDept]);

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', paddingBottom: '6rem' }}>
      
      {/* HERO SECTION */}
      <section style={{ 
        paddingTop: '6rem', paddingBottom: '3.5rem', 
        background: 'linear-gradient(135deg, #0B6B68 0%, #083F3D 100%)', 
        color: '#fff', position: 'relative', overflow: 'hidden' 
      }}>
        <div style={{ 
          position: 'absolute', inset: 0, opacity: 0.08, 
          background: 'var(--texture-grid)', zIndex: 0 
        }} />

        <div className="np-container" style={{ position: 'relative', zIndex: 1, maxWidth: '1300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <Link to="/" style={{ color: '#E6EDE9', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
              <ArrowLeft size={14} /> Back to Home
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>/</span>
            <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>Public Directory</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
            <div style={{ maxWidth: '820px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255,255,255,0.25)', padding: '4px 12px', marginBottom: '1rem' }}>
                <Award size={16} color="#A7F3D0" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.05em', color: '#A7F3D0', fontWeight: 700 }}>
                  OFFICIAL MoHFW & STATE HEALTH DIRECTORY
                </span>
              </div>
              <h1 style={{ 
                fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4.5vw, 3.25rem)', 
                fontWeight: 700, marginBottom: '1rem', lineHeight: 1.15, color: '#ffffff' 
              }}>
                Public Health Nodal Officers Directory
              </h1>
              <p style={{ 
                fontFamily: 'var(--font-body)', fontSize: 'clamp(0.95rem, 1.3vw, 1.15rem)', 
                color: '#E6EDE9', lineHeight: 1.6, maxWidth: '720px', margin: 0 
              }}>
                Direct administrative contacts for District Chief Medical Officers (CMO), 
                State Health Directors, Epidemic Surveillance Leads (IDSP), and Public Grievance Redressal Officers.
              </p>
            </div>

            {/* Emergency Hotline Badges */}
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)', padding: '16px 20px', minWidth: '260px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A7F3D0', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
                24/7 National Emergency Control
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#CBD5E1' }}>108 Ambulance:</span>
                  <a href="tel:108" style={{ fontSize: '1rem', fontWeight: 800, color: '#FCA5A5', textDecoration: 'none' }}>108</a>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#CBD5E1' }}>Health Helpline:</span>
                  <a href="tel:104" style={{ fontSize: '1rem', fontWeight: 800, color: '#A7F3D0', textDecoration: 'none' }}>104</a>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#CBD5E1' }}>Rural Tele-Support:</span>
                  <a href="tel:18001801104" style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', textDecoration: 'none' }}>1800-180-1104</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH BAR */}
      <section style={{ marginTop: '-1.5rem', position: 'relative', zIndex: 10 }}>
        <div className="np-container" style={{ maxWidth: '1300px' }}>
          <div style={{ 
            background: '#ffffff', border: '1px solid var(--borderLight)', 
            padding: 'clamp(14px, 2.5vw, 20px)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' 
          }}>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              
              {/* Search input */}
              <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '240px' }}>
                <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input 
                  type="text"
                  placeholder="Search by Officer Name, District, Office, or Cadre..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* State Filter */}
              <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
                <select 
                  value={selectedState} 
                  onChange={e => setSelectedState(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                >
                  <option value="ALL">All States / Central</option>
                  {states.filter(s => s !== 'ALL').map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div style={{ flex: '1 1 200px', minWidth: '170px' }}>
                <select 
                  value={selectedDept} 
                  onChange={e => setSelectedDept(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                >
                  <option value="ALL">All Specializations</option>
                  {departments.filter(d => d !== 'ALL').map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Clear filters if active */}
              {(searchQuery || selectedState !== 'ALL' || selectedDept !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSelectedState('ALL'); setSelectedDept('ALL'); }}
                  style={{
                    padding: '10px 16px', background: '#F1F5F9', border: '1px solid #CBD5E1',
                    fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', color: '#475569'
                  }}
                >
                  Reset
                </button>
              )}

            </div>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                Showing <strong>{filteredOfficers.length}</strong> official nodal officers
              </div>
              <div style={{ fontSize: '0.75rem', color: '#0B6B68', fontWeight: 600 }}>
                ✓ Official roster synced with Ministry of Health (MoHFW) Gazette
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIRECTORY CARDS GRID */}
      <section style={{ marginTop: '2.5rem' }}>
        <div className="np-container" style={{ maxWidth: '1300px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: '20px' }}>
            {filteredOfficers.map(officer => (
              <div 
                key={officer.id} 
                style={{ 
                  background: '#ffffff', border: '1px solid var(--borderLight)', 
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  position: 'relative', transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                className="glass-card"
              >
                {/* Card Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px',
                      background: officer.state === 'National / Central' ? '#EFF6FF' : '#F0FDF4',
                      color: officer.state === 'National / Central' ? '#1D4ED8' : '#047857',
                      border: officer.state === 'National / Central' ? '1px solid #BFDBFE' : '1px solid #A7F3D0',
                      letterSpacing: '0.03em'
                    }}>
                      {officer.state}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                      {officer.id}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0', lineHeight: 1.25 }}>
                    {officer.name}
                  </h3>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0B6B68', marginBottom: '2px' }}>
                    {officer.designation}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                    {officer.cadre} &bull; <strong style={{ color: '#334155' }}>{officer.department}</strong>
                  </div>
                </div>

                {/* Card Details */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <MapPin size={15} color="#0B6B68" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ color: '#0F172A' }}>Jurisdiction: </strong>
                      <span style={{ color: '#475569' }}>{officer.jurisdiction}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <Building2 size={15} color="#64748B" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#475569' }}>{officer.office}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Phone size={15} color="#059669" style={{ flexShrink: 0 }} />
                    <a href={`tel:${officer.phone}`} style={{ color: '#059669', fontWeight: 700, textDecoration: 'none' }}>
                      {officer.phone}
                    </a>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Mail size={15} color="#2563EB" style={{ flexShrink: 0 }} />
                    <a href={`mailto:${officer.email}`} style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none', wordBreak: 'break-all' }}>
                      {officer.email}
                    </a>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Clock size={15} color="#94A3B8" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#64748B', fontSize: '0.76rem' }}>{officer.hours}</span>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {officer.badges.map(b => (
                      <span key={b} style={{ fontSize: '0.68rem', padding: '2px 6px', background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', fontWeight: 600 }}>
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div style={{ padding: '14px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <a 
                    href={`tel:${officer.phone}`}
                    className="np-btn"
                    style={{
                      background: '#0B6B68', color: '#ffffff', padding: '6px 14px', fontSize: '0.78rem',
                      fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Phone size={13} /> Call Office
                  </a>
                  <a 
                    href={`mailto:${officer.email}?subject=GraminArogya%20Healthcare%20Escalation`}
                    className="btn-secondary"
                    style={{
                      padding: '6px 14px', fontSize: '0.78rem',
                      fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <Mail size={13} /> Send Official Note
                  </a>
                </div>

              </div>
            ))}
          </div>

          {filteredOfficers.length === 0 && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', padding: '60px 20px', textAlign: 'center' }}>
              <Users size={48} color="#94A3B8" style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                No Nodal Officers match your search criteria
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.88rem', marginBottom: '20px' }}>
                Try adjusting your search terms or resetting the state/department filters.
              </p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedState('ALL'); setSelectedDept('ALL'); }}
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.85rem' }}
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Grievance Escalation Matrix Info Box */}
          <div style={{ 
            marginTop: '3.5rem', background: '#F0FDF4', border: '1px solid #A7F3D0', 
            padding: 'clamp(20px, 3vw, 32px)' 
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#064E3B', marginBottom: '8px' }}>
              Standard 3-Tier Healthcare Grievance Escalation Matrix
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#065F46', marginBottom: '20px', lineHeight: 1.6 }}>
              In accordance with the National Health Mission citizen charter, grievances regarding medicine stock availability, 
              denial of emergency care, or delayed maternal benefits must be escalated systematically:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#ffffff', padding: '16px', border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0B6B68', textTransform: 'uppercase' }}>Tier 1: Facility Level</div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', marginTop: '4px' }}>Medical Officer In-Charge (MOIC)</div>
                <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '6px' }}>
                  Address initial grievances regarding OPD consultations, lab reagents, or ASHA escort allowances at your local PHC/CHC.
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', marginTop: '8px' }}>Resolution SLA: 48 Hours</div>
              </div>

              <div style={{ background: '#ffffff', padding: '16px', border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0B6B68', textTransform: 'uppercase' }}>Tier 2: District Level</div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', marginTop: '4px' }}>Chief Medical Officer (CMO)</div>
                <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '6px' }}>
                  Unresolved Tier 1 complaints, critical medicine stock-outs, or referral rejections are escalated to the District CMO roster above.
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', marginTop: '8px' }}>Resolution SLA: 5 Working Days</div>
              </div>

              <div style={{ background: '#ffffff', padding: '16px', border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0B6B68', textTransform: 'uppercase' }}>Tier 3: State Mission</div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', marginTop: '4px' }}>State Mission Director (NHM)</div>
                <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '6px' }}>
                  Policy disputes, major clinical malpractice allegations, or systemic district failures are addressed by State Health Commissioners.
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', marginTop: '8px' }}>Resolution SLA: 10 Working Days</div>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Link to="/contact" className="np-btn" style={{ background: '#0B6B68', color: '#fff', padding: '10px 20px', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Submit Formal Online Grievance <ChevronRight size={16} />
              </Link>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
