import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Volume2, CheckCircle2, AlertCircle, X, Languages, Zap, Activity } from 'lucide-react';
import { api } from '../utils/api';
import HeartbeatLoader from './HeartbeatLoader';

/**
 * Multilingual Voice AI Triage Modal
 * Fully opaque, non-transparent production-ready clinical assistant.
 */
export default function VoiceModal({
  isOpen,
  onClose,
  onTriageComplete
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef(null);

  // Quick simulation scenarios for field health workers & presentations
  const demoScenarios = [
    {
      title: '👶 Pediatric High Fever (Hindi)',
      lang: 'hi-IN',
      text: 'मेरे 4 साल के बच्चे को 3 दिन से बहुत तेज बुखार है और लगातार उल्टी हो रही है, बच्चा बहुत कमजोर हो गया है।'
    },
    {
      title: '💔 Suspected Cardiac Emergency (Hinglish)',
      lang: 'en-IN',
      text: 'Patient ko kal raat se chhati me bohot tez dard ho raha hai aur saans lene me takleef ho rahi hai. Age 58 years.'
    },
    {
      title: '🤰 High Risk Pregnancy (Hindi)',
      lang: 'hi-IN',
      text: 'गर्भवती महिला उम्र 28 वर्ष, 8वां महीना चल रहा है। पेट में बहुत तेज दर्द है और बीपी 150/100 बढ़ गया है।'
    },
    {
      title: '🐍 Snake Bite Emergency (Hindi)',
      lang: 'hi-IN',
      text: 'खेत में काम करते हुए पैर में सांप ने काट लिया है, मरीज को चक्कर आ रहे हैं और बेहोश हो रहा है।'
    }
  ];

  const baseTranscriptRef = useRef('');

  useEffect(() => {
    // Check Speech Recognition support
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = selectedLang;
      
      rec.onresult = event => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setTranscript(baseTranscriptRef.current + finalTranscript + interimTranscript);
        if (finalTranscript) {
          baseTranscriptRef.current += finalTranscript;
        }
      };
      
      rec.onerror = e => {
        console.warn('Speech recognition error:', e);
        setIsRecording(false);
      };
      rec.onend = () => {
        setIsRecording(false);
      };
      recognitionRef.current = rec;
    }
  }, [selectedLang]); // Removed transcript from dependencies to prevent constant re-initialization

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setErrorMsg('Speech recognition is not directly supported by this browser. Please use the preset buttons or type below.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      // DONT CLEAR TRANSCRIPT
      baseTranscriptRef.current = transcript + (transcript && !transcript.endsWith(' ') ? ' ' : '');
      setTriageResult(null);
      setErrorMsg('');
      recognitionRef.current.lang = selectedLang;
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };


  const handleRunTriage = async (textToUse) => {
    const queryText = textToUse || transcript;
    if (!queryText || queryText.trim() === '') {
      setErrorMsg('Please speak or enter patient symptoms first.');
      return;
    }
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.parseVoiceTriage(queryText, selectedLang);
      if (res.success) {
        setTriageResult(res.data);
      } else {
        setErrorMsg(res.message || 'Failed to analyze symptoms.');
      }
    } catch (err) {
      setErrorMsg('Network error. Falling back to local clinical parser.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToForm = () => {
    if (triageResult && onTriageComplete) {
      onTriageComplete(triageResult);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          position: 'relative',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          color: '#0f172a',
          boxSizing: 'border-box'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              border: '1px solid #bbf7d0',
              flexShrink: 0
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                Multilingual Voice AI Triage
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Speak in Hindi or regional language to automatically extract clinical vitals & triage risk.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: 'none',
              background: '#f1f5f9',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Language & Voice Input Section */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '18px'
        }}>
          {/* Language selector bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#334155'
            }}>
              <Languages size={16} color="#0d9488" />
              <span>Input Language:</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSelectedLang('hi-IN')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: selectedLang === 'hi-IN' ? '2px solid #0d9488' : '1px solid #cbd5e1',
                  background: selectedLang === 'hi-IN' ? '#ecfdf5' : '#ffffff',
                  color: selectedLang === 'hi-IN' ? '#065f46' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                🇮🇳 हिन्दी (Hindi)
              </button>
              <button
                type="button"
                onClick={() => setSelectedLang('en-IN')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: selectedLang === 'en-IN' ? '2px solid #0d9488' : '1px solid #cbd5e1',
                  background: selectedLang === 'en-IN' ? '#ecfdf5' : '#ffffff',
                  color: selectedLang === 'en-IN' ? '#065f46' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                English / Hinglish
              </button>
            </div>
          </div>

          {/* Big Mic Button & Live Recording Status */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 0 16px 0',
            gap: '10px'
          }}>
            <button
              type="button"
              onClick={toggleRecording}
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                border: isRecording ? '3px solid #ef4444' : '3px solid #0d9488',
                background: isRecording ? '#fee2e2' : '#f0fdf4',
                color: isRecording ? '#dc2626' : '#059669',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isRecording ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 4px 12px rgba(13, 148, 136, 0.2)',
                transition: 'all 0.2s ease',
                transform: isRecording ? 'scale(1.08)' : 'scale(1)'
              }}
              title={isRecording ? 'Stop Recording' : 'Start Speaking'}
            >
              {isRecording ? <MicOff size={30} /> : <Mic size={30} />}
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: isRecording ? '#dc2626' : '#1e293b'
              }}>
                {isRecording ? '🔴 Listening... Speak patient symptoms now' : 'Click microphone to start voice recording'}
              </div>
              {isRecording && (
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                  Natural language AI is processing speech input...
                </div>
              )}
            </div>
          </div>

          {/* Transcript input box */}
          <div style={{ marginTop: '6px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#334155',
              marginBottom: '6px'
            }}>
              Captured Voice Transcript / Manual Input:
            </label>
            <textarea
              rows={3}
              value={transcript}
              onChange={e => {
                setTranscript(e.target.value);
                baseTranscriptRef.current = e.target.value;
              }}
              placeholder="Speak or type clinical symptoms in Hindi, English, or Hinglish..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* SIH Presentation Presets */}
          <div style={{ marginTop: '14px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: '#475569',
              marginBottom: '8px'
            }}>
              <Zap size={14} color="#d97706" />
              <span>Instant Demo Scenarios (1-Click Test):</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '8px'
            }}>
              {demoScenarios.map((sc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTranscript(sc.text);
                    setSelectedLang(sc.lang);
                    handleRunTriage(sc.text);
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#0d9488'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{sc.title}</div>
                  <div style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: '#64748b',
                    marginTop: '2px'
                  }}>
                    "{sc.text}"
                  </div>
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              fontSize: '0.8rem',
              color: '#b91c1c',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={{
            marginTop: '14px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}>
            <button
              type="button"
              onClick={() => handleRunTriage(transcript)}
              disabled={loading || !transcript.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: loading ? '#0f766e' : 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: loading || !transcript.trim() ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                minHeight: '40px'
              }}
            >
              {loading ? (
                <HeartbeatLoader size={20} color="#ffffff" text="AI Analyzing..." />
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Extract & Analyze Clinical Triage</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Structured AI Triage Output */}
        {triageResult && (
          <div style={{
            background: '#ffffff',
            border: `2px solid ${triageResult.triageAssessment.badgeColor}`,
            borderRadius: '12px',
            padding: '18px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} color="#059669" />
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  AI Clinical Extraction Results
                </span>
              </div>
              <div style={{
                padding: '4px 12px',
                fontWeight: 800,
                fontSize: '0.78rem',
                borderRadius: '12px',
                letterSpacing: '0.04em',
                background: triageResult.triageAssessment.riskLevel === 'CRITICAL' ? '#fee2e2' : triageResult.triageAssessment.riskLevel === 'MODERATE' ? '#fef3c7' : '#dcfce7',
                color: triageResult.triageAssessment.riskLevel === 'CRITICAL' ? '#b91c1c' : triageResult.triageAssessment.riskLevel === 'MODERATE' ? '#b45309' : '#15803d',
                border: `1px solid ${triageResult.triageAssessment.badgeColor}`
              }}>
                {triageResult.triageAssessment.riskLevel} PRIORITY ({triageResult.triageAssessment.triageCategory})
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
              marginBottom: '14px'
            }}>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px'
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Estimated Age
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {triageResult.structuredData.estimatedAge} Years
                </div>
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px'
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Symptom Duration
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {triageResult.structuredData.duration}
                </div>
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px'
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Recommended Facility Tier
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {triageResult.triageAssessment.recommendedFacilityType}
                </div>
              </div>
            </div>

            {/* Extracted Vitals */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '14px'
            }}>
              <div style={{
                fontSize: '0.76rem',
                fontWeight: 700,
                color: '#475569',
                marginBottom: '6px'
              }}>
                📊 Extracted Baseline Vitals:
              </div>
              <div style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                fontSize: '0.85rem',
                color: '#0f172a'
              }}>
                <span><strong>BP:</strong> {triageResult.structuredData.vitals.bp}</span>
                <span><strong>SpO2:</strong> {triageResult.structuredData.vitals.spo2}%</span>
                <span><strong>Temp:</strong> {triageResult.structuredData.vitals.temp}°F</span>
                <span><strong>Pulse:</strong> {triageResult.structuredData.vitals.pulse} bpm</span>
              </div>
            </div>

            {/* Clinical Action Note */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '14px',
              fontSize: '0.82rem',
              color: '#334155',
              lineHeight: 1.5
            }}>
              <strong style={{ color: '#0f172a' }}>Clinical Action Guidance:</strong> {triageResult.triageAssessment.actionGuidance}
            </div>

            {/* Responsible AI Notice */}
            <div style={{
              fontSize: '0.72rem',
              color: '#64748b',
              fontStyle: 'italic',
              marginBottom: '16px'
            }}>
              ⚠️ {triageResult.triageAssessment.responsibleAiDisclaimer}
            </div>

            {/* Apply to Patient Intake Form */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleApplyToForm}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                }}
              >
                <CheckCircle2 size={16} />
                <span>Auto-Fill into Patient Registration Form</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}