import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, Mail, ArrowRight, UserCheck, Check, KeySquare, Shield, Lock, Eye, EyeOff, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../utils/api';
import HeartbeatLoader from '../components/HeartbeatLoader';

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  // 1: Identify, 2: Verify OTP, 3: Reset Password, 4: Success
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [identity, setIdentity] = useState('');
  const [maskedContact, setMaskedContact] = useState('');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [resetToken, setResetToken] = useState('');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordStrength, setPasswordStrength] = useState({
    length: false, upper: false, lower: false, number: false, special: false, score: 0
  });

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  useEffect(() => {
    if (step !== 3) return;
    const reqs = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
    const score = Object.values(reqs).filter(Boolean).length;
    setPasswordStrength({ ...reqs, score });
  }, [password, step]);

  const getStrengthColor = (score) => {
    if (score <= 2) return 'var(--emergency)';
    if (score <= 4) return '#E7A63B';
    return '#10B981';
  };

  const getStrengthLabel = (score) => {
    if (score === 0) return '';
    if (score <= 2) return 'WEAK';
    if (score <= 4) return 'MEDIUM';
    return 'STRONG';
  };

  const RequirementItem = ({ satisfied, text }) => (
    <div className={`pwd-req-item ${satisfied ? 'satisfied' : ''}`}>
      {satisfied ? <Check size={14} strokeWidth={3} /> : <X size={14} />}
      <span>{text}</span>
    </div>
  );

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (identity.trim() === '') return setErrorMsg('Please enter a valid email or mobile number.');
    
    setLoading(true);
    setErrorMsg('');
    
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: identity })
      });
      const data = await res.json();
      if (data.success) {
        if (data.destination) setMaskedContact(data.destination);
        setStep(2);
        setTimer(60);
      } else {
        setErrorMsg(data.message || 'Error requesting OTP.');
      }
    } catch (err) {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return setErrorMsg('Please enter a valid 6-digit OTP.');
    
    setLoading(true);
    setErrorMsg('');
    
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: identity, otp })
      });
      const data = await res.json();
      if (data.success) {
        setResetToken(data.resetToken);
        setStep(3);
      } else {
        setErrorMsg(data.message || 'Invalid OTP.');
      }
    } catch (err) {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (password !== confirmPassword) return setErrorMsg('Passwords do not match');
    if (passwordStrength.score < 5) return setErrorMsg('Please satisfy all password requirements');
    
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword: password })
      });
      const data = await res.json();
      if (data.success) {
        setStep(4);
      } else {
        setErrorMsg(data.message || 'Error resetting password.');
      }
    } catch (err) {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-recovery-container">
      <div className="auth-recovery-card">
        
        {/* ─── LEFT COLUMN: FORM ─── */}
        <div className="auth-form-side">
          <div className="auth-form-wrapper">
            
            <div className="auth-header">
              <Link to="/sign-in" className="auth-back-link">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>

            {/* Stepper */}
            <div className="auth-stepper">
              <div className={`stepper-step ${step >= 1 ? 'active' : ''}`}>
                <div className="stepper-icon"><Mail size={14} /></div>
                <span>Verify Contact</span>
              </div>
              <div className={`stepper-line ${step >= 2 ? 'active' : ''}`} />
              <div className={`stepper-step ${step >= 2 ? 'active' : ''}`}>
                <div className="stepper-icon"><KeySquare size={14} /></div>
                <span>Enter OTP</span>
              </div>
              <div className={`stepper-line ${step >= 3 ? 'active' : ''}`} />
              <div className={`stepper-step ${step >= 3 ? 'active' : ''}`}>
                <div className="stepper-icon"><Lock size={14} /></div>
                <span>New Password</span>
              </div>
              <div className={`stepper-line ${step >= 4 ? 'active' : ''}`} />
              <div className={`stepper-step ${step >= 4 ? 'active' : ''}`}>
                <div className="stepper-icon"><UserCheck size={14} /></div>
                <span>Success</span>
              </div>
            </div>

            {errorMsg && (
              <div className="auth-error-banner fade-in">
                {errorMsg}
              </div>
            )}

            {/* STEP 1: VERIFY CONTACT */}
            {step === 1 && (
              <div className="fade-in">
                <h1 className="auth-title">Forgot Password?</h1>
                <p className="auth-subtitle">
                  Enter the email or mobile number associated with your account, and we'll send you an OTP to reset it.
                </p>
                <form onSubmit={handleSendOtp} className="auth-form">
                  <div className="input-group">
                    <label>EMAIL OR MOBILE NUMBER</label>
                    <div className="input-with-icon">
                      <Mail size={18} className="input-icon" />
                      <input
                        type="text"
                        value={identity}
                        onChange={e => setIdentity(e.target.value)}
                        placeholder="e.g. 9876543210 or email@example.com"
                        required
                      />
                    </div>
                  </div>
                  <button disabled={loading} type="submit" className="auth-submit-btn">
                    {loading ? (
                      <HeartbeatLoader color="#ffffff" size={32} />
                    ) : (
                      <>Send OTP <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: VERIFY OTP */}
            {step === 2 && (
              <div className="fade-in">
                <h1 className="auth-title">Verify it's you</h1>
                <p className="auth-subtitle">
                  We've sent a 6-digit verification code to <strong>{maskedContact || identity}</strong>.
                </p>
                <form onSubmit={handleVerifyOtp} className="auth-form">
                  <div className="input-group">
                    <label>6-DIGIT OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="otp-input"
                      required
                    />
                  </div>
                  
                  <div className="resend-row">
                    <span>Didn't receive code?</span>
                    <button 
                      type="button" 
                      disabled={timer > 0 || loading}
                      onClick={handleSendOtp}
                      className={`resend-btn ${timer > 0 || loading ? 'disabled' : ''}`}
                    >
                      {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                    </button>
                  </div>

                  <button disabled={loading || otp.length !== 6} type="submit" className="auth-submit-btn">
                    {loading ? (
                      <HeartbeatLoader color="#ffffff" size={32} />
                    ) : (
                      <>Verify OTP <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 3: RESET PASSWORD */}
            {step === 3 && (
              <div className="fade-in">
                <h1 className="auth-title">Create New Password</h1>
                <p className="auth-subtitle">
                  Your new password must be secure and unique from those previously used.
                </p>
                <form onSubmit={handleResetPassword} className="auth-form">
                  <div className="input-group">
                    <label>NEW PASSWORD</label>
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your new password"
                        required
                        className="pwd-input"
                      />
                      <button type="button" className="pwd-toggle" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    
                    {password.length > 0 && (
                      <div className="pwd-strength-card">
                        <div className="pwd-reqs-grid">
                          <RequirementItem satisfied={passwordStrength.length} text="Min 8 characters" />
                          <RequirementItem satisfied={passwordStrength.upper} text="1 uppercase letter" />
                          <RequirementItem satisfied={passwordStrength.lower} text="1 lowercase letter" />
                          <RequirementItem satisfied={passwordStrength.number} text="1 number" />
                          <RequirementItem satisfied={passwordStrength.special} text="1 special symbol" />
                        </div>
                        <div className="pwd-bars">
                          {[1,2,3,4,5].map(lvl => (
                            <div key={lvl} className={`pwd-bar ${passwordStrength.score >= lvl ? 'filled' : ''}`} style={{ background: passwordStrength.score >= lvl ? getStrengthColor(passwordStrength.score) : '' }} />
                          ))}
                        </div>
                        <div className="pwd-label" style={{ color: getStrengthColor(passwordStrength.score) }}>
                          {getStrengthLabel(passwordStrength.score)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="input-group">
                    <label>CONFIRM NEW PASSWORD</label>
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        required
                        className="pwd-input"
                      />
                      <button type="button" className="pwd-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && (
                      <div className={`pwd-match-indicator ${confirmPassword === password ? 'match' : ''}`}>
                        {confirmPassword === password ? <Check size={14} strokeWidth={2.5} /> : <X size={14} strokeWidth={2.5} />}
                        {confirmPassword === password ? 'Passwords match' : 'Passwords do not match'}
                      </div>
                    )}
                  </div>

                  <button disabled={loading || passwordStrength.score < 5 || password !== confirmPassword} type="submit" className="auth-submit-btn">
                    {loading ? (
                      <HeartbeatLoader color="#ffffff" size={32} />
                    ) : (
                      <>Reset Password <Check size={16} /></>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 4 && (
              <div className="fade-in auth-success-state">
                <div className="success-icon-container">
                  <CheckCircle2 size={36} color="#10B981" strokeWidth={2.5} />
                </div>
                <h1 className="auth-title">Password Reset!</h1>
                <p className="auth-subtitle">
                  Your password has been successfully reset. You can now log in securely with your new credentials.
                </p>
                
                <Link to="/sign-in" style={{ textDecoration: 'none', width: '100%', display: 'block' }}>
                  <button className="auth-submit-btn">
                    Return to Sign In
                  </button>
                </Link>
              </div>
            )}

            {/* Trust Banner */}
            {step === 1 && (
              <div className="auth-trust-banner">
                <Shield size={16} color="var(--primary)" />
                Secure & Encrypted Password Recovery
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN: IMAGE ─── */}
        <div className="auth-image-side">
          <img src="/images/auth_side_panel.jpg" alt="Healthcare Provider" className="bg-image" />
          <div className="overlay-gradient" />
          <div className="image-content">
            <div role="heading" aria-level="2" className="image-heading">Secure account<br/>recovery.</div>
            <p>
              GraminArogya employs rigorous security standards to ensure your healthcare records and account details remain completely protected.
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .auth-recovery-container {
          background: var(--paper);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
        }
        .auth-recovery-card {
          display: flex;
          width: 100%;
          max-width: 1100px;
          min-height: 650px;
          background: var(--background);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--borderLight);
          box-shadow: 0 12px 40px rgba(0,0,0,0.06);
        }
        .auth-form-side {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 3rem 2rem;
          background: #fff;
        }
        .auth-form-wrapper {
          width: 100%;
          max-width: 420px;
        }
        .auth-header {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 2.5rem;
        }
        .auth-back-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--mutedForeground);
          text-decoration: none;
          font-family: var(--font-mono);
          font-size: 0.875rem;
          font-weight: 600;
          transition: color 0.2s;
        }
        .auth-back-link:hover { color: var(--primary); }
        
        .auth-stepper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--borderLight);
        }
        .stepper-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          opacity: 0.4;
          transition: all 0.3s;
        }
        .stepper-step.active {
          opacity: 1;
        }
        .stepper-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--muted);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--mutedForeground);
          transition: all 0.3s;
        }
        .stepper-step.active .stepper-icon {
          background: #E0F2FE;
          color: #0284C7;
          box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.1);
        }
        .stepper-step span {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--foreground);
          white-space: nowrap;
        }
        .stepper-line {
          flex: 1;
          height: 2px;
          background: var(--borderLight);
          margin: 0 12px;
          margin-bottom: 20px;
          transition: all 0.3s;
        }
        .stepper-line.active {
          background: #0284C7;
        }

        .auth-title {
          font-family: var(--font-display);
          font-size: clamp(1.75rem, 4vw, 2.25rem);
          font-weight: 800;
          color: var(--foreground);
          margin-bottom: 0.75rem;
          line-height: 1.2;
        }
        .auth-subtitle {
          font-family: var(--font-body);
          font-size: 0.95rem;
          color: var(--mutedForeground);
          margin-bottom: 2.5rem;
          line-height: 1.5;
        }
        
        .auth-error-banner {
          background: #FEF2F2;
          color: var(--emergency);
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-family: var(--font-body);
          font-size: 0.875rem;
          border: 1px solid #FCA5A5;
          font-weight: 500;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .input-group label {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--foreground);
          letter-spacing: 0.02em;
        }
        .input-with-icon {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--mutedForeground);
        }
        .input-with-icon input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 2.75rem;
          background: #fff;
          border: 1px solid var(--borderLight);
          border-radius: 8px;
          font-family: var(--font-body);
          font-size: 1rem;
          color: var(--foreground);
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .input-with-icon input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(11, 107, 104, 0.1);
        }
        .pwd-input {
          padding-right: 2.75rem !important;
        }
        .pwd-toggle {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--mutedForeground);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .otp-input {
          width: 100%;
          padding: 1rem;
          text-align: center;
          letter-spacing: 12px;
          background: #fff;
          border: 1px solid var(--borderLight);
          border-radius: 8px;
          font-family: var(--font-mono);
          font-size: 1.5rem;
          color: var(--foreground);
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
          font-weight: 800;
        }
        .otp-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(11, 107, 104, 0.1);
        }

        .pwd-strength-card {
          background: #F8FAF9;
          border: 1px solid var(--borderLight);
          border-radius: 8px;
          padding: 1rem;
          margin-top: 0.25rem;
        }
        .pwd-reqs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .pwd-req-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          font-family: var(--font-body);
          color: var(--mutedForeground);
        }
        .pwd-req-item.satisfied {
          color: #10B981;
          font-weight: 500;
        }
        .pwd-bars {
          height: 6px;
          background: var(--borderLight);
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          gap: 2px;
        }
        .pwd-bar {
          flex: 1;
          transition: background 0.3s;
          background: transparent;
        }
        .pwd-label {
          text-align: right;
          font-size: 0.7rem;
          font-weight: 700;
          margin-top: 0.5rem;
          font-family: var(--font-mono);
        }

        .pwd-match-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--emergency);
          margin-top: 0.25rem;
          font-family: var(--font-body);
        }
        .pwd-match-indicator.match {
          color: #10B981;
        }

        .resend-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: -0.5rem;
          margin-bottom: 0.5rem;
        }
        .resend-row span {
          font-size: 0.875rem;
          color: var(--mutedForeground);
          font-family: var(--font-body);
        }
        .resend-btn {
          background: none;
          border: none;
          font-family: var(--font-mono);
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--primary);
          cursor: pointer;
          transition: color 0.2s;
        }
        .resend-btn.disabled {
          color: var(--mutedForeground);
          cursor: not-allowed;
        }

        .auth-submit-btn {
          width: 100%;
          padding: 1rem;
          background: var(--primary);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: var(--font-mono);
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
        }
        .auth-submit-btn:hover:not(:disabled) {
          background: #083F3D;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(11, 107, 104, 0.2);
        }
        .auth-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-loader {
          width: 32px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-loader svg {
          width: 32px;
          height: 24px;
        }
        .btn-loader polyline {
          fill: none;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .btn-loader .back {
          stroke: rgba(255,255,255,0.2);
        }
        .btn-loader .front {
          stroke: #ffffff;
          stroke-dasharray: 48, 144;
          stroke-dashoffset: 192;
          animation: dash_682 1.4s linear infinite;
        }
        @keyframes dash_682 {
          72.5% { opacity: 0; }
          to { stroke-dashoffset: 0; }
        }

        .auth-success-state {
          text-align: center;
          padding: 2rem 0;
        }
        .success-icon-container {
          width: 72px;
          height: 72px;
          background: #ECFDF5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.1);
        }

        .auth-trust-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 3rem;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--mutedForeground);
          font-weight: 600;
        }

        .auth-image-side {
          flex: 1.2;
          position: relative;
          background: #0F2524;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          padding: 4rem;
        }
        .auth-image-side .bg-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .auth-image-side .overlay-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(11, 79, 76, 0.98) 0%, rgba(11, 79, 76, 0.4) 50%, transparent 100%);
        }
        .image-content {
          position: relative;
          z-index: 10;
        }
        .image-content .image-heading {
          font-family: var(--font-display);
          font-size: clamp(2rem, 3.5vw, 3rem);
          font-weight: 800;
          color: #ffffff !important;
          line-height: 1.15;
          margin-bottom: 1.25rem;
          text-shadow: 0 2px 16px rgba(0,0,0,0.3);
        }
        .image-content p {
          font-family: var(--font-body);
          font-size: 1.125rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.6;
          max-width: 440px;
        }

        /* Mobile specific adjustments */
        @media (max-width: 900px) {
          .auth-recovery-container {
            padding: 0;
            background: #fff;
          }
          .auth-recovery-card {
            flex-direction: column;
            border-radius: 0;
            border: none;
            box-shadow: none;
            min-height: 100vh;
          }
          .auth-form-side {
            padding: 2rem 1.5rem;
            flex: 1 0 auto;
          }
          .auth-image-side {
            flex: 0 0 240px;
            padding: 2rem 1.5rem;
          }
          .image-content .image-heading {
            font-size: 1.75rem;
            margin-bottom: 0.75rem;
          }
          .image-content p {
            font-size: 0.95rem;
          }
        }
        @media (max-width: 480px) {
          .auth-stepper {
            gap: 2px;
          }
          .stepper-step span {
            display: none;
          }
          .stepper-line {
            margin: 0 4px;
          }
        }
        .fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
