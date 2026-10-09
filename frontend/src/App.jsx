import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import SwasthyaSethuAIAssistant from './components/SwasthyaSethuAIAssistant';
import PublicLayout from './pages/PublicLayout';
import Home from './pages/Home';
import Services from './pages/Services';
import FindCare from './pages/FindCare';
import Network from './pages/Network';
import Articles from './pages/Articles';
import ArticlePage from './pages/ArticlePage';
import SignIn from './pages/SignIn';
import ForgotPassword from './pages/ForgotPassword';
import ForgotPatientId from './pages/ForgotPatientId';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import NodalOfficers from './pages/NodalOfficers';
import Navbar from './components/Navbar';
import StaffPortal from './views/StaffPortal';
import SmartRouting from './views/SmartRouting';
import ReferralHub from './views/ReferralHub';
import GovDashboard from './views/GovDashboard';
import AdminPortal from './views/AdminPortal';
import DoctorPanel from './views/DoctorPanel';
import PatientProfile from './views/PatientProfile';
import PharmacyPortal from './views/PharmacyPortal';
import QRCodeModal from './components/QRCodeModal';
import SOSModal from './components/SOSModal';
import NearbyHospitals from './components/NearbyHospitals';
import BloodFinderModal from './components/BloodFinderModal';
import { api } from './utils/api';
import { getOfflineQueue, clearOfflineQueue } from './utils/offlineStorage';
import {
  MapPin, X, Navigation, ShieldCheck, HeartPulse, Droplet,
  Search, Crosshair, ArrowRight, ArrowUpRight, Phone, Clock,
  Building2, Users, FileText, Activity, Stethoscope, Globe,
  AlertTriangle, Syringe, BookOpen, Lock, Plus, Minus, Menu
} from 'lucide-react';
import { ROLE_NAV_ITEMS, getRoleDefaultTab, isTabAllowedForRole } from './utils/navigationConfig';

/* ============================================================
   NEWSPRINT DESIGN SYSTEM
   "All the News That's Fit to Print" — applied to rural healthcare
   ============================================================ */


import PublicFooter from './components/PublicFooter';

/* ============================================================
   MAIN APP
   ============================================================ */
export default function App() {
  const [activeTab, setActiveTab] = useState('staff');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Modals state
  const [isQROpen, setIsQROpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isNearbyOpen, setIsNearbyOpen] = useState(false);
  const [isBloodOpen, setIsBloodOpen] = useState(false);

  // Cross-view data sharing
  const [selectedPatientForRouting, setSelectedPatientForRouting] = useState(null);
  const [activeQRReferral, setActiveQRReferral] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);

  // Search UI-only state
  const [searchTab, setSearchTab] = useState('hospitals');
  
  // Mobile UI state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

    // Patient Route Synchronization
  useEffect(() => {
    if (!currentUser) return;
    const path = location.pathname;
    
    if (currentUser.role === 'patient' || currentUser.role === 'citizen') {
      if (path === '/profile') {
        setActiveTab('patientProfile');
        setIsBloodOpen(false);
        setIsSOSOpen(false);
      } else if (path === '/find-care') {
        setActiveTab('routing');
        setIsBloodOpen(false);
        setIsSOSOpen(false);
      } else if (path === '/referrals') {
        setActiveTab('referrals');
        setIsBloodOpen(false);
        setIsSOSOpen(false);
      } else if (path === '/blood-donors') {
        setIsBloodOpen(true);
        setIsSOSOpen(false);
      } else if (path === '/sos') {
        setIsSOSOpen(true);
        setIsBloodOpen(false);
      } else if (path === '/services') {
        setActiveTab('services');
      } else if (path === '/network') {
        setActiveTab('network');
      } else if (path === '/articles') {
        setActiveTab('articles');
      } else if (path === '/contact') {
        setActiveTab('contact');
      } else if (path === '/') {
        navigate('/profile', { replace: true });
      }
    } else if (currentUser.role === 'doctor' || currentUser.role === 'admin') {
      if (path.startsWith('/doctor')) {
        if (path.includes('/patients/lookup')) setActiveTab('phoneFetch');
        else if (path.includes('/patients') || path.includes('/consultation')) setActiveTab('history');
        else if (path.includes('/follow-ups')) setActiveTab('reminders');
        else if (path.includes('/schedule')) setActiveTab('leaveSchedule');
        else if (path.includes('/prescriptions')) setActiveTab('prescriptions');
        else if (path.includes('/profile')) setActiveTab('profile');
        else if (path.includes('/branding')) setActiveTab('branding');
        else if (path === '/doctor') setActiveTab('doctor');
      } else if (path === '/find-care') {
        setActiveTab('routing');
      } else if (path === '/services') {
        setActiveTab('services');
      } else if (path === '/network') {
        setActiveTab('network');
      } else if (path === '/articles') {
        setActiveTab('articles');
      } else if (path === '/contact') {
        setActiveTab('contact');
      }
    } else {
      if (path === '/find-care') setActiveTab('routing');
      else if (path === '/services') setActiveTab('services');
      else if (path === '/network') setActiveTab('network');
      else if (path === '/articles') setActiveTab('articles');
      else if (path === '/contact') setActiveTab('contact');
    }
  }, [location.pathname, currentUser]);

  // Ensure window and layout containers reset scroll to top on every tab/view change
  useEffect(() => {
    const scrollToTop = () => {
      try { window.scrollTo(0, 0); } catch { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); }
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const root = document.getElementById('root');
      if (root) root.scrollTop = 0;
      const mains = document.querySelectorAll('main');
      mains.forEach(m => { m.scrollTop = 0; });
    };

    scrollToTop();
    const raf = requestAnimationFrame(scrollToTop);
    const t1 = setTimeout(scrollToTop, 50);
    const t2 = setTimeout(scrollToTop, 150);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [activeTab]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('gramin_arogya_token');
      const storedUser = localStorage.getItem('gramin_arogya_user');
      if (token && storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setCurrentUser(parsed);

          // Check for a post-login role hint (set by SignIn.jsx) for immediate tab activation
          const pendingRole = sessionStorage.getItem('gramin_arogya_pending_role');
          if (pendingRole) {
            sessionStorage.removeItem('gramin_arogya_pending_role');
            setActiveTab(getRoleDefaultTab(pendingRole));
          } else {
            setActiveTab(getRoleDefaultTab(parsed.role));
          }

          const meRes = await api.getMe();
          if (meRes.success) {
            setCurrentUser(meRes.user);
            setActiveTab(getRoleDefaultTab(meRes.user.role));
          }
          if (window.location.pathname !== '/' && window.location.pathname !== '/sign-in' && !window.location.pathname.startsWith('/doctor')) {
            window.history.replaceState(null, '', '/');
          }
        } catch (e) {
          console.warn('Auth token refresh error');
        }
      }
      setAuthLoading(false);
    };
    checkAuth();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Strict role boundary enforcement
  useEffect(() => {
    if (currentUser) {
      if (!isTabAllowedForRole(activeTab, currentUser.role)) {
        setActiveTab(getRoleDefaultTab(currentUser.role));
      }
    }
  }, [currentUser, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('gramin_arogya_token');
    localStorage.removeItem('gramin_arogya_user');
    setCurrentUser(null);
    setActiveTab('staff');
    if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/doctor')) {
      window.history.replaceState(null, '', '/');
    }
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setActiveTab(getRoleDefaultTab(user.role));
    if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/doctor')) {
      window.history.replaceState(null, '', '/');
    }
  };

  const handleSyncOffline = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;
    setSyncLoading(true);
    try {
      const res = await api.syncOfflineQueue(queue);
      if (res.success) {
        clearOfflineQueue();
        alert(`Synced ${res.syncedCount} queued records to central health database!`);
      }
    } catch (e) {
      alert('Could not sync records. Central server unreachable.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handlePatientSelected = (patient) => {
    setSelectedPatientForRouting(patient);
    setActiveTab('routing');
  };

  const handleReferralCreated = (referral) => {
    setActiveQRReferral(referral);
    setIsQROpen(true);
  };

  const handleOpenQR = (referral) => {
    setActiveQRReferral(referral);
    setIsQROpen(true);
  };

  /* ---------------------------------------------------------
     LOADING
     --------------------------------------------------------- */
  if (authLoading) {
    return (
      <>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--background)' }}>
          <div className="loading">
            <svg width="64px" height="48px">
                <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="back"></polyline>
              <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="front"></polyline>
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', marginTop: '20px', letterSpacing: '0.05em' }}>
            CONNECTING...
          </div>
        </div>
      </>
    );
  }

  /* ---------------------------------------------------------
     PUBLIC LANDING (not logged in)
     --------------------------------------------------------- */
  if (!currentUser) {
    const today = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });

    return (
      <>
        <Routes>
          <Route path="/" element={
            <PublicLayout 
              today={today} 
              isMobileMenuOpen={isMobileMenuOpen} 
              setIsMobileMenuOpen={setIsMobileMenuOpen} 
              setIsSOSOpen={setIsSOSOpen} 
              setIsAuthOpen={setIsAuthOpen} 
            />
          }>
            <Route index element={<Home setIsNearbyOpen={setIsNearbyOpen} setIsBloodOpen={setIsBloodOpen} />} />
            <Route path="services" element={<Services setIsNearbyOpen={setIsNearbyOpen} setIsBloodOpen={setIsBloodOpen} setIsSOSOpen={setIsSOSOpen} />} />
            <Route path="find-care" element={<FindCare setIsNearbyOpen={setIsNearbyOpen} setIsBloodOpen={setIsBloodOpen} setIsSOSOpen={setIsSOSOpen} />} />
            <Route path="network" element={<Network />} />
            <Route path="articles" element={<Articles />} />
            <Route path="articles/:slug" element={<ArticlePage />} />
            <Route path="sign-in" element={<SignIn />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="forgot-id" element={<ForgotPatientId />} />
            <Route path="contact" element={<Contact />} />
            <Route path="privacy" element={<PrivacyPolicy />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="terms" element={<TermsOfService />} />
            <Route path="terms-of-service" element={<TermsOfService />} />
            <Route path="nodal-officers" element={<NodalOfficers />} />
            <Route path="*" element={<Navigate to="/sign-in" replace />} />
          </Route>
        </Routes>

        {/* ---------------- MODALS ---------------- */}
        <BloodFinderModal
          isOpen={isBloodOpen}
          onClose={() => setIsBloodOpen(false)}
        />
        {isNearbyOpen && (
          <div className="np-overlay">
            <div className="np-modal">
              <div className="np-modal-head">
                <div className="np-modal-head-left">
                  <div className="np-modal-head-icon">
                    <MapPin size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="np-modal-title">Nearby Healthcare Facilities</h2>
                    <div className="np-modal-sub">Verified hospitals · routes · contact details</div>
                  </div>
                </div>
                <button onClick={() => setIsNearbyOpen(false)} className="np-modal-close" aria-label="Close">
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
              <div className="np-modal-body">
                <NearbyHospitals />
              </div>
            </div>
          </div>
        )}
        {/* Floating Emergency Cluster: Blood Requirement & 108 SOS */}
        <div id="floating-emergency-cluster" style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={() => setIsBloodOpen(true)}
            className="np-btn"
            style={{
              background: '#b91c1c',
              color: '#ffffff',
              border: 'none',
              padding: '14px 18px',
              boxShadow: '0 4px 12px rgba(185, 28, 28, 0.25)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              borderRadius: '8px',
              fontSize: '0.85rem',
              letterSpacing: '0.02em',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(185, 28, 28, 0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(185, 28, 28, 0.25)'; }}
            aria-label="Blood Donors & Emergency Help"
            title="Blood Donors & Help"
          >
            <Droplet size={16} fill="#ffffff" strokeWidth={1.5} />
            <span>Blood Donors</span>
          </button>

          <button
            onClick={() => setIsSOSOpen(true)}
            className="np-btn np-btn-red"
            style={{ 
              padding: '14px 18px', 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)'; }}
            aria-label="Emergency SOS"
          >
            <Phone size={15} strokeWidth={1.5} />
            108 SOS
          </button>
        </div>
        <style>{`
          @media (max-width: 600px) {
            #floating-emergency-cluster {
              bottom: 12px !important;
              right: 12px !important;
              gap: 6px !important;
            }
            #floating-emergency-cluster button {
              padding: 9px 12px !important;
              font-size: 0.78rem !important;
              border-radius: 6px !important;
            }
          }
        `}</style>
        <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
        <BloodFinderModal isOpen={isBloodOpen} onClose={() => setIsBloodOpen(false)} />
        <SwasthyaSethuAIAssistant />
      </>
    );
  }

  /* ---------------------------------------------------------
     LOGGED-IN APP
     --------------------------------------------------------- */
  const handleSetTab = (tabId) => {
    if (currentUser?.role === 'patient' || currentUser?.role === 'citizen') {
      if (tabId === 'patientProfile') navigate('/profile');
      else if (tabId === 'routing') navigate('/find-care');
      else if (tabId === 'referrals') navigate('/referrals');
      else setActiveTab(tabId);
    } else {
      setActiveTab(tabId);
    }
  };

  const handleOpenBlood = () => {
    if (currentUser?.role === 'patient' || currentUser?.role === 'citizen') navigate('/blood-donors');
    else setIsBloodOpen(true);
  };

  const handleOpenSOS = () => {
    if (currentUser?.role === 'patient' || currentUser?.role === 'citizen') navigate('/sos');
    else setIsSOSOpen(true);
  };

  const handleCloseBlood = () => {
    if (currentUser?.role === 'patient' || currentUser?.role === 'citizen') {
      setIsBloodOpen(false);
      navigate(-1);
    } else {
      setIsBloodOpen(false);
    }
  };

  const handleCloseSOS = () => {
    if (currentUser?.role === 'patient' || currentUser?.role === 'citizen') {
      setIsSOSOpen(false);
      navigate(-1);
    } else {
      setIsSOSOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      

      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSetTab}
        onOpenSOS={handleOpenSOS}
        onOpenBlood={handleOpenBlood}
        onOpenAuth={() => setIsAuthOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOnline={isOnline}
        onSyncOffline={handleSyncOffline}
        syncLoading={syncLoading}
      />

      <main style={{ flex: 1, paddingBottom: '60px' }}>
        <div className="w-full h-full" key={activeTab}>
          {/* DOCTOR PANEL: strictly accessible ONLY to Doctor (and Admin oversight) */}
          {(activeTab === 'doctor' || ['history', 'reminders', 'leaveSchedule', 'prescriptions', 'profile', 'branding', 'phoneFetch'].includes(activeTab)) && (currentUser?.role === 'doctor' || currentUser?.role === 'admin') && (
            <DoctorPanel
              currentUser={currentUser}
              onAuthSuccess={handleAuthSuccess}
              activeSubTab={['history', 'reminders', 'leaveSchedule', 'prescriptions', 'profile', 'branding', 'phoneFetch'].includes(activeTab) ? activeTab : 'history'}
              setActiveSubTab={(tab) => setActiveTab(tab)}
            />
          )}

          {/* STAFF FIELD PORTAL: strictly accessible to Staff and Admin */}
          {(activeTab === 'staff' || activeTab === 'staffProfile') && (currentUser?.role === 'staff' || currentUser?.role === 'admin' || currentUser?.role === 'asha') && (
            <StaffPortal
              onSelectPatientForRouting={handlePatientSelected}
              isOnline={isOnline}
              currentUser={currentUser}
              activeSubTab={activeTab === 'staffProfile' ? 'profile' : 'screening'}
              setActiveSubTab={(tab) => setActiveTab(tab === 'profile' ? 'staffProfile' : 'staff')}
            />
          )}

          {/* SMART ROUTING: accessible to Staff, CMO, Citizen, Patient, Admin */}
          {activeTab === 'routing' && ['staff', 'asha', 'cmo', 'citizen', 'patient', 'admin'].includes(currentUser?.role) && (
            <SmartRouting
              selectedPatient={selectedPatientForRouting}
              onReferralCreated={handleReferralCreated}
            />
          )}

          {/* REFERRAL HUB: accessible to Staff, CMO, Citizen, Patient, Admin */}
          {activeTab === 'referrals' && ['staff', 'asha', 'cmo', 'citizen', 'patient', 'admin'].includes(currentUser?.role) && (
            <ReferralHub
              onOpenQRModal={handleOpenQR}
            />
          )}

          {/* GOV & ADMIN DASHBOARD */}
          {activeTab === 'gov' && ['cmo', 'admin'].includes(currentUser?.role) && (
            <GovDashboard />
          )}

          {/* ADMIN PORTAL: strictly Admin */}
          {(activeTab === 'admin' || activeTab === 'adminProfile') && currentUser?.role === 'admin' && (
            <AdminPortal 
              currentUser={currentUser} 
              onLogout={handleLogout} 
              activeSubTab={activeTab === 'adminProfile' ? 'profile' : 'facilities'}
              setActiveSubTab={(tab) => setActiveTab(tab === 'profile' ? 'adminProfile' : 'admin')}
            />
          )}

          {/* CITIZEN / PATIENT PROFILE */}
          {(activeTab === 'patientProfile' || activeTab === 'PatientProfile') && ['patient', 'citizen', 'admin'].includes(currentUser?.role) && (
            <PatientProfile
              currentUser={currentUser}
              onProfileUpdated={(updatedUser) => {
                setCurrentUser(prev => ({ ...prev, ...updatedUser }));
              }}
            />
          )}

          {/* PHARMACIST PORTAL: strictly Pharmacist (and Admin oversight) */}
          {['pharmacy', 'pharmacyInventory', 'pharmacyStockIn', 'pharmacyTransactions', 'pharmacyUsage'].includes(activeTab) &&
            (currentUser?.role === 'pharmacist' || currentUser?.role === 'admin') && (
            <PharmacyPortal
              currentUser={currentUser}
              activeSubTab={
                activeTab === 'pharmacy' ? 'dispense'
                : activeTab === 'pharmacyInventory' ? 'inventory'
                : activeTab === 'pharmacyStockIn' ? 'stockIn'
                : activeTab === 'pharmacyTransactions' ? 'transactions'
                : activeTab === 'pharmacyUsage' ? 'usage'
                : 'dispense'
              }
            />
          )}

          {/* PUBLIC PAGES ACCESSIBLE WHEN LOGGED IN */}
          {activeTab === 'services' && (
            <div className="np-container" style={{ padding: '2rem 1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
              <Services />
            </div>
          )}
          {activeTab === 'network' && (
            <div className="np-container" style={{ padding: '2rem 1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
              <Network />
            </div>
          )}
          {activeTab === 'articles' && (
            <div className="np-container" style={{ padding: '2rem 1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
              <Articles />
            </div>
          )}
          {activeTab === 'contact' && (
            <div className="np-container" style={{ padding: '2rem 1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
              <Contact />
            </div>
          )}
        </div>
      </main>

      <PublicFooter
        onOpenBlood={handleOpenBlood}
        onOpenSOS={handleOpenSOS}
        currentUser={currentUser}
        setActiveTab={handleSetTab}
      />

      <BloodFinderModal
        isOpen={isBloodOpen}
        onClose={handleCloseBlood}
      />


      <QRCodeModal
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
        referral={activeQRReferral}
      />

      {/* Floating Emergency Cluster: Blood Requirement & 108 SOS */}
      <div id="floating-emergency-cluster" style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={handleOpenBlood}
          className="np-btn"
          style={{
            background: '#b91c1c',
            color: '#ffffff',
            border: 'none',
            padding: '14px 18px',
            boxShadow: '0 4px 12px rgba(185, 28, 28, 0.25)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            borderRadius: '8px',
            fontSize: '0.85rem',
            letterSpacing: '0.02em',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(185, 28, 28, 0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(185, 28, 28, 0.25)'; }}
          aria-label="Blood Donors & Emergency Help"
          title="Blood Donors & Help"
        >
          <Droplet size={16} fill="#ffffff" strokeWidth={1.5} />
          <span>Blood Donors</span>
        </button>

        <button
          onClick={handleOpenSOS}
          className="np-btn np-btn-red"
          style={{ 
            padding: '14px 18px', 
            borderRadius: '8px', 
            border: 'none', 
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)'; }}
          aria-label="Emergency SOS"
        >
          <Phone size={15} strokeWidth={1.5} />
          108 SOS
        </button>
      </div>

      <SwasthyaSethuAIAssistant />

      <SOSModal
        isOpen={isSOSOpen}
        onClose={handleCloseSOS}
      />
    </div>
  );
}



