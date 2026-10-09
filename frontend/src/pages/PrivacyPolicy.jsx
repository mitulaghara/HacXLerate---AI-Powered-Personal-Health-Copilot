import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Lock, Eye, FileText, Database, Server, UserCheck, 
  AlertCircle, CheckCircle2, ChevronRight, Download, Printer, ArrowLeft,
  Phone, Mail, MapPin, ExternalLink, RefreshCw
} from 'lucide-react';

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('data-collection');

  const sections = [
    { id: 'introduction', label: '1. Executive Overview & Scope' },
    { id: 'data-collection', label: '2. Health Data & PII Collected' },
    { id: 'purpose', label: '3. Clinical & Operational Purpose' },
    { id: 'abdm-compliance', label: '4. ABDM & DPDP Compliance' },
    { id: 'security', label: '5. Encryption & Storage Protocols' },
    { id: 'role-access', label: '6. Role-Based Access Isolation' },
    { id: 'rights', label: '7. Patient Rights & Consent Revocation' },
    { id: 'grievance', label: '8. Data Protection Officer (DPO)' }
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', paddingBottom: '6rem' }}>
      
      {/* HERO SECTION */}
      <section style={{ 
        paddingTop: '6rem', paddingBottom: '3.5rem', 
        background: 'linear-gradient(135deg, #0B6B68 0%, #064E4B 100%)', 
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
            <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>Legal & Governance</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
            <div style={{ maxWidth: '820px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255,255,255,0.25)', padding: '4px 12px', marginBottom: '1rem' }}>
                <ShieldCheck size={16} color="#A7F3D0" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.05em', color: '#A7F3D0', fontWeight: 700 }}>
                  DPDP ACT 2023 & ABDM CERTIFIED PROTOCOL
                </span>
              </div>
              <h1 style={{ 
                fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4.5vw, 3.25rem)', 
                fontWeight: 700, marginBottom: '1rem', lineHeight: 1.15, color: '#ffffff' 
              }}>
                Privacy & Health Data Protection Policy
              </h1>
              <p style={{ 
                fontFamily: 'var(--font-body)', fontSize: 'clamp(0.95rem, 1.3vw, 1.15rem)', 
                color: '#E6EDE9', lineHeight: 1.6, maxWidth: '720px', margin: 0 
              }}>
                GraminArogya enforces stringent patient data sovereignty, zero unauthorized third-party sharing, 
                and bank-grade AES-256 encryption across all village health centres, ASHA tablets, and referral pipelines.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={handlePrint}
                className="np-btn"
                style={{ 
                  background: '#ffffff', color: '#0B6B68', border: '1px solid #ffffff', 
                  padding: '10px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', 
                  gap: '8px', cursor: 'pointer', fontSize: '0.85rem' 
                }}
              >
                <Printer size={16} /> Print / Save PDF
              </button>
              <Link 
                to="/contact"
                className="np-btn"
                style={{ 
                  background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', 
                  padding: '10px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', 
                  gap: '8px', textDecoration: 'none', fontSize: '0.85rem' 
                }}
              >
                <Mail size={16} /> Contact DPO
              </Link>
            </div>
          </div>

          {/* Quick Compliance Badges Strip */}
          <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '12px', marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.15)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={18} color="#A7F3D0" />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>End-to-End Encrypted</div>
                <div style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>TLS 1.3 in transit, AES-256 at rest</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserCheck size={18} color="#A7F3D0" />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>Explicit Consent Driven</div>
                <div style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>Citizen consent required for intake</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Server size={18} color="#A7F3D0" />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>Sovereign Storage</div>
                <div style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>100% Indian Data Centres (MeitY)</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RefreshCw size={18} color="#A7F3D0" />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>Offline Cache Isolation</div>
                <div style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>Auto-purged post cloud sync</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN DOCUMENT BODY */}
      <section style={{ marginTop: '2rem' }}>
        <div className="np-container" style={{ maxWidth: '1300px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2.5rem', alignItems: 'start' }} className="mobile-grid-1">
            
            {/* SIDEBAR NAVIGATION */}
            <aside style={{ 
              background: '#ffffff', border: '1px solid var(--borderLight)', 
              padding: '1.5rem', position: 'sticky', top: '90px' 
            }} className="mobile-hidden">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--mutedForeground)', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                TABLE OF CONTENTS
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {sections.map(s => {
                  const isActive = activeSection === s.id;
                  return (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      onClick={() => setActiveSection(s.id)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.82rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#0B6B68' : '#475569',
                        background: isActive ? '#F0FDF4' : 'transparent',
                        borderLeft: isActive ? '3px solid #0B6B68' : '3px solid transparent',
                        textDecoration: 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {s.label}
                    </a>
                  );
                })}
              </nav>

              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--borderLight)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px' }}>
                  Document Metadata
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--mutedForeground)', lineHeight: 1.5 }}>
                  Version: 3.2 (Gazetted)<br />
                  Effective: September 2026<br />
                  Audited by: CERT-In Certified Auditor
                </div>
              </div>
            </aside>

            {/* DOCUMENT CONTENT */}
            <article style={{ background: '#ffffff', border: '1px solid var(--borderLight)', padding: 'clamp(1.5rem, 4vw, 3rem)' }}>
              
              {/* SECTION 1 */}
              <div id="introduction" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', borderBottom: '2px solid #0B6B68', paddingBottom: '0.5rem' }}>
                  1. Executive Overview & Scope
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, marginBottom: '1rem' }}>
                  GraminArogya is a national digital health mission initiative engineered to bring high-acuity healthcare triage, 
                  continuous medical record synchronization, and emergency routing to rural and remote populations. This Privacy Policy 
                  articulates our unwavering commitment to protecting individual health telemetry, ABHA identifiers, and personal biometric data.
                </p>
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7 }}>
                  This policy applies to all registered patients, ASHA frontline workers, Auxiliary Nurse Midwives (ANMs), Community Health 
                  Officers (CHOs), Medical Officers, District Hospital administrators, and general citizens interacting with the GraminArogya portal, 
                  mobile application, or tele-consultation channels.
                </p>
              </div>

              {/* SECTION 2 */}
              <div id="data-collection" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', borderBottom: '2px solid #0B6B68', paddingBottom: '0.5rem' }}>
                  2. Health Data & Personal Information Collected
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                  To deliver accurate screening and prevent maternal, infant, and epidemic complications, GraminArogya processes specific categories 
                  of health data strictly under clinician or ASHA worker supervision:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '1.5rem' }}>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A', marginBottom: '6px' }}>Patient Identity & ABHA</div>
                    <ul style={{ fontSize: '0.8rem', color: '#475569', paddingLeft: '18px', lineHeight: 1.6, margin: 0 }}>
                      <li>Full Legal Name & Age</li>
                      <li>14-digit ABHA ID & QR Code</li>
                      <li>Contact Mobile & Village Cluster</li>
                      <li>Emergency Next-of-Kin Contact</li>
                    </ul>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A', marginBottom: '6px' }}>Clinical Vitals & Triage</div>
                    <ul style={{ fontSize: '0.8rem', color: '#475569', paddingLeft: '18px', lineHeight: 1.6, margin: 0 }}>
                      <li>Blood Pressure & Heart Rate (BPM)</li>
                      <li>SpO2 & Random Blood Sugar (mg/dL)</li>
                      <li>Hemoglobin (Hb g/dL) for Anemia Alert</li>
                      <li>Risk Level Category (Green/Yellow/Red)</li>
                    </ul>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A', marginBottom: '6px' }}>Emergency Geolocation</div>
                    <ul style={{ fontSize: '0.8rem', color: '#475569', paddingLeft: '18px', lineHeight: 1.6, margin: 0 }}>
                      <li>Live GPS coordinates during 108 SOS</li>
                      <li>Sub-Centre to District Hospital route calculation</li>
                      <li>Offline field coordinates prior to central sync</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* SECTION 3 */}
              <div id="purpose" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', borderBottom: '2px solid #0B6B68', paddingBottom: '0.5rem' }}>
                  3. Clinical & Operational Purpose of Processing
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, marginBottom: '1rem' }}>
                  We explicitly declare that GraminArogya <strong>does not commercialize, monetize, or license</strong> patient health records 
                  to private insurers, pharmaceutical marketers, or third-party data brokers. Data processing is exclusively restricted to:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { title: 'Continuity of Rural Care', desc: 'Allowing Community Health Centres and visiting Doctors to instantly access longitudinal vitals and past prescriptions.' },
                    { title: 'Algorithmic Early Triage', desc: 'Classifying patients into Red/Yellow/Green triage states based on WHO/ICMR clinical criteria to avoid preventable maternal and cardiovascular mortality.' },
                    { title: 'Epidemic Radar Surveillance', desc: 'Anonymized aggregation of fever clusters to trigger district-level epidemic containment before outbreaks spread.' },
                    { title: 'Emergency Golden Hour Dispatch', desc: 'Transmitting patient triage state and live GPS coordinates to the nearest available 108 emergency response vehicle.' }
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: '#F0FDF4', padding: '12px 16px', border: '1px solid #DCFCE7' }}>
                      <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: '#065F46' }}>{item.title}: </strong>
                        <span style={{ fontSize: '0.84rem', color: '#166534' }}>{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4 */}
              <div id="abdm-compliance" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', borderBottom: '2px solid #0B6B68', paddingBottom: '0.5rem' }}>
                  4. ABDM & DPDP Act 2023 Statutory Compliance
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, marginBottom: '1rem' }}>
                  In accordance with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> and the <strong>National Health Authority (NHA)</strong> sandbox specifications:
                </p>
                <ul style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.8, paddingLeft: '20px' }}>
                  <li><strong>Data Fiduciary Obligations:</strong> The Ministry of Health & Family Welfare acts as the designated Data Fiduciary, maintaining immutable audit trails of every database read and write.</li>
                  <li><strong>Consent Manager Integration:</strong> Patients possess full visibility into which clinical institutions have requested access to their historical electronic health records (EHR).</li>
                  <li><strong>Notice in Regional Dialects:</strong> Consent notifications are provided in Hindi, Gujarati, Marathi, and other Eighth Schedule regional languages.</li>
                </ul>
              </div>

              {/* SECTION 5 */}
              <div id="security" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', borderBottom: '2px solid #0B6B68', paddingBottom: '0.5rem' }}>
                  5. Encryption, Storage & Offline Queue Protection
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, marginBottom: '1rem' }}>
                  Rural network dropouts are a core operational reality. Our security architecture is designed to remain impenetrable even on intermittent 2G connections:
                </p>
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '18px', marginBottom: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0F172A' }}>In-Transit Cryptography</div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '4px' }}>TLS 1.3 protocol with elliptic curve Diffie-Hellman ephemeral key exchanges.</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0F172A' }}>At-Rest Storage</div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '4px' }}>AES-256 bit encryption across all database records and replica sets hosted on sovereign Indian soil.</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0F172A' }}>Device Sandbox Storage</div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '4px' }}>Local IndexedDB caches on ASHA tablets are hardware-encrypted and immediately purged upon sync confirmation.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 6 */}
              <div id="role-access" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', borderBottom: '2px solid #0B6B68', paddingBottom: '0.5rem' }}>
                  6. Role-Based Access Isolation (RBAC)
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, marginBottom: '1rem' }}>
                  Access privileges are strictly segmented according to operational duty:
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '550px', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                        <th style={{ padding: '10px 12px' }}>Role</th>
                        <th style={{ padding: '10px 12px' }}>Authorized Scope</th>
                        <th style={{ padding: '10px 12px' }}>Restrictions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>ASHA / Field Worker</td>
                        <td style={{ padding: '10px 12px' }}>Assigned village cluster screening, vitals entry, basic triage.</td>
                        <td style={{ padding: '10px 12px', color: '#64748B' }}>Cannot view medical notes from other villages.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>Medical Officer / Doctor</td>
                        <td style={{ padding: '10px 12px' }}>Full clinical consultation, prescription writing, lab test orders.</td>
                        <td style={{ padding: '10px 12px', color: '#64748B' }}>Audit-logged on every patient lookup.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>District Administrator</td>
                        <td style={{ padding: '10px 12px' }}>Aggregated stock metrics, bed capacity, epidemic surveillance.</td>
                        <td style={{ padding: '10px 12px', color: '#DC2626', fontWeight: 600 }}>Zero access to individual raw patient vitals.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 7 */}
              <div id="rights" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', borderBottom: '2px solid #0B6B68', paddingBottom: '0.5rem' }}>
                  7. Patient Rights & Consent Revocation
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, marginBottom: '1rem' }}>
                  Under Indian law, patients hold complete authority over their clinical records:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div style={{ border: '1px solid #E2E8F0', padding: '14px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>Right to Access</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>Free physical printout or digital download of all diagnostic records via your Village Sub-Centre.</div>
                  </div>
                  <div style={{ border: '1px solid #E2E8F0', padding: '14px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>Right to Correction</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>Request correction of misrecorded demographic vitals through any certified ASHA worker.</div>
                  </div>
                  <div style={{ border: '1px solid #E2E8F0', padding: '14px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>Right to Erasure</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>De-link ABHA account or request deletion of optional tele-consultation audio notes.</div>
                  </div>
                </div>
              </div>

              {/* SECTION 8 */}
              <div id="grievance" style={{ scrollMarginTop: '100px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', borderBottom: '2px solid #0B6B68', paddingBottom: '0.5rem' }}>
                  8. Grievance Redressal & Data Protection Officer (DPO)
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                  In accordance with Rule 3(1) of the Information Technology (Intermediary Guidelines) Rules, 2021 and Section 19 of the DPDP Act 2023, 
                  you may direct any privacy concerns or unauthorized data access grievances to our designated Nodal Officer:
                </p>

                <div style={{ background: '#F8FAFC', border: '1px solid #0B6B68', padding: '20px' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0B6B68', marginBottom: '8px' }}>
                    Office of the Central Data Protection Officer (DPO)
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.8 }}>
                    <strong>Officer:</strong> Smt. Ananya Sen, IAS (Joint Secretary - Health Informatics)<br />
                    <strong>Authority:</strong> National Health Mission, Ministry of Health & Family Welfare<br />
                    <strong>Address:</strong> Nirman Bhawan, Maulana Azad Road, New Delhi - 110011<br />
                    <strong>Official Email:</strong> <a href="mailto:dpo-graminarogya@gov.in" style={{ color: '#0B6B68', textDecoration: 'underline' }}>dpo-graminarogya@gov.in</a><br />
                    <strong>Toll-Free Grievance Helpline:</strong> 1800-180-1104 / 104 (24x7 Rural Support)
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <Link to="/nodal-officers" className="np-btn" style={{ background: '#0B6B68', color: '#fff', padding: '8px 16px', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      View Complete Nodal Officers Directory <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>

            </article>

          </div>
        </div>
      </section>

    </div>
  );
}
