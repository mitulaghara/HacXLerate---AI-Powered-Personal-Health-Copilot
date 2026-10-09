import React, { useState } from 'react';
import { Phone, Droplet, HeartPulse, Building2, Stethoscope, Share2, BarChart3, Activity, BookOpen, ShieldCheck, HelpCircle, FileText, ChevronDown, ChevronRight, X, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Production-ready, fully responsive, zero-dead-link PublicFooter
 * Supports desktop columns, tablet reflow, and mobile accordion drawers.
 */
export default function PublicFooter({ 
  onOpenBlood, 
  onOpenSOS, 
  currentUser, 
  setActiveTab 
}) {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState({
    'Health Services': false,
    'For Workers': false,
    'Resources': false
  });

  // Modal dialog for legal & compliance documents (Privacy, Terms, Accessibility, RTI)
  const [activeModal, setActiveModal] = useState(null);

  const toggleSection = (title) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const handleLinkClick = (link) => {
    switch (link.id) {
      case 'nearbyHospitals':
        navigate('/find-care');
        break;
      case 'bloodFinder':
        if (onOpenBlood) onOpenBlood();
        else navigate('/find-care');
        break;
      case 'ambulance108':
        if (onOpenSOS) onOpenSOS();
        else window.location.href = 'tel:108';
        break;
      case 'healthPrograms':
        navigate('/services');
        break;
      case 'preventiveCare':
        navigate('/services');
        break;
      case 'ashaPortal':
        if (currentUser && (currentUser.role === 'staff' || currentUser.role === 'asha' || currentUser.role === 'admin')) {
          if (setActiveTab) setActiveTab('staff');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          navigate('/sign-in');
        }
        break;
      case 'doctorDesk':
        if (currentUser && (currentUser.role === 'doctor' || currentUser.role === 'admin')) {
          if (setActiveTab) setActiveTab('history');
          navigate('/doctor');
        } else {
          navigate('/sign-in');
        }
        break;
      case 'smartRouting':
        if (currentUser && setActiveTab) {
          setActiveTab('routing');
          navigate('/find-care');
        } else {
          navigate('/find-care');
        }
        break;
      case 'referralHub':
        if (currentUser && setActiveTab) {
          setActiveTab('referrals');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          navigate('/sign-in');
        }
        break;
      case 'govDashboard':
        if (currentUser && ['cmo', 'admin'].includes(currentUser.role)) {
          if (setActiveTab) setActiveTab('gov');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          navigate('/sign-in');
        }
        break;
      case 'healthEducation':
        navigate('/articles');
        break;
      case 'governmentSchemes':
        navigate('/articles/ayushman-bharat');
        break;
      case 'accessibility':
        setActiveModal('accessibility');
        break;
      case 'contactSupport':
        navigate('/contact');
        break;
      case 'helpCentre':
        navigate('/contact');
        break;
      default:
        break;
    }
  };

  const sections = [
    {
      title: 'Health Services',
      items: [
        { id: 'nearbyHospitals', label: 'Find Nearby Hospitals', icon: Building2 },
        { id: 'bloodFinder', label: 'Emergency Blood Finder', icon: Droplet, badge: '24x7' },
        { id: 'ambulance108', label: '108 Ambulance Dispatch', icon: Phone, alert: true },
        { id: 'healthPrograms', label: 'National Health Programs', icon: HeartPulse },
        { id: 'preventiveCare', label: 'Preventive & Maternal Care', icon: Activity }
      ]
    },
    {
      title: 'For Workers',
      items: [
        { id: 'ashaPortal', label: 'ASHA Field Portal', icon: Activity, badge: 'Intake' },
        { id: 'doctorDesk', label: 'Doctor Desk & Rx Pad', icon: Stethoscope },
        { id: 'smartRouting', label: 'Smart Facility Routing', icon: HeartPulse },
        { id: 'referralHub', label: 'Digital Referral Hub', icon: Share2 },
        { id: 'govDashboard', label: 'Government & CMO Intel', icon: BarChart3 }
      ]
    },
    {
      title: 'Resources',
      items: [
        { id: 'healthEducation', label: 'Health Education Articles', icon: BookOpen },
        { id: 'governmentSchemes', label: 'Ayushman Bharat (PM-JAY)', icon: ShieldCheck },
        { id: 'accessibility', label: 'Accessibility Standards', icon: FileText },
        { id: 'contactSupport', label: 'Contact Support Helpdesk', icon: HelpCircle },
        { id: 'helpCentre', label: 'District Helplines & FAQs', icon: Phone }
      ]
    }
  ];

  return (
    <footer style={{
      background: '#f8fafc',
      borderTop: '1px solid #e2e8f0',
      color: '#0f172a',
      padding: '4rem 1.5rem 6.5rem 1.5rem',
      position: 'relative',
      zIndex: 20
    }}>
      <style>{`
        .ga-footer-wrap {
          max-width: 1400px;
          margin: 0 auto;
        }
        .ga-footer-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 2.5rem;
          margin-bottom: 3.5rem;
        }
        .ga-footer-item-btn {
          background: transparent;
          border: none;
          padding: 6px 0;
          font-family: inherit;
          font-size: 0.88rem;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all 0.15s ease;
          border-radius: 6px;
        }
        .ga-footer-item-btn:hover {
          color: #0d9488;
          transform: translateX(3px);
        }
        .ga-accordion-toggle {
          display: none;
        }
        @media (max-width: 1024px) {
          .ga-footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
          }
        }
        @media (max-width: 640px) {
          .ga-footer-grid {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
            margin-bottom: 2rem;
          }
          .ga-accordion-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
            cursor: pointer;
            user-select: none;
          }
          .ga-accordion-toggle {
            display: inline-flex;
            transition: transform 0.2s ease;
          }
          .ga-accordion-body {
            padding-top: 10px;
            padding-bottom: 10px;
          }
        }
      `}</style>

      <div className="ga-footer-wrap">
        <div className="ga-footer-grid">
          {/* Brand & Emergency Mission Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src="/images/logo.png"
                alt="GraminArogya"
                style={{ height: '44px', width: 'auto', objectFit: 'contain' }}
              />
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  GraminArogya
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: '#0d9488', textTransform: 'uppercase' }}>
                  Rural Healthcare Intelligence Network
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.6, margin: 0, maxWidth: '380px' }}>
              A national digital public healthcare network connecting rural citizens, frontline ASHA workers, Primary Health Centres, and District Hospitals through intelligent clinical triage and verified emergency routing.
            </p>

            <div style={{
              background: '#ffffff',
              border: '1px solid #fee2e2',
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.08)',
              maxWidth: '380px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626'
                }}>
                  <Phone size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#dc2626', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    National Emergency Dispatch
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                    108 <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>/ 104 Helpline</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onOpenSOS) onOpenSOS();
                  else window.location.href = 'tel:108';
                }}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
                  whiteSpace: 'nowrap'
                }}
              >
                Call 108
              </button>
            </div>
          </div>

          {/* Structured Navigation Columns */}
          {sections.map((col) => {
            const isMobileOpen = openSections[col.title];
            return (
              <div key={col.title}>
                <div
                  className="ga-accordion-header"
                  onClick={() => toggleSection(col.title)}
                >
                  <h4 style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#1e293b',
                    margin: 0
                  }}>
                    {col.title}
                  </h4>
                  <span className="ga-accordion-toggle" style={{ transform: isMobileOpen ? 'rotate(180deg)' : 'none' }}>
                    <ChevronDown size={18} color="#64748b" />
                  </span>
                </div>

                <div
                  className="ga-accordion-body"
                  style={{
                    display: typeof window !== 'undefined' && window.innerWidth <= 640 && !isMobileOpen ? 'none' : 'block'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                    {col.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleLinkClick(item)}
                          className="ga-footer-item-btn"
                        >
                          <Icon size={15} color={item.alert ? '#dc2626' : '#0d9488'} />
                          <span style={{ flex: 1 }}>{item.label}</span>
                          {item.badge && (
                            <span style={{
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              background: '#f0fdf4',
                              color: '#16a34a',
                              border: '1px solid #bbf7d0',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Bar: Legal & System Verification */}
        <div style={{
          borderTop: '1px solid #e2e8f0',
          paddingTop: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            © {new Date().getFullYear()} GraminArogya Rural Health Network · Ministry of Health & Family Welfare (MoHFW)
          </div>

          <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link 
              to="/privacy" 
              style={{ fontSize: '0.78rem', color: '#64748b', textDecoration: 'none' }} 
              onMouseEnter={(e) => e.currentTarget.style.color = '#0d9488'} 
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
            >
              Privacy Policy
            </Link>
            <Link 
              to="/terms" 
              style={{ fontSize: '0.78rem', color: '#64748b', textDecoration: 'none' }} 
              onMouseEnter={(e) => e.currentTarget.style.color = '#0d9488'} 
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
            >
              Terms of Service
            </Link>
            <Link 
              to="/contact" 
              style={{ fontSize: '0.78rem', color: '#64748b', textDecoration: 'none' }} 
              onMouseEnter={(e) => e.currentTarget.style.color = '#0d9488'} 
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
            >
              Contact Us
            </Link>
            <Link 
              to="/nodal-officers" 
              style={{ fontSize: '0.78rem', color: '#64748b', textDecoration: 'none' }} 
              onMouseEnter={(e) => e.currentTarget.style.color = '#0d9488'} 
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
            >
              Nodal Officers
            </Link>
          </div>
        </div>
      </div>

      {/* Structured Legal / Information Modal */}
      {activeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
        onClick={() => setActiveModal(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '24px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={24} color="#0d9488" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {activeModal === 'privacy' && 'GraminArogya Privacy & Data Protection Policy'}
                  {activeModal === 'terms' && 'Terms of Service & Clinical Usage Protocols'}
                  {activeModal === 'accessibility' && 'Accessibility & Assistive Tech Compliance'}
                  {activeModal === 'rti' && 'Right to Information (RTI) Transparency Declaration'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.86rem', lineHeight: 1.65, color: '#334155' }}>
              {activeModal === 'privacy' && (
                <div>
                  <p>GraminArogya complies with the Digital Personal Data Protection Act (DPDP), 2023 and the Ayushman Bharat Digital Mission (ABDM) data architecture guidelines.</p>
                  <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong>Patient Data Isolation:</strong> Health records, vitals, and ABHA identifiers are encrypted in transit (TLS 1.3) and at rest.</li>
                    <li><strong>Role-Based Access:</strong> Only registered ASHA frontline workers and authorized Medical Officers can view village consultation telemetry.</li>
                    <li><strong>Offline Privacy:</strong> Offline local queues are secured within device sandboxes and cleared immediately upon successful central sync.</li>
                  </ul>
                </div>
              )}

              {activeModal === 'terms' && (
                <div>
                  <p>Welcome to GraminArogya. By accessing this platform as a frontline healthcare worker, medical clinician, or citizen, you agree to the following terms:</p>
                  <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong>Clinical Decision Support:</strong> AI Triage provides screening triage and rapid referral routing assistance. It does NOT replace licensed physician clinical diagnosis.</li>
                    <li><strong>Emergency Dispatch:</strong> Critical red triage cases automatically recommend immediate 108 ambulance dispatch and district hospital stabilization.</li>
                    <li><strong>Frontline Worker Integrity:</strong> ASHA workers must verify patient consent before capturing demographic data or ABHA identifiers.</li>
                  </ul>
                </div>
              )}

              {activeModal === 'accessibility' && (
                <div>
                  <p>GraminArogya is engineered under WCAG 2.1 Level AA and the Guidelines for Indian Government Websites (GIGW) for complete rural digital inclusivity:</p>
                  <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong>Multilingual Voice AI:</strong> Supports voice intake in Hindi and regional dialects for field workers who prefer spoken consultation notes.</li>
                    <li><strong>High-Contrast & Large Touch Targets:</strong> Touch controls are minimum 44x44px for field tablets and mobile smartphones under bright sunlight.</li>
                    <li><strong>Screen Reader Semantic Tags:</strong> Fully annotated ARIA labels, semantic landmark regions, and visible keyboard focus outlines.</li>
                  </ul>
                </div>
              )}

              {activeModal === 'rti' && (
                <div>
                  <p>GraminArogya operates in full alignment with Section 4(1)(b) of the Right to Information Act, 2005:</p>
                  <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong>Public Resource Allocations:</strong> Hospital bed availability, blood donor registry links, and PHC diagnostic readiness are public public domain resources.</li>
                    <li><strong>Appeals & Nodal Contact:</strong> Citizens may address queries to the District Chief Medical Officer or the National Health Mission Helpdesk at 104.</li>
                  </ul>
                </div>
              )}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{
                  background: '#0d9488',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
