import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, Check, X, Shield, ShieldCheck, Phone } from 'lucide-react';
import { api } from '../utils/api';
import PatientOnboarding from '../components/PatientOnboarding';
import { useNavigate, Link } from 'react-router-dom';
import { renderGoogleButtonSafely, promptGoogleOneTap } from '../utils/googleAuth';



export default function SignIn() {
  const navigate = useNavigate();
  const [isLoginTab, setIsLoginTab] = useState(true);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [adminOtpRequired, setAdminOtpRequired] = useState(false);
  const [adminOtp, setAdminOtp] = useState('');
  const [devOtpPreview, setDevOtpPreview] = useState('');

  // Register extra state
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
    score: 0
  });

  // Google OAuth state
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef(null);



  const handleGoogleCredential = async (credential) => {
    setGoogleLoading(true);
    setErrorMsg('');
    try {
      const res = await api.googleAuth(credential, 'patient');
      if (res.success) {
        localStorage.setItem('gramin_arogya_token', res.token);
        localStorage.setItem('gramin_arogya_user', JSON.stringify(res.user));
        window.location.href = '/';
      } else {
        setErrorMsg(res.message || 'Google sign-in failed. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Google authentication network error. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !isLoginTab) return;

    let isMounted = true;
    renderGoogleButtonSafely(
      googleBtnRef.current,
      clientId,
      {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 300
      },
      handleGoogleCredential
    ).catch((e) => {
      if (isMounted) {
        console.warn('Google GSI render note:', e);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isLoginTab]);

  useEffect(() => {
    if (isLoginTab) return;
    const reqs = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
    const score = Object.values(reqs).filter(Boolean).length;
    setPasswordStrength({ ...reqs, score });
  }, [password, isLoginTab]);

  const triggerGooglePrompt = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setErrorMsg('Google Client ID is not configured (VITE_GOOGLE_CLIENT_ID).');
      return;
    }
    promptGoogleOneTap(clientId, handleGoogleCredential, () => {
      const renderedBtn = googleBtnRef.current?.querySelector('[role="button"]') || googleBtnRef.current?.querySelector('div[tabindex="0"]');
      if (renderedBtn) {
        renderedBtn.click();
      }
    });
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.verifyAdminOtp(adminOtp);
      if (res.success) {
        localStorage.setItem('gramin_arogya_token', res.token);
        localStorage.setItem('gramin_arogya_user', JSON.stringify(res.user));
        window.location.href = '/';
      } else {
        setErrorMsg(res.error || res.message || 'Invalid OTP');
      }
    } catch (err) {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLoginTab) {
        const res = await api.login({ username: email, password });
        if (res.success && res.requireOtp) {
          setAdminOtpRequired(true);
          if (res.devOtpPreview) {
            setDevOtpPreview(res.devOtpPreview);
            setAdminOtp(res.devOtpPreview);
          }
          setLoading(false);
          return;
        }
        if (res.success) {
          localStorage.setItem('gramin_arogya_token', res.token);
          localStorage.setItem('gramin_arogya_user', JSON.stringify(res.user));
          // Hint App.jsx which tab to activate immediately (avoids flicker)
          sessionStorage.setItem('gramin_arogya_pending_role', res.user.role || activeRole);
          // Refresh the page so App.jsx re-checks auth state
          window.location.href = '/';
        } else {
          setErrorMsg(res.error || res.message || 'Invalid credentials');
        }
      } else {
        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match');
          setLoading(false);
          return;
        }
        if (passwordStrength.score < 5) {
          setErrorMsg('Please satisfy all password requirements');
          setLoading(false);
          return;
        }
        const res = await api.register({
          name, username: email, password, role: 'patient'
        });
        if (res.success) {
          localStorage.setItem('gramin_arogya_token', res.token);
          localStorage.setItem('gramin_arogya_user', JSON.stringify(res.user));
          window.location.href = '/';
        } else {
          setErrorMsg(res.error || res.message || 'Registration failed');
        }
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (score) => {
    if (score <= 2) return 'var(--emergency)'; // Reddish
    if (score <= 4) return '#E7A63B'; // Amber
    return '#10B981'; // Green
  };

  const getStrengthLabel = (score) => {
    if (score === 0) return '';
    if (score <= 2) return 'WEAK';
    if (score <= 4) return 'MEDIUM';
    return 'STRONG';
  };

  const RequirementItem = ({ satisfied, text }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: satisfied ? '#10B981' : 'var(--mutedForeground)' }}>
      {satisfied ? <Check size={14} strokeWidth={3} /> : <X size={14} />}
      <span>{text}</span>
    </div>
  );

  return (
    <div style={{ background: 'var(--paper)', padding: '3rem 1rem 5rem 1rem', display: 'flex', justifyContent: 'center' }}>
      
      <div style={{ 
        display: 'flex', width: '100%', maxWidth: '1100px', 
        minHeight: '650px', background: 'var(--background)', 
        borderRadius: '16px', overflow: 'hidden',
        border: '1px solid var(--borderLight)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.04)'
      }}>
        {/* ─── LEFT COLUMN: FORM ───────────────────────────────────────────── */}
        <div style={{ 
          flex: 1, display: 'flex', flexDirection: 'column', 
          justifyContent: 'center', alignItems: 'center', padding: '3rem 2rem' 
        }}>
          
          <div style={{ width: '100%', maxWidth: '400px' }}>
            {/* Logo & Back Link */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <img src="/images/logo.png" alt="GraminArogya Logo" style={{ height: '56px', width: 'auto' }} />
              </Link>
            </div>

            {/* Heading */}
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
              {isLoginTab ? 'Sign in to your account' : 'Create an account'}
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--mutedForeground)', marginBottom: '2.5rem' }}>
              {isLoginTab ? 'Enter your details below to access your dashboard.' : 'Join the rural healthcare network today.'}
            </p>

            {/* Role Selector (Removed per unified login requirement) */}

            {/* Error Message */}
            {errorMsg && (
              <div style={{ 
                background: '#FEF2F2', color: 'var(--emergency)', padding: '1rem', 
                borderRadius: '8px', marginBottom: '1.5rem', fontFamily: 'var(--font-body)', 
                fontSize: '0.875rem', border: '1px solid #FCA5A5' 
              }}>
                {errorMsg}
              </div>
            )}

            {adminOtpRequired ? (
              <div style={{ textAlign: 'center' }}>
                <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>Admin Verification</h2>
                <div style={{ marginBottom: '1.5rem' }}>
                  {devOtpPreview ? (
                    <div style={{
                      background: '#ECFDF5',
                      border: '1.5px solid #059669',
                      color: '#065F46',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 700
                    }}>
                      ⚡ Admin Passcode: <span style={{ fontFamily: 'monospace', fontSize: '1.15rem', letterSpacing: '3px' }}>{devOtpPreview}</span>
                    </div>
                  ) : (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--mutedForeground)' }}>
                      Please enter your 6-digit admin verification code.
                    </p>
                  )}
                </div>
                <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <input type="text" required value={adminOtp} onChange={(e) => setAdminOtp(e.target.value)} placeholder="Enter 6-digit OTP" style={{ width: '100%', padding: '0.75rem 1rem', textAlign: 'center', letterSpacing: '4px', background: '#fff', border: '1px solid var(--borderLight)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: 'var(--foreground)' }} />
                  <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.875rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Verifying...' : 'Verify Admin'}
                  </button>
                  <button type="button" onClick={() => setAdminOtpRequired(false)} style={{ background: 'none', border: 'none', color: 'var(--mutedForeground)', cursor: 'pointer', marginTop: '1rem', textDecoration: 'underline' }}>Cancel</button>
                </form>
              </div>
            ) : (
            <>
            {isLoginTab ? (
              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)', textTransform: 'uppercase' }}>
                    Email, Mobile, Patient ID, Doctor ID, Staff ID.
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} color="var(--mutedForeground)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your credential"
                      style={{
                        width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', 
                        background: '#fff', border: '1px solid var(--borderLight)', borderRadius: '8px',
                        fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--foreground)',
                        outline: 'none', transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--borderLight)'}
                    />
                  </div>
                  <div style={{ textAlign: 'right', marginTop: '-0.25rem' }}>
                    <Link to="/forgot-id" style={{ 
                      fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none'
                    }}>
                      Forgot Patient ID?
                    </Link>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)' }}>
                      PASSWORD
                    </label>
                    <Link to="/forgot-password" style={{ 
                      background: 'none', border: 'none', fontFamily: 'var(--font-mono)', 
                      fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', cursor: 'pointer',
                      textDecoration: 'none'
                    }}>
                      Forgot password?
                    </Link>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} color="var(--mutedForeground)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      style={{
                        width: '100%', padding: '0.75rem 2.75rem 0.75rem 2.75rem', 
                        background: '#fff', border: '1px solid var(--borderLight)', borderRadius: '8px',
                        fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--foreground)',
                        outline: 'none', transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--borderLight)'}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ 
                        position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mutedForeground)'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '0.875rem', background: 'var(--primary)', color: '#fff',
                    border: 'none', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.875rem',
                    fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    transition: 'background 0.2s ease', opacity: loading ? 0.8 : 1
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#083F3D')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.background = 'var(--primary)')}
                >
                  {loading ? (
                    <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            ) : (
              <PatientOnboarding onSuccess={() => setIsLoginTab(true)} switchToLogin={() => setIsLoginTab(true)} />
            )}

            {/* Divider */}
            {isLoginTab && (
              <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0 1rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--borderLight)' }} />
                <span style={{ padding: '0 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--mutedForeground)' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--borderLight)' }} />
              </div>
            )}

            {/* Google Sign In - Single Official Button */}
            {isLoginTab && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', marginTop: '4px' }}>
                <div ref={googleBtnRef} style={{ minHeight: '44px', display: 'flex', justifyContent: 'center', width: '100%' }} />
              </div>
            )}

            {/* Toggle Register/Login */}
            <div style={{ textAlign: 'center', marginTop: '2rem', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--foreground)' }}>
              {isLoginTab ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => { setIsLoginTab(!isLoginTab); setErrorMsg(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
              >
                {isLoginTab ? 'Register here' : 'Sign in here'}
              </button>
            </div>

            {/* Trust Banner */}
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
              marginTop: '3rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', 
              color: 'var(--mutedForeground)' 
            }}>
              <ShieldCheck size={16} color="var(--primary)" />
              Secure & Private Healthcare Access
            </div>
            </>
            )}

          </div>
        </div>

        {/* ─── RIGHT COLUMN: IMAGE (Hidden on Mobile) ────────────────────── */}
        <div className="auth-image-panel" style={{ 
          flex: 1, position: 'relative', background: '#0F2524', overflow: 'hidden'
        }}>
          <img 
            src="/images/auth_side_panel.jpg" 
            alt="Healthcare Provider" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
          {/* Subtle dark teal gradient overlay behind the text */}
          <div style={{
            position: 'absolute', inset: 0, 
            background: 'linear-gradient(to top, rgba(11, 79, 76, 0.95) 0%, rgba(11, 79, 76, 0.6) 40%, transparent 80%)' 
          }} />
          
          <div style={{ position: 'absolute', bottom: '3rem', left: '3.5rem', right: '3.5rem', zIndex: 10 }}>
            <div role="heading" aria-level="2" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 700, color: '#ffffff', lineHeight: 1.15, marginBottom: '1.25rem', textShadow: '0 2px 16px rgba(0,0,0,0.25)' }}>
              Empowering rural healthcare with technology.
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(1rem, 1.5vw, 1.125rem)', fontWeight: 500, color: '#F3F8F6', lineHeight: 1.6, maxWidth: '420px', textShadow: '0 1px 8px rgba(0,0,0,0.2)' }}>
              Join the GraminArogya network to access unified health records, verified facilities, and instant emergency support.
            </p>
          </div>
        </div>
      </div>
      
      {/* Media query for hiding right panel on mobile handled in css or inline - we will just inject a quick style tag */}
      <style>{`
        @media (max-width: 900px) {
          .auth-image-panel {
            display: none !important;
          }
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
