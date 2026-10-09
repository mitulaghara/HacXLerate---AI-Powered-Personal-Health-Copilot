import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Phone, Lock, Menu, X } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';

import PublicFooter from '../components/PublicFooter';

export default function PublicLayout({ 
  today, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen, 
  setIsSOSOpen, 
  setIsAuthOpen 
}) {
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ---------------- UTILITY STRIP ---------------- */}
      <div className="np-utility">
        <div className="np-container np-utility-inner">
          <span>
            <span className="np-utility-dot" />
            Edition 2026 · {today}
          </span>
          <div className="np-utility-links">
            <Link to="/articles" style={{ color: 'inherit', textDecoration: 'none' }}>हिन्दी Advisories</Link>
            <Link to="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>Accessibility</Link>
            <Link to="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>Helpline 104</Link>
            <Link to="/find-care" style={{ color: 'inherit', textDecoration: 'none' }}>Sitemap</Link>
          </div>
        </div>
      </div>

      {/* ---------------- HEADER ---------------- */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--background)', borderBottom: '1px solid var(--borderLight)' }}>
        <div className="np-container" style={{ maxWidth: '1500px', width: '100%' }}>
          <div className="public-header-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 'clamp(60px, 7vw, 80px)' }}>
            
            {/* BRAND */}
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <img src="/images/logo.png" alt="GraminArogya Logo" style={{ height: 'clamp(42px, 5.5vw, 64px)', width: 'auto', objectFit: 'contain' }} />
              </Link>
            </div>

            {/* NAVIGATION */}
            <nav className="desktop-nav" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '1.5rem', alignItems: 'center' }} aria-label="Primary">
              <div className="brand-text-hide" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--mutedForeground)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                  <span>RURAL HEALTH</span>
                </div>
              </div>
              {[
                { label: 'Services', path: '/services' },
                { label: 'Find Care', path: '/find-care' },
                { label: 'Network', path: '/network' },
                { label: 'Health Articles', path: '/articles' },
                { label: 'Contact', path: '/contact' },
              ].map(link => {
                const isActive = location.pathname === link.path;
                return (
                  <Link 
                    key={link.label} 
                    to={link.path} 
                    style={{ 
                      fontFamily: 'var(--font-body)', 
                      fontSize: '0.9375rem', 
                      fontWeight: 500, 
                      color: isActive ? 'var(--primary)' : 'var(--mutedForeground)', 
                      textDecoration: 'none', 
                      transition: 'all 0.2s', 
                      whiteSpace: 'nowrap',
                      borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                      paddingBottom: '0.25rem'
                    }}
                    onMouseEnter={e => { if(!isActive) e.currentTarget.style.color = 'var(--foreground)'}}
                    onMouseLeave={e => { if(!isActive) e.currentTarget.style.color = 'var(--mutedForeground)'}}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* ACTIONS */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
              <div className="mobile-hidden">
                <LanguageSelector />
              </div>
              <button
                className="np-btn mobile-hidden"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', background: '#FEF2F2', color: 'var(--emergency)', border: '1px solid #FCA5A5', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => setIsSOSOpen(true)}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--emergency)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = 'var(--emergency)'; }}
                aria-label="Emergency SOS"
              >
                <Phone size={14} strokeWidth={2} />
                Emergency
              </button>
              <Link
                to="/sign-in"
                className="np-btn mobile-hidden"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', background: 'var(--primary)', color: '#fff', border: '1px solid var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#083F3D'; e.currentTarget.style.borderColor = '#083F3D'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
              >
                <Lock size={14} strokeWidth={2} />
                Sign In
              </Link>
              
              {/* Mobile Hamburger */}
              <button 
                className="hamburger-btn np-btn" 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'none' }}
              >
                {isMobileMenuOpen ? (
                  <X size={24} strokeWidth={2} />
                ) : (
                  <Menu size={24} strokeWidth={2} />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-dropdown">
              {[
                  { label: 'Home', path: '/' },
                  { label: 'Services', path: '/services' },
                  { label: 'Find Care', path: '/find-care' },
                  { label: 'Network', path: '/network' },
                  { label: 'Health Articles', path: '/articles' },
                  { label: 'Contact', path: '/contact' },
              ].map(link => (
              <Link 
                key={link.label} 
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 600, color: 'var(--foreground)', textDecoration: 'none', padding: '0.5rem 0' }}
              >
                {link.label}
              </Link>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <LanguageSelector />
              </div>
              <button
                className="np-btn"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', background: '#FEF2F2', color: 'var(--emergency)', border: '1px solid #FCA5A5', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600 }}
                onClick={() => { setIsSOSOpen(true); setIsMobileMenuOpen(false); }}
              >
                <Phone size={14} /> Emergency
              </button>
              <Link
                to="/sign-in"
                className="np-btn"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--primary)', color: '#fff', border: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Lock size={14} /> Sign In
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>

      {/* ---------------- PUBLIC FOOTER ---------------- */}
      <footer className="public-footer" style={{ background: '#F3F8F6', padding: '4rem 0 2rem 0', color: 'var(--foreground)', marginTop: 'auto', borderTop: '1px solid var(--borderLight)' }}>
        <div className="np-container">
          <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem', marginBottom: '4rem' }}>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <img src="/images/logo.png" alt="GraminArogya Logo" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--mutedForeground)', lineHeight: 1.6, marginBottom: '2rem' }}>
                A unified digital health network empowering rural communities with immediate access to verified medical facilities, emergency services, and trusted healthcare professionals.
              </p>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--foreground)', background: 'rgba(0,0,0,0.05)', padding: '0.5rem 1rem', display: 'inline-block', borderRadius: '4px', fontWeight: 600 }}>
                NATIONAL HEALTH MISSION
              </div>
            </div>

            <div>
              <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>NETWORK</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li><Link to="/find-care" style={{ color: 'var(--mutedForeground)', textDecoration: 'none', fontSize: '0.875rem' }}>Hospitals & PHCs</Link></li>
                <li><Link to="/find-care" style={{ color: 'var(--mutedForeground)', textDecoration: 'none', fontSize: '0.875rem' }}>Verified Doctors</Link></li>
                <li><Link to="/find-care" style={{ color: 'var(--mutedForeground)', textDecoration: 'none', fontSize: '0.875rem' }}>Blood Bank Locator</Link></li>
                <li><Link to="/services" style={{ color: 'var(--mutedForeground)', textDecoration: 'none', fontSize: '0.875rem' }}>Emergency Services</Link></li>
                <li><Link to="/network" style={{ color: 'var(--mutedForeground)', textDecoration: 'none', fontSize: '0.875rem' }}>ASHA Workers</Link></li>
                <li><Link to="/contact" style={{ color: 'var(--mutedForeground)', textDecoration: 'none', fontSize: '0.875rem' }}>Contact Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>HEALTH ARTICLES</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li><Link to="/articles" style={{ color: 'var(--mutedForeground)', textDecoration: 'none', fontSize: '0.875rem' }}>Maternal Care (JSSK)</Link></li>
                <li><Link to="/articles" style={{ color: 'var(--mutedForeground)', textDecoration: 'none', fontSize: '0.875rem' }}>Immunisation Schedule</Link></li>
                <li><Link to="/articles" style={{ color: 'var(--mutedForeground)', textDecoration: 'none', fontSize: '0.875rem' }}>Health Insurance (PM-JAY)</Link></li>
                <li><Link to="/articles" style={{ color: 'var(--mutedForeground)', textDecoration: 'none', fontSize: '0.875rem' }}>Nutrition Guidelines</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>EMERGENCY CONTACTS</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 40, height: 40, background: '#FEF2F2', color: 'var(--emergency)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '1px solid #FCA5A5' }}>
                    <Phone size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--foreground)' }}>108</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--mutedForeground)' }}>Ambulance</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 40, height: 40, background: '#fff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '1px solid var(--borderLight)' }}>
                    <Phone size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--foreground)' }}>104</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--mutedForeground)' }}>Health Helpline</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
          
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--mutedForeground)' }}>
              © 2026 GraminArogya Network. All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--mutedForeground)', flexWrap: 'wrap' }}>
              <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = '#0B6B68'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>Privacy Policy</Link>
              <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = '#0B6B68'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>Terms of Service</Link>
              <Link to="/contact" style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = '#0B6B68'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>Contact Us</Link>
              <Link to="/nodal-officers" style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = '#0B6B68'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>Nodal Officers</Link>
            </div>
          </div>
        </div>
      </footer>
      <style>{`
        @media (max-width: 768px) {
          .public-footer {
            padding: 2.5rem 0 1.5rem 0 !important;
          }
          .public-footer .mobile-grid-1 {
            gap: 2rem !important;
            margin-bottom: 2rem !important;
          }
          .mobile-menu-dropdown {
            padding: 1.25rem 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
