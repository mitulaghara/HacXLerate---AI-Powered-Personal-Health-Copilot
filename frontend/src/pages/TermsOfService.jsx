import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileCheck, ShieldAlert, AlertTriangle, Stethoscope, PhoneCall, 
  Scale, BookOpen, UserCheck, ArrowLeft, Printer, Mail, ExternalLink,
  CheckCircle2, Clock, Globe, Shield
} from 'lucide-react';

export default function TermsOfService() {
  const [activeSection, setActiveSection] = useState('clinical-disclaimer');

  const sections = [
    { id: 'acceptance', label: '1. Acceptance & Statutory Framework' },
    { id: 'clinical-disclaimer', label: '2. Clinical Decision Support Scope' },
    { id: 'emergency-protocol', label: '3. 108 Emergency & SOS Protocols' },
    { id: 'frontline-duties', label: '4. ASHA & Health Worker Ethics' },
    { id: 'account-security', label: '5. Account Security & Verification' },
    { id: 'availability', label: '6. Offline Caching & Failover' },
    { id: 'liability', label: '7. Limitation of Liability & Indemnity' },
    { id: 'governing-law', label: '8. Dispute Resolution & Jurisdiction' }
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', paddingBottom: '6rem' }}>
      
      {/* HERO SECTION */}
      <section style={{ 
        paddingTop: '6rem', paddingBottom: '3.5rem', 
        background: 'linear-gradient(135deg, #18312F 0%, #0F1F1E 100%)', 
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
                <Scale size={16} color="#E7A63B" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.05em', color: '#E7A63B', fontWeight: 700 }}>
                  NATIONAL HEALTH MISSION CLINICAL GOVERNANCE
                </span>
              </div>
              <h1 style={{ 
                fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4.5vw, 3.25rem)', 
                fontWeight: 700, marginBottom: '1rem', lineHeight: 1.15, color: '#ffffff' 
              }}>
                Terms of Service & Clinical Usage Protocols
              </h1>
              <p style={{ 
                fontFamily: 'var(--font-body)', fontSize: 'clamp(0.95rem, 1.3vw, 1.15rem)', 
                color: '#E6EDE9', lineHeight: 1.6, maxWidth: '720px', margin: 0 
              }}>
                Official operational standards, clinical decision support limitations, and emergency triage rules 
                binding all public healthcare providers, ASHA personnel, and citizens using GraminArogya.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={handlePrint}
                className="np-btn"
                style={{ 
                  background: '#ffffff', color: '#18312F', border: '1px solid #ffffff', 
                  padding: '10px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', 
                  gap: '8px', cursor: 'pointer', fontSize: '0.85rem' 
                }}
              >
                <Printer size={16} /> Print Terms
              </button>
              <Link 
                to="/nodal-officers"
                className="np-btn"
                style={{ 
                  background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', 
                  padding: '10px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', 
                  gap: '8px', textDecoration: 'none', fontSize: '0.85rem' 
                }}
              >
                <BookOpen size={16} /> Nodal Directory
              </Link>
            </div>
          </div>

          {/* Core Pillars */}
          <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '12px', marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.15)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Stethoscope size={18} color="#E7A63B" />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>Decision Support Only</div>
                <div style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>Does not replace registered MD</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PhoneCall size={18} color="#E7A63B" />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>108 Priority Dispatch</div>
                <div style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>Direct route to nearest ICU/CHC</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={18} color="#E7A63B" />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>Verifiable Audit Trail</div>
                <div style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>Full clinical accountability log</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Globe size={18} color="#E7A63B" />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>Public Service Mandate</div>
                <div style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>Free access for rural citizens</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section style={{ marginTop: '2rem' }}>
        <div className="np-container" style={{ maxWidth: '1300px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2.5rem', alignItems: 'start' }} className="mobile-grid-1">
            
            {/* SIDEBAR NAVIGATION */}
            <aside style={{ 
              background: '#ffffff', border: '1px solid var(--borderLight)', 
              padding: '1.5rem', position: 'sticky', top: '90px' 
            }} className="mobile-hidden">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--mutedForeground)', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                TABLE OF SECTIONS
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
                  Statutory Notice
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--mutedForeground)', lineHeight: 1.5 }}>
                  Governed under Clinical Establishments Act, 2010 & Telemedicine Practice Guidelines.
                </div>
              </div>
            </aside>

            {/* DOCUMENT CONTENT */}
            <article style={{ background: '#ffffff', border: '1px solid var(--borderLight)', padding: 'clamp(1.5rem, 4vw, 3rem)' }}>
              
              {/* SECTION 1 */}
              <div id="acceptance" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', borderBottom: '2px solid #18312F', paddingBottom: '0.5rem' }}>
                  1. Acceptance & Statutory Framework
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, marginBottom: '1rem' }}>
                  By accessing, browsing, or utilizing any functionality within the GraminArogya ecosystem—including the web portal, 
                  ASHA field tablets, Doctor diagnostic panels, and automated referral gateways—you unconditionally agree to comply 
                  with these Terms of Service, all applicable state public health bylaws, and the Telemedicine Practice Guidelines issued by the National Medical Commission (NMC).
                </p>
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7 }}>
                  If you are utilizing this service on behalf of a Primary Health Centre (PHC), Sub-Centre, or Community Health Centre (CHC), 
                  you represent that you possess the requisite medical license, ASHA accreditation, or institutional administrative authorization.
                </p>
              </div>

              {/* SECTION 2 */}
              <div id="clinical-disclaimer" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', borderBottom: '2px solid #18312F', paddingBottom: '0.5rem' }}>
                  2. Clinical Decision Support Scope & Limitations
                </h2>
                
                <div style={{ background: '#FFFBEB', borderLeft: '4px solid #D97706', padding: '16px', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                    <AlertTriangle size={18} color="#D97706" />
                    <strong style={{ fontSize: '0.9rem', color: '#92400E' }}>CRITICAL CLINICAL NOTICE</strong>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: '#92400E', margin: 0, lineHeight: 1.6 }}>
                    The early screening triage scores (Green, Yellow, Red) and risk-stratification models generated by GraminArogya are 
                    <strong> computerized decision-support instruments</strong> designed to expedite referral prioritizing. They DO NOT constitute 
                    a definitive medical diagnosis or replace hands-on clinical examination by a certified Medical Officer.
                  </p>
                </div>

                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, marginBottom: '1rem' }}>
                  In all medical interactions:
                </p>
                <ul style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.8, paddingLeft: '20px' }}>
                  <li>Registered Medical Practitioners (RMPs) remain fully liable for their diagnostic evaluations, prescription decisions, and surgical referral recommendations.</li>
                  <li>Frontline workers must communicate to patients that screening tests are preliminary assessments intended to coordinate secondary facility visits.</li>
                  <li>No medication may be dispensed without a valid registered doctor prescription, except emergency first-aid counter-measures authorized under Sub-Centre standing orders.</li>
                </ul>
              </div>

              {/* SECTION 3 */}
              <div id="emergency-protocol" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', borderBottom: '2px solid #18312F', paddingBottom: '0.5rem' }}>
                  3. 108 Emergency & Golden Hour SOS Protocols
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, marginBottom: '1rem' }}>
                  GraminArogya integrates directly with State Emergency Response Services (108 Ambulance Network):
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '1.25rem' }}>
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '16px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#991B1B', marginBottom: '4px' }}>Red Triage Automatic Alert</div>
                    <div style={{ fontSize: '0.78rem', color: '#B91C1C', lineHeight: 1.5 }}>
                      When severe vitals (e.g. SpO2 &lt; 90%, SBP &gt; 180, severe obstetric hemorrhage) are logged, the platform immediately flags the nearest CHC/District Hospital emergency room.
                    </div>
                  </div>
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '16px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#991B1B', marginBottom: '4px' }}>False Emergency Alarms</div>
                    <div style={{ fontSize: '0.78rem', color: '#B91C1C', lineHeight: 1.5 }}>
                      Malicious or frivolous triggering of emergency SOS alerts or ambulance dispatch requests is punishable under Section 177 of the Indian Penal Code.
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4 */}
              <div id="frontline-duties" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', borderBottom: '2px solid #18312F', paddingBottom: '0.5rem' }}>
                  4. ASHA, ANM & Healthcare Worker Code of Ethics
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, marginBottom: '1rem' }}>
                  All accredited field healthcare personnel agree to maintain the highest integrity:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    'Obtain informed verbal consent from the patient or legal guardian prior to recording vitals, blood sugar, or obstetric milestones.',
                    'Protect patient confidentiality by never sharing login credentials, OTPs, or field tablet passwords with unauthorized persons.',
                    'Record genuine measurements only; falsification of immunization data, maternal checkups, or survey tallies leads to immediate de-registration and legal disciplinary action.',
                    'Promptly assist non-literate patients in understanding their ABHA QR cards and printed referral slips.'
                  ].map((rule, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#F8FAFC', padding: '10px 14px', border: '1px solid #E2E8F0' }}>
                      <CheckCircle2 size={16} color="#0B6B68" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.84rem', color: '#334155' }}>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 5 */}
              <div id="account-security" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', borderBottom: '2px solid #18312F', paddingBottom: '0.5rem' }}>
                  5. Account Security, Passwords & Access Verification
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, marginBottom: '1rem' }}>
                  Healthcare workers and administrators are issued unique system usernames (e.g. <code>DOC-XXXXXX</code> or <code>STF-XXXXXX</code>). 
                  You are solely responsible for all actions conducted under your account:
                </p>
                <ul style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.8, paddingLeft: '20px' }}>
                  <li>You must immediately notify the Chief Medical Officer or system administrator of any suspected account compromise.</li>
                  <li>Multi-factor authentication (MFA) must be maintained when accessing centralized administrative dashboards.</li>
                  <li>Sessions automatically timeout following prolonged inactivity to prevent unauthorized access at shared clinic terminals.</li>
                </ul>
              </div>

              {/* SECTION 6 */}
              <div id="availability" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', borderBottom: '2px solid #18312F', paddingBottom: '0.5rem' }}>
                  6. Offline Caching, Sync Conflicts & Service Level
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, marginBottom: '1rem' }}>
                  GraminArogya incorporates Progressive Web Application (PWA) offline queuing:
                </p>
                <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.8 }}>
                  While the platform aims for 99.9% uptime, occasional telecommunication disruptions, satellite outages, or state power failures 
                  may delay central database synchronization. Field workers are trained to rely on offline triage protocols until connectivity resumes. 
                  The platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis for emergency public welfare operations.
                </p>
              </div>

              {/* SECTION 7 */}
              <div id="liability" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', borderBottom: '2px solid #18312F', paddingBottom: '0.5rem' }}>
                  7. Limitation of Liability & Government Indemnity
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, marginBottom: '1rem' }}>
                  To the maximum extent permitted by Indian jurisprudence:
                </p>
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '16px', fontSize: '0.85rem', color: '#475569', lineHeight: 1.7 }}>
                  Neither the Ministry of Health & Family Welfare, the National Health Mission, state health directorates, 
                  nor the developers and maintainers of GraminArogya shall be held liable for any indirect, incidental, or consequential damages 
                  arising out of delayed telecommunications, clinical judgment errors of third-party clinicians, or mechanical ambulance transit failures 
                  beyond the reasonable control of the software system.
                </div>
              </div>

              {/* SECTION 8 */}
              <div id="governing-law" style={{ scrollMarginTop: '100px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', borderBottom: '2px solid #18312F', paddingBottom: '0.5rem' }}>
                  8. Dispute Resolution & Territorial Jurisdiction
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                  These Terms of Service are construed in conformity with the laws of the Republic of India. Any legal dispute, 
                  claim, or action arising under these protocols shall be submitted to the exclusive jurisdiction of the competent courts 
                  at the State Capital or District Sessions Court having administrative purview over the registered healthcare facility.
                </p>

                <div style={{ background: '#F0FDF4', border: '1px solid #0B6B68', padding: '18px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0B6B68', marginBottom: '6px' }}>
                    Need Clarification on Clinical Usage?
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.7 }}>
                    Contact our Medical Legal Advisory Cell at <a href="mailto:legal-graminarogya@gov.in" style={{ color: '#0B6B68', textDecoration: 'underline' }}>legal-graminarogya@gov.in</a> or speak with your District Chief Medical Officer.
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
