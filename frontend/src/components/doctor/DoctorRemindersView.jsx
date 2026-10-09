import React, { useState, useEffect } from 'react';
import { Bell, User, CheckCircle2, FileText, RefreshCw, KeyRound, Shield, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../utils/api';
export default function DoctorRemindersView({
  onSelectPatientForHistory,
  onWriteRx
}) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');

  // OTP Modal State
  const [otpModal, setOtpModal] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMsg, setOtpMsg] = useState('');
  const loadReminders = async () => {
    setLoading(true);
    try {
      const res = await api.getDoctorReminders();
      if (res.success && res.reminders) setReminders(res.reminders);
    } catch (err) {
      console.error('Error fetching reminders:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadReminders();
    const interval = setInterval(() => {
      api.getDoctorReminders().then(res => {
        if (res.success && res.reminders) {
          setReminders(res.reminders);
        }
      }).catch(() => {});
    }, 8000);
    return () => clearInterval(interval);
  }, []);
  const openMarkDoneModal = rem => {
    setOtpModal(rem);
    setMaskedEmail('');
    setOtpCode('');
    setOtpSent(false);
    setOtpMsg('Sending OTP to patient\'s registered email...');
  };
  const closeOtpModal = () => {
    setOtpModal(null);
    setMaskedEmail('');
    setOtpCode('');
    setOtpSent(false);
    setOtpMsg('');
  };

  // Auto-send OTP as soon as the modal opens
  useEffect(() => {
    if (!otpModal) return;
    const send = async () => {
      setOtpLoading(true);
      setOtpMsg('');
      try {
        const res = await api.sendFollowUpOtp({
          reminderId: otpModal._id,
          patientId: otpModal.patientId,
          patientName: otpModal.patientName
        });
        if (res.success) {
          setOtpSent(true);
          setMaskedEmail(res.maskedEmail || '');
          setOtpMsg('OTP sent! Ask the patient to share the OTP code with you.');
        } else {
          setOtpMsg(res.message || 'Failed to send OTP. Ensure patient has a registered email.');
        }
      } catch {
        setOtpMsg('Network error sending OTP. Please try again.');
      } finally {
        setOtpLoading(false);
      }
    };
    send();
  }, [otpModal]);
  const handleResendOtp = async () => {
    if (!otpModal || otpLoading) return;
    setOtpLoading(true);
    setOtpMsg('');
    setOtpCode('');
    try {
      const res = await api.sendFollowUpOtp({
        reminderId: otpModal._id,
        patientId: otpModal.patientId,
        patientName: otpModal.patientName
      });
      if (res.success) {
        setMaskedEmail(res.maskedEmail || '');
        setOtpMsg('New OTP sent! Ask the patient to share the new code.');
      } else {
        setOtpMsg(res.message || 'Failed to resend OTP.');
      }
    } catch {
      setOtpMsg('Network error. Please check connection.');
    } finally {
      setOtpLoading(false);
    }
  };
  const handleVerifyAndComplete = async e => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setOtpMsg('Please enter the 6-digit OTP from the patient.');
      return;
    }
    setOtpLoading(true);
    setOtpMsg('');
    try {
      const res = await api.verifyFollowUpOtp({
        reminderId: otpModal._id,
        otp: otpCode.trim()
      });
      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: {
            y: 0.6
          }
        });
        setReminders(prev => prev.map(r => r._id === otpModal._id ? {
          ...r,
          status: 'COMPLETED'
        } : r));
        setOtpMsg('Follow-up verified and marked as COMPLETED!');
        setTimeout(() => closeOtpModal(), 1800);
      } else {
        setOtpMsg(res.message || 'OTP verification failed.');
      }
    } catch {
      setOtpMsg('Verification failed. Check connection.');
    } finally {
      setOtpLoading(false);
    }
  };
  const today = new Date().toDateString();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toDateString();
  const isToday = d => new Date(d).toDateString() === today;
  const isTomorrow = d => new Date(d).toDateString() === tomorrow;
  const filteredReminders = reminders.filter(r => {
    if (filter === 'TODAY') return isToday(r.dueDate) && r.status === 'PENDING';
    if (filter === 'TOMORROW') return isTomorrow(r.dueDate) && r.status === 'PENDING';
    if (filter === 'URGENT') return (r.priority === 'URGENT' || r.priority === 'CRITICAL') && r.status === 'PENDING';
    return true;
  });
  const todayCount = reminders.filter(r => isToday(r.dueDate) && r.status === 'PENDING').length;
  const tomorrowCount = reminders.filter(r => isTomorrow(r.dueDate) && r.status === 'PENDING').length;
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  }}>

      {/* Banner */}
      <div style={{
      background: '#0f766e',
      padding: '22px 26px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}>
          <div style={{
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #e2e8f0'
        }}>
            <Bell size={26} color="#fef08a" />
          </div>
          <div>
            <h2 style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            margin: 0
          }}>Doctor Follow-Up Reminders Queue</h2>
            <p style={{
            fontSize: '0.82rem',
            margin: '4px 0 0'
          }}>
              Scheduled Following Day Checkups • Clinical Surveillance • Post-Treatment Reviews
            </p>
          </div>
        </div>
        <button type="button" onClick={loadReminders} style={{
        border: '1px solid #e2e8f0',
        padding: '8px 14px',
        fontSize: '0.82rem',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
          <RefreshCw size={14} /> <span>Refresh</span>
        </button>
      </div>

      {/* Filter pills */}
      <div style={{
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap'
    }}>
        {[{
        id: 'ALL',
        label: `All (${reminders.length})`
      }, {
        id: 'TOMORROW',
        label: `⚡ Tomorrow (${tomorrowCount})`
      }, {
        id: 'TODAY',
        label: `🚨 Due Today (${todayCount})`
      }, {
        id: 'URGENT',
        label: '🔥 Urgent Only'
      }].map(flt => <button key={flt.id} type="button" onClick={() => setFilter(flt.id)} style={{
        padding: '8px 16px',
        border: `1.5px solid ${filter === flt.id ? '#d97706' : '#e5e7eb'}`,
        fontSize: '0.82rem',
        fontWeight: filter === flt.id ? 800 : 600,
        cursor: 'pointer'
      }}>
            {flt.label}
          </button>)}
      </div>

      {/* Cards */}
      {filteredReminders.length === 0 ? <div style={{
      border: '1px solid #e2e8f0',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
          <CheckCircle2 size={42} color="#10b981" style={{
        margin: '0 auto 10px'
      }} />
          <h3 style={{
        fontSize: '1.1rem',
        fontWeight: 800,
        margin: 0
      }}>No Pending Reminders</h3>
          <p style={{
        fontSize: '0.82rem',
        marginTop: '4px'
      }}>Open patient history and click "Remind for Following Day Checkup" to add reminders.</p>
        </div> : <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
      gap: '16px'
    }}>
          {filteredReminders.map(rem => {
        const dueDayLabel = isTomorrow(rem.dueDate) ? '⚡ TOMORROW' : isToday(rem.dueDate) ? '🚨 DUE TODAY' : new Date(rem.dueDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        const isCompleted = rem.status === 'COMPLETED';
        return (
          <div key={rem._id} style={{
          border: `1.5px solid ${isTomorrow(rem.dueDate) ? '#fde68a' : isToday(rem.dueDate) ? '#fecaca' : '#e5e7eb'}`,
          padding: '18px 20px',
          opacity: isCompleted ? 0.7 : 1
        }}>
                <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
                  <span style={{
              border: `1px solid ${isTomorrow(rem.dueDate) ? '#fde68a' : '#e5e7eb'}`,
              padding: '3px 8px',
              fontSize: '0.72rem',
              fontWeight: 800
            }}>{dueDayLabel}</span>
                  <span style={{
              padding: '2px 7px',
              fontSize: '0.68rem',
              fontWeight: 800
            }}>{rem.priority}</span>
                </div>
                <div style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            marginBottom: '4px'
          }}>{rem.patientName}</div>
                <div style={{
            fontSize: '0.76rem',
            marginBottom: '8px'
          }}>
                  ID: <strong style={{}}>{rem.patientId}</strong>
                  {rem.patientPhone && ` • 📞 ${rem.patientPhone}`}
                </div>
                <div style={{
            padding: '9px 12px',
            fontSize: '0.8rem',
            marginBottom: '14px',
            border: '1px solid #e2e8f0',
            lineHeight: 1.4
          }}>
                  <strong>Checkup:</strong> {rem.reason}
                </div>
                <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
                  <button type="button" onClick={() => onSelectPatientForHistory && onSelectPatientForHistory(rem.patientId)} style={{
              padding: '6px 12px',
              border: '1px solid #e2e8f0',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
                    <User size={13} /> Open History
                  </button>
                  <button type="button" onClick={() => onWriteRx && onWriteRx({
              id: rem.patientId,
              name: rem.patientName,
              phone: rem.patientPhone,
              chiefComplaint: rem.reason
            })} style={{
              padding: '6px 12px',
              border: '1px solid #e2e8f0',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
                    <FileText size={13} /> Write Rx
                  </button>
                  {!isCompleted ? (
                    <button type="button" onClick={() => openMarkDoneModal(rem)} style={{
                      padding: '6px 14px',
                      border: 'none',
                      background: '#0f766e',
                      color: '#ffffff',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginLeft: 'auto',
                      borderRadius: '6px'
                    }}>
                      <Shield size={13} /> Mark Done (OTP)
                    </button>
                  ) : (
                    <span style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      marginLeft: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#059669'
                    }}>
                      <CheckCircle2 size={14} /> Verified & Done
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>}

      {/* OTP Verification Modal */}
      {otpModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.72)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08)',
            padding: '28px 30px',
            width: '100%',
            maxWidth: '460px',
            position: 'relative',
            color: '#0f172a'
          }}>
            <button 
              type="button"
              onClick={closeOtpModal} 
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
            >
              <X size={18} />
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Shield size={22} color="#ffffff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: '0 0 2px 0'
                }}>Follow-Up OTP Verification</h3>
                <p style={{
                  fontSize: '0.82rem',
                  color: '#64748b',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  Patient: <strong style={{ color: '#0f766e', fontWeight: 700 }}>{otpModal.patientName}</strong>
                </p>
              </div>
            </div>

            {otpLoading && !otpSent ? (
              <div style={{
                textAlign: 'center',
                padding: '36px 0',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#334155'
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  border: '3px solid #ccfbf1',
                  borderTop: "3px solid #0f766e",
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }} />
                Sending secure OTP to patient's registered email...
              </div>
            ) : (
              <form onSubmit={handleVerifyAndComplete}>
                {otpSent && maskedEmail && (
                  <div style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '18px',
                    fontSize: '0.84rem',
                    lineHeight: 1.5,
                    color: '#166534'
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>✅</span> OTP sent to: <span style={{ fontFamily: 'monospace', fontSize: '0.88rem' }}>{maskedEmail}</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#15803d' }}>
                      Ask the patient to check their email and share the 6-digit code with you.
                    </span>
                  </div>
                )}

                <label style={{
                  display: 'block',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '8px'
                }}>
                  Enter 6-Digit OTP shared by Patient <span style={{ color: '#ef4444' }}>*</span>
                </label>

                <div style={{
                  position: 'relative',
                  marginBottom: '16px'
                }}>
                  <KeyRound size={18} color="#94a3b8" style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none'
                  }} />
                  <input 
                    type="text" 
                    maxLength={6} 
                    required 
                    placeholder="• • • • • •" 
                    value={otpCode} 
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} 
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      backgroundColor: '#f8fafc',
                      border: '2px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      letterSpacing: '10px',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                      textAlign: 'center',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onFocus={e => { e.target.style.borderColor = '#0f766e'; e.target.style.backgroundColor = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.15)'; }}
                    onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                {otpMsg && (
                  <div style={{
                    backgroundColor: otpMsg.toLowerCase().includes('success') ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${otpMsg.toLowerCase().includes('success') ? '#bbf7d0' : '#fecaca'}`,
                    color: otpMsg.toLowerCase().includes('success') ? '#166534' : '#b91c1c',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    marginBottom: '16px',
                    fontWeight: 600,
                    textAlign: 'center'
                  }}>
                    {otpMsg}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '6px'
                }}>
                  <button 
                    type="button" 
                    onClick={handleResendOtp} 
                    disabled={otpLoading} 
                    style={{
                      flex: 1,
                      padding: '11px 16px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      color: '#475569',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      cursor: otpLoading ? 'not-allowed' : 'pointer',
                      opacity: otpLoading ? 0.6 : 1,
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={e => { if (!otpLoading) { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; } }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                  >
                    ↺ Resend
                  </button>
                  <button 
                    type="submit" 
                    disabled={otpLoading || otpCode.length < 4} 
                    style={{
                      flex: 2,
                      padding: '11px 20px',
                      border: 'none',
                      borderRadius: '10px',
                      background: otpLoading || otpCode.length < 4 ? '#94a3b8' : 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: otpLoading || otpCode.length < 4 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: otpLoading || otpCode.length < 4 ? 'none' : '0 4px 12px rgba(15, 118, 110, 0.3)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <CheckCircle2 size={16} /> {otpLoading ? 'Verifying...' : 'Verify & Mark Done'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>;
}
