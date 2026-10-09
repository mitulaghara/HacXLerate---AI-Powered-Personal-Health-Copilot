import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import {
  HeartPulse,
  LogOut,
  Lock,
  Menu,
  Stethoscope,
  User,
  AlertTriangle,
  X as XIcon,
  ChevronRight,
  ChevronDown,
  Droplet,
  Phone,
  Search,
  FileText,
  Calendar,
  Sparkles,
  UserCheck,
  Bell,
  Activity,
  Share2,
  MapPin,
  Building2,
  BookOpen,
  LayoutDashboard
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { ROLE_NAV_ITEMS, getRoleDefaultTab } from '../utils/navigationConfig';
import { api } from '../utils/api';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenSOS,
  onOpenBlood,
  currentUser,
  onLogout
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [pendingRemindersCount, setPendingRemindersCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [doctorPhoto, setDoctorPhoto] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.nav-dropdown-wrapper')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch doctor profile data & reminders count when user is doctor
  useEffect(() => {
    if (currentUser?.role === 'doctor') {
      const fetchDoctorData = async () => {
        try {
          const [remindersRes, profileRes] = await Promise.allSettled([
            api.getDoctorReminders(),
            api.getDoctorProfile()
          ]);
          
          if (remindersRes.status === 'fulfilled' && remindersRes.value?.success && remindersRes.value.reminders) {
            setPendingRemindersCount(remindersRes.value.reminders.filter(r => r.status === 'PENDING').length);
          }
          if (profileRes.status === 'fulfilled' && profileRes.value?.success && profileRes.value.profile?.profilePhoto) {
            setDoctorPhoto(profileRes.value.profile.profilePhoto);
          }
        } catch (e) {
          console.warn('Failed to load doctor navbar data:', e);
        }
      };

      fetchDoctorData();
      const interval = setInterval(fetchDoctorData, 12000);
      return () => clearInterval(interval);
    }
  }, [currentUser, activeTab]);

  // Lock background body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [mobileMenuOpen]);

  const navItems = (() => {
    if (!currentUser) return ROLE_NAV_ITEMS['asha'] || [];
    const role = currentUser.role;
    return ROLE_NAV_ITEMS[role] || ROLE_NAV_ITEMS['citizen'] || [];
  })();

  const handleBrandClick = () => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
    if (currentUser?.role === 'doctor') {
      setActiveTab('doctor');
      navigate('/doctor');
    } else if (currentUser?.role === 'patient' || currentUser?.role === 'citizen') {
      setActiveTab('patientProfile');
      navigate('/profile');
    } else if (currentUser) {
      setActiveTab(getRoleDefaultTab(currentUser.role));
    } else {
      navigate('/');
    }
  };

  const handleProfileClick = () => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
    if (currentUser?.role === 'doctor') {
      setActiveTab('profile');
      navigate('/doctor/profile');
    } else if (currentUser?.role === 'admin') {
      setActiveTab('adminProfile');
      navigate('/admin/profile');
    } else if (currentUser?.role === 'staff' || currentUser?.role === 'asha') {
      setActiveTab('staffProfile');
      navigate('/staff/profile');
    } else {
      setActiveTab('patientProfile');
      navigate('/profile');
    }
  };

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    setOpenDropdown(null);

    if (currentUser?.role === 'doctor') {
      if (tabId === 'dashboard' || tabId === 'doctor') navigate('/doctor');
      else if (tabId === 'history') navigate('/doctor/patients');
      else if (tabId === 'consultation') navigate('/doctor/consultation');
      else if (tabId === 'prescriptions') navigate('/doctor/prescriptions');
      else if (tabId === 'reminders') navigate('/doctor/follow-ups');
      else if (tabId === 'leaveSchedule') navigate('/doctor/schedule');
      else if (tabId === 'branding') navigate('/doctor/branding');
      else if (tabId === 'profile') navigate('/doctor/profile');
      else if (tabId === 'phoneFetch') navigate('/doctor/patients/lookup');
      else if (tabId === 'referrals') navigate('/doctor/referrals');
      else if (tabId === 'diagnostics') navigate('/doctor/diagnostics');
      else if (tabId === 'emergency') navigate('/doctor/emergency');
      else if (tabId === 'notifications') navigate('/doctor/notifications');
      else if (tabId === 'services') navigate('/services');
      else if (tabId === 'network') navigate('/network');
      else if (tabId === 'articles') navigate('/articles');
      else if (tabId === 'contact') navigate('/contact');
      else if (tabId === 'routing') navigate('/find-care');
    } else if (currentUser?.role === 'patient' || currentUser?.role === 'citizen') {
      if (tabId === 'patientProfile' || tabId === 'profile') navigate('/profile');
      else if (tabId === 'routing') navigate('/find-care');
      else if (tabId === 'referrals') navigate('/referrals');
      else if (tabId === 'services') navigate('/services');
      else if (tabId === 'network') navigate('/network');
      else if (tabId === 'articles') navigate('/articles');
      else if (tabId === 'contact') navigate('/contact');
    } else {
      if (tabId === 'services') navigate('/services');
      else if (tabId === 'network') navigate('/network');
      else if (tabId === 'articles') navigate('/articles');
      else if (tabId === 'contact') navigate('/contact');
      else if (tabId === 'routing') navigate('/find-care');
    }
  };

  const handleBloodAction = () => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
    onOpenBlood();
  };

  const handleSOSAction = () => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
    onOpenSOS();
  };

  const handleLogoutAction = () => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
    onLogout();
  };

  const toggleDropdown = (name) => {
    setOpenDropdown(prev => prev === name ? null : name);
  };

  const isPatientOrCitizen = currentUser?.role === 'patient' || currentUser?.role === 'citizen';
  const isDoctor = currentUser?.role === 'doctor';
  const isStaffOrAsha = currentUser?.role === 'staff' || currentUser?.role === 'asha';
  const effectiveDoctorPhoto = doctorPhoto || currentUser?.profilePhoto || currentUser?.photo || '';

  // Clean doctor name parsing (avoid "Dr. Dr.")
  const getDisplayName = () => {
    const name = currentUser?.name || currentUser?.username || 'User';
    if (isDoctor) {
      const trimmed = name.trim();
      if (trimmed.toLowerCase().startsWith('dr.') || trimmed.toLowerCase().startsWith('dr ')) {
        return trimmed.split(' ').slice(0, 2).join(' ');
      }
      return `Dr. ${trimmed.split(' ')[0]}`;
    }
    return name.split(' ')[0];
  };

  // Check if any doctor clinical desk module is currently active
  const isDoctorDeskActive = ['history', 'prescriptions', 'leaveSchedule', 'branding', 'phoneFetch'].includes(activeTab);

  return (
    <header className="navbar-root" style={{ position: 'sticky', top: 0, zIndex: 100, background: '#ffffff', borderBottom: '1px solid var(--borderLight)', width: '100%', maxWidth: '100vw', boxSizing: 'border-box' }}>
      <style>{`
        /* Global Navbar Resets */
        .navbar-root * {
          box-sizing: border-box;
        }

        /* Desktop Header: Visible on > 1024px */
        .desktop-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
          padding: 0 1.25rem;
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          box-sizing: border-box;
          gap: 0.75rem;
        }

        /* Mobile Header: Visible on <= 1024px */
        .mobile-header-bar {
          display: none;
        }

        @media (max-width: 1024px) {
          .desktop-header-bar {
            display: none !important;
          }
          .mobile-header-bar {
            display: flex !important;
            align-items: center;
            justify-content: space-between;
            height: 60px;
            padding: 0 14px;
            width: 100%;
            background: #ffffff;
            box-sizing: border-box;
          }
        }

        /* Fluid desktop responsiveness for mid-size laptops */
        @media (max-width: 1240px) {
          .brand-text-hide {
            display: none !important;
          }
          .desktop-header-bar {
            padding: 0 0.75rem;
            gap: 0.5rem;
          }
        }

        @media (max-width: 1120px) {
          .blood-label, .sos-label {
            display: none !important;
          }
        }

        /* Dropdown Components */
        .nav-dropdown-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .nav-dropdown-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--mutedForeground);
          font-family: var(--font-body);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .nav-dropdown-btn:hover,
        .nav-dropdown-btn.open {
          color: var(--primary);
          background: rgba(11, 107, 104, 0.08);
        }
        .nav-dropdown-btn.active {
          color: var(--primary);
          font-weight: 600;
          background: rgba(11, 107, 104, 0.08);
        }

        .nav-dropdown-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          min-width: 240px;
          background: #ffffff;
          border: 1px solid var(--borderLight);
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
          padding: 6px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: dropdownFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nav-dropdown-menu.align-right {
          left: auto;
          right: 0;
        }

        .nav-dropdown-header {
          padding: 8px 12px 6px 12px;
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--mutedForeground);
          border-bottom: 1px solid var(--borderLight);
          margin-bottom: 4px;
        }

        .nav-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--foreground);
          font-family: var(--font-body);
          font-size: 0.85rem;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
        }
        .nav-dropdown-item:hover {
          background: rgba(11, 107, 104, 0.06);
          color: var(--primary);
        }
        .nav-dropdown-item.active {
          background: rgba(11, 107, 104, 0.1);
          color: var(--primary);
          font-weight: 600;
        }

        .nav-dropdown-item-desc {
          font-size: 0.72rem;
          color: var(--mutedForeground);
          margin-top: 1px;
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Mobile Drawer Full Screen Opaque Container */
        .mobile-drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          background: #ffffff;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          animation: drawerSlideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes drawerSlideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Navigation Row Styling */
        .drawer-nav-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 12px 16px;
          min-height: 52px;
          background: transparent;
          border: none;
          border-bottom: 1px solid #f1f5f9;
          border-left: 4px solid transparent;
          cursor: pointer;
          text-align: left;
          transition: background-color 0.15s ease;
        }
        .drawer-nav-row:hover {
          background: #f8fafc;
        }
        .drawer-nav-row.active {
          background: #f0fdf4;
          border-left-color: #0d9488;
        }

        .drawer-nav-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          color: #475569;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .drawer-nav-row.active .drawer-nav-icon-box {
          background: #0d9488;
          color: #ffffff;
        }

        .drawer-nav-title {
          font-size: 0.92rem;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.2;
        }
        .drawer-nav-row.active .drawer-nav-title {
          color: #0f766e;
          font-weight: 700;
        }

        .drawer-nav-desc {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 2px;
          line-height: 1.2;
        }
      `}</style>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. MOBILE TOP HEADER (<= 1024px)                                  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="mobile-header-bar">
        {/* Brand Logo & Active Field Worker State */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div
            onClick={handleBrandClick}
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            title="GraminArogya Home"
          >
            <img
              src="/images/logo.png"
              alt="GraminArogya"
              style={{ height: '34px', width: 'auto', objectFit: 'contain' }}
            />
          </div>
          {isStaffOrAsha && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              ASHA Portal
            </span>
          )}
        </div>

        {/* Right Header Actions: 108 SOS & Hamburger Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          
          {/* Add language selector to mobile */}
          <div className="mobile-lang-wrapper" style={{ transform: 'scale(0.85)' }}>
            <LanguageSelector />
          </div>

          <button
            type="button"
            onClick={handleSOSAction}
            aria-label="108 Emergency SOS"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#FEF2F2',
              color: 'var(--emergency)',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: '38px',
              whiteSpace: 'nowrap'
            }}
          >
            <Phone size={13} strokeWidth={2.5} />
            <span>108 SOS</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            style={{
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: mobileMenuOpen ? '#f1f5f9' : '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#0f172a',
              cursor: 'pointer',
              padding: 0,
              transition: 'background-color 0.15s ease'
            }}
          >
            {mobileMenuOpen ? <XIcon size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. DESKTOP HEADER (> 1024px) WITH STREAMLINED DROPDOWN NAVIGATION  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="desktop-header-bar">
        {/* Brand */}
        <div
          onClick={handleBrandClick}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flexShrink: 0 }}
          title="GraminArogya Home"
        >
          <img src="/images/logo.png" alt="GraminArogya Logo" style={{ height: '44px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
          <div className="brand-text-hide" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: 'var(--primary)',
                background: 'rgba(11, 107, 104, 0.08)',
                padding: '2px 6px',
                borderRadius: '4px',
                letterSpacing: '0.04em'
              }}>
                NRHM
              </span>
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--mutedForeground)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
              Rural Health Access & Care
            </span>
            {isStaffOrAsha && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                padding: '2px 7px',
                borderRadius: '10px',
                fontSize: '0.625rem',
                fontWeight: 700,
                marginTop: '1px',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                ASHA Field Portal Active
              </span>
            )}
          </div>
        </div>

        {/* Center Navigation: Streamlined Dropdown Navigation */}
        <nav className="desktop-nav" style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }} aria-label="Primary">
          
          {/* 1. RURAL HEALTH DROPDOWN (Matches Public Website) */}
          <div className="nav-dropdown-wrapper">
            <button
              type="button"
              className={`nav-dropdown-btn ${openDropdown === 'ruralHealth' ? 'open' : ''}`}
              onClick={() => toggleDropdown('ruralHealth')}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em' }}>RURAL HEALTH</span>
              <ChevronDown size={13} strokeWidth={2} style={{ transition: 'transform 0.2s', transform: openDropdown === 'ruralHealth' ? 'rotate(180deg)' : 'none' }} />
            </button>

            {openDropdown === 'ruralHealth' && (
              <div className="nav-dropdown-menu">
                <div className="nav-dropdown-header">Access & Services</div>
                <Link
                  to="/services"
                  className="nav-dropdown-item"
                  onClick={() => setOpenDropdown(null)}
                >
                  <Activity size={15} strokeWidth={2} color="var(--primary)" />
                  <div>
                    <div>Health Services</div>
                    <div className="nav-dropdown-item-desc">Preventive & Primary Care</div>
                  </div>
                </Link>
                <Link
                  to="/find-care"
                  className="nav-dropdown-item"
                  onClick={() => setOpenDropdown(null)}
                >
                  <MapPin size={15} strokeWidth={2} color="var(--primary)" />
                  <div>
                    <div>Find Care</div>
                    <div className="nav-dropdown-item-desc">Nearby Clinics & CHCs</div>
                  </div>
                </Link>
                <Link
                  to="/network"
                  className="nav-dropdown-item"
                  onClick={() => setOpenDropdown(null)}
                >
                  <Building2 size={15} strokeWidth={2} color="var(--primary)" />
                  <div>
                    <div>Care Network</div>
                    <div className="nav-dropdown-item-desc">District Facilities & ICU</div>
                  </div>
                </Link>
                <Link
                  to="/articles"
                  className="nav-dropdown-item"
                  onClick={() => setOpenDropdown(null)}
                >
                  <BookOpen size={15} strokeWidth={2} color="var(--primary)" />
                  <div>
                    <div>Health Articles</div>
                    <div className="nav-dropdown-item-desc">Advisories & Guides</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* 2. DOCTOR WORKSPACE DROPDOWN (For Doctor role) */}
          {isDoctor && (
            <div className="nav-dropdown-wrapper">
              <button
                type="button"
                className={`nav-dropdown-btn ${isDoctorDeskActive ? 'active' : ''} ${openDropdown === 'doctorDesk' ? 'open' : ''}`}
                onClick={() => toggleDropdown('doctorDesk')}
              >
                <Stethoscope size={15} strokeWidth={isDoctorDeskActive ? 2 : 1.75} />
                <span>Doctor Desk</span>
                <ChevronDown size={13} strokeWidth={2} style={{ transition: 'transform 0.2s', transform: openDropdown === 'doctorDesk' ? 'rotate(180deg)' : 'none' }} />
              </button>

              {openDropdown === 'doctorDesk' && (
                <div className="nav-dropdown-menu" style={{ minWidth: '260px' }}>
                  <div className="nav-dropdown-header">Clinical Tools & Workspace</div>
                  <button
                    type="button"
                    className={`nav-dropdown-item ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => handleNavClick('history')}
                  >
                    <Stethoscope size={15} strokeWidth={2} color="#059669" />
                    <div>
                      <div>Patient History</div>
                      <div className="nav-dropdown-item-desc">Medical Records & Timeline</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`nav-dropdown-item ${activeTab === 'prescriptions' ? 'active' : ''}`}
                    onClick={() => handleNavClick('prescriptions')}
                  >
                    <FileText size={15} strokeWidth={2} color="#0ea5e9" />
                    <div>
                      <div>Rx Pad & Print</div>
                      <div className="nav-dropdown-item-desc">Clinical Prescriptions</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`nav-dropdown-item ${activeTab === 'leaveSchedule' ? 'active' : ''}`}
                    onClick={() => handleNavClick('leaveSchedule')}
                  >
                    <Calendar size={15} strokeWidth={2} color="#7c3aed" />
                    <div>
                      <div>Leave & Schedule</div>
                      <div className="nav-dropdown-item-desc">Duty Roster & Time-off</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`nav-dropdown-item ${activeTab === 'branding' ? 'active' : ''}`}
                    onClick={() => handleNavClick('branding')}
                  >
                    <Sparkles size={15} strokeWidth={2} color="#ec4899" />
                    <div>
                      <div>Custom Branding</div>
                      <div className="nav-dropdown-item-desc">Letterhead & Signature</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`nav-dropdown-item ${activeTab === 'phoneFetch' ? 'active' : ''}`}
                    onClick={() => handleNavClick('phoneFetch')}
                  >
                    <Phone size={15} strokeWidth={2} color="#475569" />
                    <div>
                      <div>Mobile Lookup</div>
                      <div className="nav-dropdown-item-desc">Search by Mobile Number</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. DOCTOR REMINDERS (Direct Notification Button with live badge) */}
          {isDoctor && (
            <button
              type="button"
              onClick={() => handleNavClick('reminders')}
              className={`nav-dropdown-btn ${activeTab === 'reminders' ? 'active' : ''}`}
              title="Patient Follow-ups & Reminders"
            >
              <Bell size={15} strokeWidth={activeTab === 'reminders' ? 2 : 1.75} />
              <span>Reminders</span>
              {pendingRemindersCount > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '10px',
                  lineHeight: 1
                }}>
                  {pendingRemindersCount}
                </span>
              )}
            </button>
          )}

          {/* 4. ASHA / STAFF NAVIGATION DROPDOWN */}
          {!isDoctor && !isPatientOrCitizen && (
            <div className="nav-dropdown-wrapper">
              <button
                type="button"
                className={`nav-dropdown-btn ${openDropdown === 'fieldTools' ? 'open' : ''}`}
                onClick={() => toggleDropdown('fieldTools')}
              >
                <Activity size={15} strokeWidth={1.75} />
                <span>Field Portal</span>
                <ChevronDown size={13} strokeWidth={2} style={{ transition: 'transform 0.2s', transform: openDropdown === 'fieldTools' ? 'rotate(180deg)' : 'none' }} />
              </button>

              {openDropdown === 'fieldTools' && (
                <div className="nav-dropdown-menu">
                  <div className="nav-dropdown-header">Field Operations</div>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`nav-dropdown-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => handleNavClick(item.id)}
                      >
                        <Icon size={15} strokeWidth={2} color={item.color || 'var(--primary)'} />
                        <div>
                          <div>{item.label}</div>
                          {item.description && <div className="nav-dropdown-item-desc">{item.description}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 5. PATIENT / CITIZEN NAVIGATION */}
          {isPatientOrCitizen && navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`nav-dropdown-btn ${activeTab === item.id ? 'active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Actions Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          
          <LanguageSelector />
          
          {/* User Profile Chip with Dropdown */}
          <div className="nav-dropdown-wrapper">
            <div
              onClick={() => toggleDropdown('userMenu')}
              title="Click for Profile Menu"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '8px',
                background: '#ffffff',
                border: openDropdown === 'userMenu' ? '1px solid var(--primary)' : '1px solid var(--borderLight)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.background = 'rgba(11, 107, 104, 0.04)';
              }}
              onMouseLeave={(e) => {
                if (openDropdown !== 'userMenu') {
                  e.currentTarget.style.borderColor = 'var(--borderLight)';
                  e.currentTarget.style.background = '#ffffff';
                }
              }}
            >
              {effectiveDoctorPhoto ? (
                <img
                  src={effectiveDoctorPhoto}
                  alt={currentUser?.name || 'Doctor'}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid var(--primary)',
                    flexShrink: 0
                  }}
                />
              ) : (
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(11, 107, 104, 0.1)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <User size={15} strokeWidth={2} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                  {getDisplayName()}
                </span>
                <span style={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--primary)'
                }}>
                  {currentUser?.role || 'Staff'}
                </span>
              </div>
              <ChevronDown size={13} strokeWidth={2} style={{ color: 'var(--mutedForeground)', marginLeft: '1px', transform: openDropdown === 'userMenu' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>

            {openDropdown === 'userMenu' && (
              <div className="nav-dropdown-menu align-right" style={{ minWidth: '220px' }}>
                <div className="nav-dropdown-header">
                  {currentUser?.name || currentUser?.username || 'Authenticated User'}
                </div>
                <button
                  type="button"
                  className="nav-dropdown-item"
                  onClick={handleProfileClick}
                >
                  <UserCheck size={15} strokeWidth={2} color="var(--primary)" />
                  <div>
                    <div>My Profile & Settings</div>
                    <div className="nav-dropdown-item-desc">View credentials & clinic</div>
                  </div>
                </button>
                {isDoctor && (
                  <button
                    type="button"
                    className="nav-dropdown-item"
                    onClick={() => handleNavClick('history')}
                  >
                    <LayoutDashboard size={15} strokeWidth={2} color="var(--primary)" />
                    <div>
                      <div>Clinical Dashboard</div>
                      <div className="nav-dropdown-item-desc">Patient records & actions</div>
                    </div>
                  </button>
                )}
                <div style={{ height: '1px', background: 'var(--borderLight)', margin: '4px 0' }} />
                <button
                  type="button"
                  className="nav-dropdown-item"
                  onClick={handleLogoutAction}
                  style={{ color: '#ef4444' }}
                >
                  <LogOut size={15} strokeWidth={2} color="#ef4444" />
                  <div>Sign Out</div>
                </button>
              </div>
            )}
          </div>

          {/* Blood Donors Button */}
          <button
            type="button"
            onClick={handleBloodAction}
            title="Emergency Blood Donors & NGO Finder"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1px solid var(--borderLight)',
              color: 'var(--foreground)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.background = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--borderLight)';
              e.currentTarget.style.background = '#ffffff';
            }}
          >
            <Droplet size={14} strokeWidth={2} color="#ef4444" />
            <span className="blood-label">Blood Donors</span>
          </button>

          {/* 108 SOS Button */}
          <button
            type="button"
            onClick={handleSOSAction}
            title="108 Emergency SOS"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              background: '#FEF2F2',
              color: 'var(--emergency)',
              border: '1px solid #FCA5A5',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(217, 75, 75, 0.12)',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--emergency)';
              e.currentTarget.style.borderColor = 'var(--emergency)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FEF2F2';
              e.currentTarget.style.borderColor = '#FCA5A5';
              e.currentTarget.style.color = 'var(--emergency)';
            }}
          >
            <AlertTriangle size={14} strokeWidth={2} />
            <span className="sos-label">108 SOS</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 3. MOBILE FULLSCREEN OPAQUE NAVIGATION DRAWER                     */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay">
          {/* Drawer Top Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '60px',
            padding: '0 14px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            flexShrink: 0
          }}>
            <div onClick={handleBrandClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <img src="/images/logo.png" alt="GraminArogya Logo" style={{ height: '34px', objectFit: 'contain' }} />
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation drawer"
              style={{
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#0f172a',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <XIcon size={22} strokeWidth={2} />
            </button>
          </div>

          <div style={{ paddingBottom: '32px' }}>
            {/* ── DOCTOR IDENTITY AREA ── */}
            {currentUser?.role === 'doctor' && (
              <div style={{ padding: '14px 14px 0 14px' }}>
                <div
                  onClick={handleProfileClick}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
                      {effectiveDoctorPhoto ? (
                        <img
                          src={effectiveDoctorPhoto}
                          alt={currentUser.name || 'Doctor'}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #0d9488'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: '#f0fdf4',
                          border: '2px solid #0d9488',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#0d9488'
                        }}>
                          <Stethoscope size={24} />
                        </div>
                      )}
                      <div style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#10b981',
                        border: '2px solid #fff'
                      }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {currentUser.name || 'Doctor Portal'}
                        </span>
                        <span style={{
                          background: '#0f766e',
                          color: '#ffffff',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '10px',
                          letterSpacing: '0.04em'
                        }}>
                          DOCTOR
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                        {currentUser.specialization || 'Medical Officer • Clinical Desk'}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#0d9488'
                  }}>
                    <span>My Profile & Settings</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            )}

            {/* ASHA Field Worker Profile Block */}
            {isStaffOrAsha && (
              <div style={{ padding: '14px 14px 0 14px' }}>
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      position: 'relative',
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: '#dcfce7',
                      border: '2px solid #10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#059669',
                      flexShrink: 0
                    }}>
                      <HeartPulse size={24} />
                      <div style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        width: '13px',
                        height: '13px',
                        borderRadius: '50%',
                        background: '#10b981',
                        border: '2px solid #fff'
                      }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                          {currentUser?.name || 'ASHA Field Worker'}
                        </span>
                        <span style={{
                          background: '#059669',
                          color: '#ffffff',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '8px',
                          letterSpacing: '0.04em'
                        }}>
                          ASHA WORKER
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '2px', fontWeight: 600 }}>
                        National Rural Health Mission · Field Intake
                      </div>
                    </div>
                  </div>

                  <div style={{
                    borderTop: '1px solid #dcfce7',
                    paddingTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: '#15803d',
                    fontWeight: 600
                  }}>
                    <span>🟢 Active Portal: Patient Intake & AI Triage</span>
                    <span>Offline Ready</span>
                  </div>
                </div>
              </div>
            )}

            {/* Non-doctor, non-ASHA User Profile Block (Patient, Pharmacist, Admin) */}
            {currentUser && !isDoctor && !isStaffOrAsha && (
              <div style={{ padding: '14px 14px 0 14px' }}>
                <div
                  onClick={handleProfileClick}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                      <User size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                        {currentUser.name || currentUser.username || 'User Profile'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>
                        {currentUser.role || 'Member'} Account
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#94a3b8" />
                </div>
              </div>
            )}

            {/* ── DEDICATED EMERGENCY ACTIONS AREA ── */}
            <div style={{ padding: '16px 14px 0 14px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                Emergency Actions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Blood Donors Action */}
                <button
                  type="button"
                  onClick={handleBloodAction}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fca5a5',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    minHeight: '46px'
                  }}
                >
                  <Droplet size={18} color="#ef4444" fill="#fee2e2" />
                  <span>Blood Donors</span>
                </button>

                {/* 108 SOS Action */}
                <button
                  type="button"
                  onClick={handleSOSAction}
                  style={{
                    background: '#dc2626',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    minHeight: '46px',
                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)'
                  }}
                >
                  <AlertTriangle size={18} color="#ffffff" />
                  <span>108 SOS</span>
                </button>
              </div>
            </div>

            {/* ── FULL-WIDTH TOUCH-FRIENDLY NAVIGATION ROWS ── */}
            <div style={{ marginTop: '18px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: '#64748b', margin: '0 14px 6px 14px', textTransform: 'uppercase' }}>
                {currentUser?.role === 'doctor' ? 'Clinical Workspaces' : 'Navigation'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const badgeCount = (item.badgeKey === 'reminders' && pendingRemindersCount > 0) ? pendingRemindersCount : null;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`drawer-nav-row ${isActive ? 'active' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="drawer-nav-icon-box">
                          <Icon size={18} strokeWidth={1.75} />
                        </div>
                        <div>
                          <div className="drawer-nav-title">
                            {item.label}
                          </div>
                          {item.description && (
                            <div className="drawer-nav-desc">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {badgeCount && (
                          <span style={{
                            background: '#ef4444',
                            color: '#ffffff',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '12px'
                          }}>
                            {badgeCount}
                          </span>
                        )}
                        <ChevronRight size={18} color={isActive ? '#0d9488' : '#94a3b8'} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── SIGN OUT BUTTON ── */}
            {currentUser && (
              <div style={{ padding: '20px 14px 0 14px' }}>
                <button
                  type="button"
                  onClick={handleLogoutAction}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#fef2f2',
                    border: '1px solid #fee2e2',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    minHeight: '48px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#fee2e2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#dc2626'
                    }}>
                      <LogOut size={16} strokeWidth={2} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#dc2626' }}>Sign Out</div>
                      <div style={{ fontSize: '0.72rem', color: '#991b1b' }}>Log out of your session</div>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#ef4444" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {i18n.language && !i18n.language.startsWith('en') && (
        <div style={{ background: '#FEF2F2', borderBottom: '1px solid #FCA5A5', color: '#991B1B', padding: '6px 14px', fontSize: '0.75rem', textAlign: 'center', fontWeight: '500' }}>
          <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
          Machine-translated content. Medical terms may be inaccurate. Do not use for final medical diagnosis.
        </div>
      )}
    </header>
  );
}



