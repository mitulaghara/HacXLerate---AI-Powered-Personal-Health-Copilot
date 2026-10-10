import React from 'react';
import { 
  MapPin, Phone, ShieldCheck, Navigation, Lock, Activity, 
  Sparkles, Droplet, AlertTriangle, FileText, CheckCircle2, 
  HeartPulse, ArrowRight, Clock, Stethoscope, Users, Building2, 
  QrCode, WifiOff, Award, ChevronRight, MessageSquare, ExternalLink
} from 'lucide-react';
import NewsTicker from '../components/NewsTicker';
import { useNavigate, Link } from 'react-router-dom';

export default function Home({ setIsNearbyOpen, setIsBloodOpen }) {
  const navigate = useNavigate();

  const handleLaunchAiPrompt = (promptText) => {
    window.dispatchEvent(new CustomEvent('open-sanjeevani-ai', { 
      detail: { prompt: promptText, autoSend: true } 
    }));
  };

  const emergencyLifelines = [
    { number: '108', title: 'Emergency Ambulance', desc: 'Free 24x7 patient transport & trauma response', color: '#b91c1c', bg: '#fef2f2' },
    { number: '104', title: 'National Health Helpline', desc: 'Free medical consultation & local PHC directory', color: '#0B6B68', bg: '#e6f4f2' },
    { number: '1910', title: 'e-RaktKosh Blood Helpline', desc: 'National Blood Bank real-time stock inquiry', color: '#e11d48', bg: '#fff1f2' },
    { number: '14416', title: 'Tele-MANAS Mental Health', desc: '24x7 bilingual psychological counselling', color: '#6366f1', bg: '#eef2ff' }
  ];

  const quickActionCards = [
    {
      title: 'Sanjeevani AI Copilot',
      badge: 'REAL-TIME GPS & VOICE',
      desc: 'Multilingual symptom intake, live OpenStreetMap Overpass nearest hospital discovery, and 108 ambulance shortcuts.',
      actionText: 'Ask Sanjeevani AI',
      icon: <Sparkles size={22} className="text-emerald-600" />,
      onClick: () => handleLaunchAiPrompt('I have heart problem, give me nearby hospital'),
      highlight: true
    },
    {
      title: '24x7 Emergency Blood Hub',
      badge: 'LIVE RED CROSS & NGOS',
      desc: 'Live stock ticker for A+, B+, AB-, O+ units across 740+ district banks, Red Cross, Rotary trusts, and 1-tap SOS broadcast.',
      actionText: 'Find Blood Banks',
      icon: <Droplet size={22} className="text-red-600" />,
      onClick: () => setIsBloodOpen(true)
    },
    {
      title: 'Smart Clinical Facility Routing',
      badge: 'RESOURCE & BED AWARE',
      desc: 'Matches patients not just by distance, but by on-duty doctors, functional ECG/X-Ray equipment, and available oxygen beds.',
      actionText: 'Find Verified Clinics',
      icon: <MapPin size={22} className="text-teal-700" />,
      onClick: () => setIsNearbyOpen(true)
    },
    {
      title: 'ABDM & HL7 FHIR R4 Gateway',
      badge: 'AYUSHMAN BHARAT READY',
      desc: 'Link your 14-digit ABHA ID, access unified chronological health timelines, and export standard HL7 FHIR R4 JSON bundles.',
      actionText: 'Access Health Vault',
      icon: <ShieldCheck size={22} className="text-indigo-600" />,
      onClick: () => navigate('/sign-in')
    }
  ];

  const aiPrompts = [
    { text: 'I have heart problem, give me nearby hospital', tag: '🚨 Critical Triage' },
    { text: 'What medicine should I take for fever and headache?', tag: '💊 Medicine Guidance' },
    { text: 'Nearest hospital with available ICU beds', tag: '🏥 Bed Availability' },
    { text: 'मुझे तेज बुखार और ठंड लग रही है क्या दवा लूँ?', tag: '🇮🇳 Hindi Triage' },
    { text: 'First aid steps for snake bite in rural area', tag: '🐍 Emergency First-Aid' }
  ];

  const ecosystemPillars = [
    {
      role: 'Frontline ASHA & ANM Workers',
      icon: <Users size={24} color="#0B6B68" />,
      summary: 'Empowering grassroot community workers in remote villages with zero cellular reception.',
      features: [
        'Offline-First field capture via browser IndexedDB',
        'Automatic background sync upon network reconnection',
        'Feature phone SMS and USSD code fallback generator',
        '1-Click Digital Referral Slip with high-density QR passport'
      ],
      route: '/sign-in',
      tag: 'Field Operations'
    },
    {
      role: 'Attending Physicians & Specialists',
      icon: <Stethoscope size={24} color="#0B6B68" />,
      summary: 'Eliminating guesswork with seamless cross-tier clinical handover and verified records.',
      features: [
        'Complete chronological patient EHR timeline & vitals history',
        'Branded digital prescription composer with dosage templates',
        'Dual-synchronized next-day checkup queue',
        'Email OTP verification code to securely confirm consultations'
      ],
      route: '/sign-in',
      tag: 'Clinical Desk'
    },
    {
      role: 'Rural Citizens & Caregivers',
      icon: <HeartPulse size={24} color="#0B6B68" />,
      summary: 'Dignified, paperless healthcare access in the palm of every citizen’s hand.',
      features: [
        '1-Tap Google OAuth 2.0 & self-service OTP recovery',
        'Bilingual English ↔ Hindi (अ/A) timeline toggle',
        'Portable HL7 FHIR R4 JSON clinical bundle export',
        'Universal search via Mobile number or Swasthya Setu Card'
      ],
      route: '/sign-in',
      tag: 'Citizen Vault'
    },
    {
      role: 'Health Administrators & CMOs',
      icon: <Activity size={24} color="#0B6B68" />,
      summary: 'Executive surveillance radar and predictive supply chain management for district health.',
      features: [
        'District-wide epidemiological disease outbreak heatmap',
        'Essential Drug List (EDL) stockout radar & batch tracking',
        'Role-Based Access Control (RBAC) workforce roster',
        'Centralized public grievance and citizen feedback inbox'
      ],
      route: '/sign-in',
      tag: 'Command Center'
    }
  ];

  const nationalPrograms = [
    {
      title: 'Ayushman Bharat (PM-JAY)',
      subtitle: 'Universal Health Protection',
      desc: 'Provides ₹5,00,000 cashless cover per family per year for secondary and tertiary hospitalization across empaneled public and private facilities nationwide.',
      image: '/images/ayushman_bharat.jpg',
      badge: '₹5 LAKH COVER',
      link: '/articles/pm-jay-ayushman-bharat-rural-eligibility'
    },
    {
      title: 'Janani Shishu Suraksha Karyakram (JSSK)',
      subtitle: 'Maternal & Neonatal Dignity',
      desc: 'Completely free delivery, zero expense C-section, free diagnostics, medicines, and ambulance transport for all pregnant mothers and sick infants.',
      image: '/images/maternal_child_care.jpg',
      badge: '100% CASHLESS DELIVERY',
      link: '/articles/maternal-care-jssk-benefits-rural'
    },
    {
      title: 'Mission Indradhanush (Universal Immunisation)',
      subtitle: 'Childhood Disease Shield',
      desc: 'Comprehensive immunisation protecting infants and mothers against 12 vaccine-preventable life-threatening diseases with digital tracking.',
      image: '/images/child_immunisation.jpg',
      badge: '12 VACCINES PROTECTED',
      link: '/articles/immunisation-schedule-rural-infants'
    },
    {
      title: 'Tele-MANAS Psychological Support',
      subtitle: '24×7 National Mental Health',
      desc: 'Free, compassionate, confidential digital mental health support line connecting rural citizens to trained counsellors in 20+ regional languages.',
      image: '/images/tele_manas_mental_health.jpg',
      badge: 'TOLL-FREE 14416',
      link: '/articles/tele-manas-mental-health-support-rural-india'
    }
  ];

  return (
    <>
      {/* ---------------- TICKER ---------------- */}
      <NewsTicker
        items={[
          'National Rural Health Mission · 108 Ambulance available 24×7',
          'Sanjeevani AI: Live GPS OpenStreetMap Overpass hospital triage active',
          'Blood availability now updated live across 740+ districts & Red Cross NGOs',
          'New: ASHA workers can register patients offline — auto-sync via IndexedDB',
          'Ayushman Bharat ABHA linking enabled with HL7 FHIR R4 bundle export',
          'Government health helpline 104 · Maternal care 181 · Tele-MANAS 14416',
        ]}
      />

      {/* ---------------- HERO ---------------- */}
      <section className="np-hero mobile-py-8" style={{ padding: '5rem 0 4rem 0', background: 'var(--background)' }}>
        <div className="np-container">
          <div className="np-hero-grid mobile-stack">
            {/* LEFT — headline column */}
            <div className="np-hero-left">
              <div>
                <div className="np-hero-headline-row mobile-stack" style={{ borderBottom: '2px solid var(--borderLight)', paddingBottom: '1rem', marginBottom: '1.75rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>GRAMIN AROGYA</span>
                  <span className="np-meta" style={{ color: 'var(--mutedForeground)' }}>· Rural Health Access & Intelligence Hub</span>
                </div>

                <h1 className="np-h1" style={{ color: 'var(--foreground)', marginBottom: '1.25rem', lineHeight: 1.15 }}>
                  Healthcare<br />
                  that reaches<br />
                  every village.
                </h1>

                <div className="np-hero-lede-wrap" style={{ borderTop: 'none', paddingTop: 0 }}>
                  <p className="np-lede" style={{ fontSize: '1.125rem', color: 'var(--mutedForeground)', maxWidth: '520px', lineHeight: 1.6 }}>
                    Connecting rural citizens, frontline ASHA workers, and secondary physicians on a unified, offline-resilient digital fabric. Powered by <strong>Sanjeevani AI</strong>, live OpenStreetMap spatial routing, and national <strong>ABDM HL7 FHIR R4</strong> standards.
                  </p>
                </div>

                <div className="np-hero-actions mobile-stack" style={{ marginTop: '2.25rem', gap: '1rem', display: 'flex', flexWrap: 'wrap' }}>
                  <button
                    className="np-btn np-btn-primary np-btn-lg mobile-full-width"
                    onClick={() => setIsNearbyOpen(true)}
                  >
                    <MapPin size={18} strokeWidth={2} />
                    Find Healthcare
                  </button>
                  <button
                    className="np-btn np-btn-outline np-btn-lg mobile-full-width"
                    onClick={() => setIsBloodOpen(true)}
                    style={{ borderColor: 'var(--emergency)', color: 'var(--emergency)' }}
                  >
                    <Phone size={18} strokeWidth={2} />
                    Emergency Help
                  </button>
                  <button
                    className="np-btn np-btn-outline np-btn-lg mobile-full-width"
                    onClick={() => handleLaunchAiPrompt('I have heart problem, give me nearby hospital')}
                    style={{ borderColor: '#0B6B68', color: '#0B6B68', background: '#F0FDF4' }}
                  >
                    <Sparkles size={18} strokeWidth={2} />
                    Try Sanjeevani AI
                  </button>
                </div>
                
                <div className="np-trust-strip mobile-stack" style={{ marginTop: '3.5rem', borderBottom: 'none' }}>
                  <div className="np-trust-strip-item" style={{ color: 'var(--mutedForeground)' }}>
                    <ShieldCheck size={16} strokeWidth={2} />
                    100% Verified Facilities
                  </div>
                  <div className="np-trust-strip-item" style={{ color: 'var(--mutedForeground)' }}>
                    <Navigation size={16} strokeWidth={2} />
                    Live GPS Routing
                  </div>
                  <div className="np-trust-strip-item" style={{ color: 'var(--mutedForeground)' }}>
                    <Lock size={16} strokeWidth={2} />
                    HL7 FHIR R4 & ABDM
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — visual photo & overlay */}
            <div className="np-hero-right" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '500px', aspectRatio: '4/5', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 24px 50px rgba(8, 63, 61, 0.12)' }}>
                <img src="/images/hero_rural_care_1789832838181.jpg" alt="Doctor consulting patient in a rural clinic" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8, 63, 61, 0.35), transparent 50%)', pointerEvents: 'none' }}></div>
                
                {/* Embedded Status indicator */}
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', padding: '0.5rem 1rem', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }}></div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, color: '#065f46', letterSpacing: '0.05em' }}>NETWORK ONLINE</span>
                </div>

                <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', padding: '0.85rem 1.25rem', borderRadius: '12px', color: '#fff', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={16} className="text-emerald-400" />
                    HacXLerate 2026 National Finalist
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>
                    Team TECHYODHA • Marwadi University & byteXL
                  </div>
                </div>
              </div>
              
              {/* Floating Stat Badge */}
              <div className="hero-floating-stat" style={{ 
                position: 'absolute', 
                bottom: '-1.5rem', 
                left: '-1.5rem', 
                background: 'var(--card)', 
                border: '1.5px solid var(--borderLight)', 
                borderRadius: '16px', 
                padding: '1.1rem 1.4rem', 
                boxShadow: '0 12px 30px rgba(8, 63, 61, 0.15)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                width: '270px',
                maxWidth: '90%'
              }}>
                <div style={{ width: 44, height: 44, background: 'var(--primary)', color: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={22} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>1,402+</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--mutedForeground)', marginTop: '0.25rem' }}>Verified Rural Facilities</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 24x7 EMERGENCY LIFELINE HOTLINES STRIP ---------------- */}
      <section className="home-section" style={{ background: '#f8fafc', borderTop: '1px solid var(--borderLight)', borderBottom: '1px solid var(--borderLight)', padding: '2.5rem 0' }}>
        <div className="np-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--emergency)', letterSpacing: '0.05em' }}>
                CRITICAL RESPONSE
              </span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--foreground)', margin: '4px 0 0 0' }}>
                National Emergency Toll-Free Lifelines
              </h3>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--mutedForeground)' }}>
              Accessible from any mobile or landline across all 36 States & UTs
            </span>
          </div>

          <div className="emergency-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1.25rem' }}>
            {emergencyLifelines.map((line) => (
              <a
                key={line.number}
                href={`tel:${line.number}`}
                className="emergency-lifeline-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.2rem 1.4rem',
                  background: '#ffffff',
                  border: `1.5px solid ${line.color}30`,
                  borderRadius: '14px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = line.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                  e.currentTarget.style.borderColor = `${line.color}30`;
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: line.bg, color: line.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem', flexShrink: 0 }}>
                  <Phone size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: line.color, lineHeight: 1.1 }}>
                    {line.number}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '2px' }}>
                    {line.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--mutedForeground)', marginTop: '2px', lineHeight: 1.3 }}>
                    {line.desc}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- QUICK HEALTHCARE ACTION CARDS ---------------- */}
      <section className="home-section" style={{ padding: '5rem 0 4rem 0', background: 'var(--background)' }}>
        <div className="np-container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem auto' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.08em' }}>
              INTELLIGENT RURAL ACCESS
            </span>
            <h2 className="np-h2" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
              Essential Clinical Services at Your Fingertips
            </h2>
            <p className="np-lede" style={{ fontSize: '1.05rem', color: 'var(--mutedForeground)' }}>
              Built specifically for the realities of rural infrastructure: slow connectivity, scattered specialists, and urgency when minutes matter.
            </p>
          </div>

          <div className="quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.75rem' }}>
            {quickActionCards.map((card, idx) => (
              <div
                key={idx}
                onClick={card.onClick}
                className="quick-action-card"
                style={{
                  background: card.highlight ? '#F0FDF4' : '#ffffff',
                  border: card.highlight ? '2px solid #86EFAC' : '1.5px solid var(--borderLight)',
                  borderRadius: '18px',
                  padding: '2rem 1.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 16px 32px rgba(8, 63, 61, 0.1)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)';
                  e.currentTarget.style.borderColor = card.highlight ? '#86EFAC' : 'var(--borderLight)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div style={{ width: 46, height: 46, borderRadius: '12px', background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                      {card.icon}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', background: card.highlight ? '#DCFCE7' : '#F1F5F9', color: card.highlight ? '#15803D' : '#475569', letterSpacing: '0.04em' }}>
                      {card.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.65rem' }}>
                    {card.title}
                  </h3>

                  <p style={{ fontSize: '0.9rem', color: 'var(--mutedForeground)', lineHeight: 1.55, marginBottom: '1.5rem' }}>
                    {card.desc}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <span>{card.actionText}</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- SANJEEVANI AI FLAGSHIP SHOWCASE SECTION ---------------- */}
      <section className="home-section" style={{ padding: '5rem 0', background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%)', borderTop: '1px solid #DCFCE7', borderBottom: '1px solid var(--borderLight)' }}>
        <div className="np-container">
          <div className="sanjeevani-showcase-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '3.5rem', alignItems: 'center' }}>
            
            {/* Left AI Description */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#DCFCE7', color: '#166534', padding: '6px 14px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', marginBottom: '1.25rem' }}>
                <Sparkles size={14} />
                FLAGSHIP AI INNOVATION • GROQ LPU
              </div>

              <h2 className="np-h2" style={{ marginBottom: '1.25rem', lineHeight: 1.2 }}>
                Sanjeevani AI: Real-Time GPS Health Copilot
              </h2>

              <p style={{ fontSize: '1.05rem', color: 'var(--mutedForeground)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                Trained for frontline rural triage, Sanjeevani AI combines <strong>Groq LLaMA 3.3 70B</strong> with real-time <strong>OpenStreetMap Overpass</strong> spatial querying. It accurately pinpoints verified facilities around the patient's actual GPS or IP location, generates distance in km, unclipped contact cards, and 1-touch 108 ambulance triggers.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" style={{ marginTop: '3px' }} />
                  <span style={{ fontSize: '0.925rem', color: 'var(--foreground)' }}>
                    <strong>100% Real Live Facilities:</strong> Queries Overpass API to return real hospitals, trauma centres, and CHCs instead of generic hallucinated text.
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" style={{ marginTop: '3px' }} />
                  <span style={{ fontSize: '0.925rem', color: 'var(--foreground)' }}>
                    <strong>Turn-by-Turn GPS Directions:</strong> 1-click Google Maps navigation routing so patients know the exact driving distance and ETA.
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" style={{ marginTop: '3px' }} />
                  <span style={{ fontSize: '0.925rem', color: 'var(--foreground)' }}>
                    <strong>Whisper Multilingual Voice:</strong> Speak natural Hindi, Gujarati, or English; AI extracts clinical vitals, symptoms, and urgency.
                  </span>
                </div>
              </div>

              <button
                className="np-btn np-btn-primary np-btn-lg mobile-full-width"
                onClick={() => handleLaunchAiPrompt('I have heart problem, give me nearby hospital')}
              >
                <MessageSquare size={18} />
                Open Sanjeevani AI Assistant
              </button>
            </div>

            {/* Right Interactive Prompt Launcher Card */}
            <div className="sanjeevani-prompt-card" style={{ background: '#ffffff', border: '1.5px solid #A7F3D0', borderRadius: '24px', padding: '2rem', boxShadow: '0 20px 40px rgba(16, 185, 129, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #F1F5F9', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }}></div>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>Try Sample Queries</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                  Click to Test Live
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {aiPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleLaunchAiPrompt(p.text)}
                    style={{
                      textAlign: 'left',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '1rem 1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#ECFDF5';
                      e.currentTarget.style.borderColor = '#10B981';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F8FAFC';
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#047857', marginBottom: '3px' }}>
                        {p.tag}
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)' }}>
                        "{p.text}"
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-emerald-600 shrink-0" />
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', fontSize: '0.75rem', color: '#92400E', lineHeight: 1.4 }}>
                ℹ️ <strong>Medical Safety Note:</strong> Sanjeevani AI is an AI-powered clinical decision support tool. It always prioritizes emergency stabilization and medical confirmation by licensed medical officers.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ---------------- 4-TIER ECOSYSTEM PILLARS ---------------- */}
      <section className="home-section" style={{ padding: '5rem 0', background: 'var(--background)' }}>
        <div className="np-container">
          <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 3.5rem auto' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.08em' }}>
              CROSS-TIER CLINICAL CONTINUITY
            </span>
            <h2 className="np-h2" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
              The 4-Tier Unified Rural Care Fabric
            </h2>
            <p className="np-lede" style={{ fontSize: '1.05rem', color: 'var(--mutedForeground)' }}>
              Bridging the communication chasm between remote villages, primary health centres, secondary district hospitals, and state medical monitoring.
            </p>
          </div>

          <div className="ecosystem-pillars-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '2rem' }}>
            {ecosystemPillars.map((pillar, idx) => (
              <div
                key={idx}
                className="ecosystem-pillar-card"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid var(--borderLight)',
                  borderRadius: '18px',
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 16px 32px rgba(8, 63, 61, 0.08)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)';
                  e.currentTarget.style.borderColor = 'var(--borderLight)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#E6F4F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {pillar.icon}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', background: '#F0FDF4', padding: '3px 8px', borderRadius: '6px' }}>
                      {pillar.tag}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
                    {pillar.role}
                  </h3>

                  <p style={{ fontSize: '0.875rem', color: 'var(--mutedForeground)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    {pillar.summary}
                  </p>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {pillar.features.map((feat, fIdx) => (
                      <li key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.825rem', color: '#334155', lineHeight: 1.4 }}>
                        <CheckCircle2 size={15} className="text-emerald-600 shrink-0" style={{ marginTop: '2px' }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to={pillar.route}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: 'var(--primary)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#ECFDF5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#F8FAFC'}
                >
                  <span>Access {pillar.role.split(' ')[0]} Portal</span>
                  <ChevronRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS (3-STEP CARE WORKFLOW) ---------------- */}
      <section className="home-section" style={{ padding: '5rem 0', background: '#F8FAFC', borderTop: '1px solid var(--borderLight)', borderBottom: '1px solid var(--borderLight)' }}>
        <div className="np-container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem auto' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.08em' }}>
              STEP-BY-STEP WORKFLOW
            </span>
            <h2 className="np-h2" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
              How GraminArogya Saves Lives
            </h2>
            <p className="np-lede" style={{ fontSize: '1.05rem', color: 'var(--mutedForeground)' }}>
              From village doorstep to specialized district trauma ward in three seamless, unbroken steps.
            </p>
          </div>

          <div className="workflow-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '2rem' }}>
            
            {/* Step 1 */}
            <div className="workflow-step-card" style={{ background: '#ffffff', borderRadius: '18px', padding: '2.25rem 2rem', border: '1.5px solid var(--borderLight)', position: 'relative' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0B6B68', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>
                1
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.75rem' }}>
                Village Intake & Voice Triage
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--mutedForeground)', lineHeight: 1.6 }}>
                Frontline ASHA worker or citizen speaks symptoms in their native mother tongue (Hindi, Gujarati, English). The AI parses audio into structured clinical JSON, extracts vitals, and flags severity (<code>RED_CRITICAL</code>, <code>YELLOW_URGENT</code>, <code>GREEN_ROUTINE</code>).
              </p>
            </div>

            {/* Step 2 */}
            <div className="workflow-step-card" style={{ background: '#ffffff', borderRadius: '18px', padding: '2.25rem 2rem', border: '1.5px solid var(--borderLight)', position: 'relative' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0B6B68', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>
                2
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.75rem' }}>
                Resource-Aware Routing
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--mutedForeground)', lineHeight: 1.6 }}>
                Rather than sending the patient to a hospital that lacks an on-duty specialist or oxygen beds, the system checks real-time capacity and directs the ambulance or patient to the nearest fully equipped facility.
              </p>
            </div>

            {/* Step 3 */}
            <div className="workflow-step-card" style={{ background: '#ffffff', borderRadius: '18px', padding: '2.25rem 2rem', border: '1.5px solid var(--borderLight)', position: 'relative' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0B6B68', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>
                3
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.75rem' }}>
                QR Referral Handover
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--mutedForeground)', lineHeight: 1.6 }}>
                A unique <code>GA-REF-XXXXXX</code> digital referral slip is generated with an encrypted QR passport. The receiving District Hospital doctor scans it to instantly load the patient's entire visit history — 100% data loss prevented.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ---------------- NATIONAL HEALTH SCHEMES & PROGRAMS ---------------- */}
      <section className="home-section" style={{ padding: '5rem 0', background: 'var(--background)' }}>
        <div className="np-container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '3rem' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.08em' }}>
                PUBLIC HEALTH INITIATIVES
              </span>
              <h2 className="np-h2" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                National Rural Health Schemes
              </h2>
              <p className="np-lede" style={{ fontSize: '1rem', color: 'var(--mutedForeground)', maxWidth: '600px' }}>
                Essential healthcare entitlements and social security coverage guaranteed for rural families by the Ministry of Health and Family Welfare.
              </p>
            </div>
            <Link
              to="/articles"
              className="np-btn np-btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
            >
              <span>View All Health Guides</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="national-schemes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '2rem' }}>
            {nationalPrograms.map((prog, idx) => (
              <div
                key={idx}
                className="national-scheme-card"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid var(--borderLight)',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 16px 32px rgba(8, 63, 61, 0.08)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)';
                  e.currentTarget.style.borderColor = 'var(--borderLight)';
                }}
              >
                <div style={{ position: 'relative', width: '100%', height: '170px' }}>
                  <img src={prog.image} alt={prog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backdropFilter: 'blur(4px)' }}>
                    {prog.badge}
                  </span>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>
                      {prog.subtitle}
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.65rem' }}>
                      {prog.title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--mutedForeground)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                      {prog.desc}
                    </p>
                  </div>

                  <Link
                    to={prog.link}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--primary)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #F1F5F9'
                    }}
                  >
                    <span>Read Entitlement Guide</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        /* Tablet & Intermediate Viewports */
        @media (max-width: 1024px) {
          .np-hero-grid {
            gap: 2.5rem !important;
          }
          .sanjeevani-showcase-grid {
            gap: 2.5rem !important;
          }
        }

        /* Mobile & Small Tablets (<= 768px) */
        @media (max-width: 768px) {
          .np-hero {
            padding: 2.25rem 0 3rem 0 !important;
          }
          .home-section {
            padding: 2.75rem 0 !important;
          }
          .np-hero-headline-row {
            margin-bottom: 1.25rem !important;
            padding-bottom: 0.75rem !important;
          }
          .np-hero-actions {
            margin-top: 1.75rem !important;
            flex-direction: column !important;
            width: 100% !important;
          }
          .np-hero-actions button {
            width: 100% !important;
            justify-content: center !important;
            padding: 14px 20px !important;
          }
          .np-trust-strip {
            margin-top: 2rem !important;
            gap: 0.75rem !important;
          }
          .np-hero-right {
            margin-top: 2.5rem !important;
            width: 100% !important;
          }
          .np-hero-right > div:first-child {
            max-width: 100% !important;
            aspect-ratio: 16/11 !important;
            border-radius: 16px !important;
          }
          .hero-floating-stat {
            position: relative !important;
            bottom: auto !important;
            left: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            margin-top: 1rem !important;
            box-sizing: border-box !important;
          }
          .sanjeevani-showcase-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .quick-actions-grid,
          .ecosystem-pillars-grid,
          .workflow-steps-grid,
          .national-schemes-grid {
            grid-template-columns: 1fr !important;
            gap: 1.25rem !important;
          }
          .quick-action-card,
          .ecosystem-pillar-card,
          .workflow-step-card {
            padding: 1.5rem 1.25rem !important;
            border-radius: 14px !important;
          }
          .sanjeevani-prompt-card {
            padding: 1.25rem 1rem !important;
            border-radius: 16px !important;
          }
        }

        /* Small Phones (<= 480px, e.g. 320px - 414px) */
        @media (max-width: 480px) {
          .home-section {
            padding: 2rem 0 !important;
          }
          .emergency-grid {
            grid-template-columns: 1fr !important;
            gap: 0.85rem !important;
          }
          .emergency-lifeline-card {
            padding: 1rem !important;
            border-radius: 12px !important;
          }
          .quick-action-card,
          .ecosystem-pillar-card,
          .workflow-step-card {
            padding: 1.25rem 1rem !important;
          }
          .np-h1 {
            font-size: 1.85rem !important;
            line-height: 1.2 !important;
          }
          .np-h2 {
            font-size: 1.35rem !important;
            line-height: 1.25 !important;
          }
          .np-lede {
            font-size: 0.95rem !important;
          }
        }
      `}</style>
    </>
  );
}
