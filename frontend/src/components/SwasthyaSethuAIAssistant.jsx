import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Send, X, MessageSquare, Volume2, VolumeX, RefreshCcw, Loader2, Copy, Keyboard, MapPin, Navigation } from 'lucide-react';
import styled from 'styled-components';
import { VoiceNote } from './VoiceNote';
import { speakAssistantMessage, stopSpeech } from '../utils/speechHelper';
import { Conversation, ConversationBubble, ConversationContent, ConversationReactions } from './Conversation';
import { StructuredHealthMessage } from './StructuredHealthMessage';

const ChatContainer = styled.div`
  position: fixed;
  bottom: 90px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  @media (max-width: 640px) {
    bottom: 24px;
    right: 16px;
  }

  @media (max-width: 480px) {
    bottom: 16px;
    right: 12px;
    left: 12px;
    align-items: flex-end;
  }
`;

const ChatButton = styled.button`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 15px 35px rgba(16, 185, 129, 0.5);
  }

  @media (max-width: 480px) {
    width: 52px;
    height: 52px;
  }
`;

const ChatWindow = styled.div`
  width: clamp(340px, 92vw, 450px);
  height: 640px;
  max-height: 85vh;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 16px;
  transform-origin: bottom right;
  transition: all 0.3s ease;
  border: 1px solid rgba(0,0,0,0.08);

  @media (max-width: 640px) {
    width: clamp(300px, 92vw, 420px);
    height: 75vh;
  }

  @media (max-width: 480px) {
    width: 100%;
    max-width: 100%;
    height: 80vh;
    max-height: calc(100dvh - 80px);
    border-radius: 16px;
    margin-bottom: 8px;
  }
`;

const ChatHeader = styled.div`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  padding: 16px 20px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 1.1rem;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.$dark ? '#64748b' : 'white'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$dark ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.2)'};
  }
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f8fafc;
`;

const MessageBubble = styled.div`
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 0.95rem;
  line-height: 1.5;
  white-space: pre-wrap;
  position: relative;
  
  ${props => props.$isUser ? `
    align-self: flex-end;
    background: #10b981;
    color: white;
    border-bottom-right-radius: 4px;
  ` : `
    align-self: flex-start;
    background: white;
    color: #334155;
    border: 1px solid #e2e8f0;
    border-bottom-left-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.02);
  `}
`;

const MessageActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

const ChatInputArea = styled.div`
  padding: 16px;
  background: white;
  border-top: 1px solid #e2e8f0;
`;

const ControlsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Select = styled.select`
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  font-size: 0.85rem;
  color: #334155;
  background: #f8fafc;
  outline: none;
  
  &:focus {
    border-color: #10b981;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 16px;
  border-radius: 24px;
  border: 1px solid #cbd5e1;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s;
  
  &:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  }
`;

const ActionButton = styled.button`
  background: ${props => props.$active ? '#ef4444' : '#10b981'};
  color: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$active ? '#dc2626' : '#059669'};
  }
  
  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
  }
`;

const SuggestionChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
`;

const Chip = styled.button`
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #e2e8f0;
    color: #1e293b;
  }
`;

const SwasthyaSethuAIAssistant = () => {
  const { t, i18n } = useTranslation();
  const languageMap = {
    'en': 'English',
    'hi': 'Hindi',
    'gu': 'Gujarati',
    'mr': 'Marathi',
    'ta': 'Tamil',
    'te': 'Telugu',
    'bn': 'Bengali'
  };
  const currentLangStr = languageMap[i18n.language?.substring(0,2)] || 'English';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{
    role: 'model',
    text: t('chatbot.welcome', 'Hello! I am your Sanjeevani AI Health Assistant. Please ask me any health, symptom, medication, or wellness questions.')
  }]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState(currentLangStr);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [showVoiceNote, setShowVoiceNote] = useState(false);
  
  const reverseLanguageMap = {
    'English': 'en',
    'Hindi': 'hi',
    'Gujarati': 'gu',
    'Marathi': 'mr',
    'Tamil': 'ta',
    'Telugu': 'te',
    'Bengali': 'bn'
  };

  const handleLanguageChange = (e) => {
    const selected = e.target.value;
    setLanguage(selected);
    const code = reverseLanguageMap[selected];
    if (code && i18n.language !== code) {
        i18n.changeLanguage(code);
    }
  };

  // Sync internal state with i18n
  useEffect(() => {
    setLanguage(languageMap[i18n.language?.substring(0,2)] || 'English');
  }, [i18n.language]);

  // Clean up any ongoing audio playback on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [userLocation, setUserLocation] = useState(null);
  const [locationCity, setLocationCity] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const fallbackIpLocation = async () => {
    try {
      const res = await fetch('http://ip-api.com/json/?fields=status,city,regionName,country,lat,lon');
      if (res.ok) {
        const d = await res.json();
        if (d.status === 'success' && d.lat && d.lon) {
          const coords = { lat: d.lat, lng: d.lon, city: d.city || d.regionName };
          setUserLocation(coords);
          setLocationCity(d.city || d.regionName || 'Your City');
          return coords;
        }
      }
    } catch (e) {
      console.warn('IP location fallback notice:', e);
    }
    return null;
  };

  const requestLiveLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      fallbackIpLocation().finally(() => setIsLocating(false));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setIsLocating(false);

        // Reverse geocode to get city / locality name
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=14`, {
          headers: { 'Accept-Language': 'en,hi,gu' }
        })
          .then(r => r.json())
          .then(d => {
            const addr = d?.address || {};
            const city = addr.city || addr.town || addr.village || addr.suburb || addr.district || addr.state;
            if (city) {
              setLocationCity(city);
              setUserLocation(prev => ({ ...prev, city }));
            }
          })
          .catch(() => {
            fetch(`https://photon.komoot.io/reverse?lat=${coords.lat}&lon=${coords.lng}`)
              .then(r => r.json())
              .then(d => {
                const p = d?.features?.[0]?.properties;
                const city = p?.city || p?.district || p?.county || p?.state;
                if (city) {
                  setLocationCity(city);
                  setUserLocation(prev => ({ ...prev, city }));
                }
              })
              .catch(() => {});
          });
      },
      (err) => {
        console.warn('GPS Geolocation unavailable, falling back to IP location:', err.message);
        fallbackIpLocation().finally(() => setIsLocating(false));
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  useEffect(() => {
    requestLiveLocation();
  }, []);

  const suggestions = [
    "Find nearest hospital to my live location",
    "What medicine should I take for fever and headache?",
    "Find nearest hospital with available ICU beds",
    "First aid guidance for sudden chest pain"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleOpenAi = (e) => {
      setIsOpen(true);
      if (e?.detail?.prompt) {
        if (e.detail.autoSend) {
          sendMessage(e.detail.prompt);
        } else {
          setInput(e.detail.prompt);
        }
      }
    };
    window.addEventListener('open-sanjeevani-ai', handleOpenAi);
    return () => window.removeEventListener('open-sanjeevani-ai', handleOpenAi);
  }, [messages, userLocation, language]);

  const getToken = () => localStorage.getItem('gramin_arogya_token');

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    const newMessages = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.filter(m => m.text).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const headers = {
        'Content-Type': 'application/json'
      };
      const token = getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          message: text, 
          history, 
          language,
          location: userLocation 
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessages([...newMessages, { role: 'model', text: data.text }]);
      } else {
        setMessages([...newMessages, { role: 'model', text: `Error: ${data.error}${data.details ? ` - ${data.details}` : ''}` }]);
      }
    } catch (err) {
      setMessages([...newMessages, { role: 'model', text: 'Sorry, I could not connect to the server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone permission denied or not available.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setShowVoiceNote(false);
    }
  };

  const sendVoiceMessage = async (audioBlob) => {
    setMessages(prev => [...prev, { role: 'user', text: '🎙️ Voice Message Sent' }]);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.webm');
    formData.append('language', language);
    if (userLocation) {
      formData.append('location', JSON.stringify(userLocation));
    }

    const headers = {};
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch('/api/chatbot/voice', {
        method: 'POST',
        headers,
        body: formData
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'model', text: data.text }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: `Error: ${data.error}${data.details ? ` - ${data.details}` : ''}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I could not process your voice.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text, index) => {
    if (speakingIndex === index) {
      stopSpeech();
      setSpeakingIndex(null);
      return;
    }

    speakAssistantMessage(
      text,
      language,
      () => setSpeakingIndex(index),
      () => setSpeakingIndex(null),
      () => setSpeakingIndex(null)
    );
  };

  const clearChat = () => {
    setMessages([{
      role: 'model',
      text: 'Hello! I am your Sanjeevani AI Health Assistant. Please ask me any health, symptom, medication, or wellness questions.'
    }]);
    stopSpeech();
    setSpeakingIndex(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <ChatContainer>
      {isOpen && (
        <ChatWindow>
          <ChatHeader>
            <HeaderTitle>
              <img src="/chatbot-avatar.png" alt="AI" style={{ width: '26px', height: '26px', imageRendering: 'pixelated' }} />
              Sanjeevani AI
            </HeaderTitle>
            <HeaderActions>
              <IconButton onClick={clearChat} title="Clear Chat">
                <RefreshCcw size={18} />
              </IconButton>
              <IconButton onClick={() => { stopSpeech(); setSpeakingIndex(null); setIsOpen(false); }} title="Close Chat">
                <X size={20} />
              </IconButton>
            </HeaderActions>
          </ChatHeader>

          {/* Location Bar */}
          <div style={{
            background: userLocation ? '#f0fdf4' : '#f8fafc',
            padding: '7px 14px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.74rem',
            color: userLocation ? '#166534' : '#475569'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <MapPin size={13} className={userLocation ? 'text-emerald-600 shrink-0' : 'text-slate-400 shrink-0'} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                {userLocation 
                  ? `📍 Live Location: ${locationCity || `${userLocation.lat.toFixed(2)}, ${userLocation.lng.toFixed(2)}`} (Nearby Hospitals)`
                  : (isLocating ? '📍 Detecting live location...' : '📍 Fetching nearby hospitals...')}
              </span>
            </div>
            <button
              onClick={requestLiveLocation}
              title="Refresh Live Location"
              style={{
                background: userLocation ? 'transparent' : '#ecfdf5',
                color: '#059669',
                border: userLocation ? 'none' : '1px solid #a7f3d0',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {isLocating ? 'Locating...' : 'Refresh GPS'}
            </button>
          </div>

          <Conversation className="flex-1 overflow-y-auto p-3.5 gap-3 bg-slate-50/80" style={{ maxHeight: '440px' }}>
            {messages.map((msg, idx) => (
              <ConversationBubble
                key={idx}
                align={msg.role === 'user' ? 'end' : 'start'}
                variant={msg.role === 'user' ? 'default' : 'muted'}
                sentAt={msg.role === 'user' ? 'You' : 'Swasthya Copilot'}
                className={msg.role === 'model' ? '!max-w-full w-full' : ''}
              >
                <ConversationContent className={msg.role === 'model' ? 'w-full !max-w-full !p-0 !bg-transparent !border-0 shadow-none' : ''}>
                  <StructuredHealthMessage text={msg.text} isUser={msg.role === 'user'} />
                </ConversationContent>
                {msg.role === 'model' && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px', paddingLeft: '4px' }}>
                    <IconButton $dark onClick={() => copyToClipboard(msg.text)} title="Copy text" data-slot="button">
                      <Copy size={13} />
                    </IconButton>
                    <IconButton $dark onClick={() => speakText(msg.text, idx)} title={speakingIndex === idx ? "Stop speaking" : "Read aloud"} data-slot="button">
                      {speakingIndex === idx ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    </IconButton>
                  </div>
                )}
              </ConversationBubble>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#64748b', padding: '8px 12px' }}>
                <Loader2 size={16} className="lucide-spin" />
                <span style={{ fontSize: '0.85rem' }}>AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </Conversation>

          <ChatInputArea>
            {messages.length === 1 && !showVoiceNote && (
              <SuggestionChips>
                {suggestions.map((s, i) => (
                  <Chip key={i} onClick={() => sendMessage(s)}>{s}</Chip>
                ))}
              </SuggestionChips>
            )}
            
            {!showVoiceNote && (
              <ControlsRow>
                <Select value={language} onChange={handleLanguageChange}>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                </Select>
              </ControlsRow>
            )}
            
            {showVoiceNote ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', justifyContent: 'flex-end' }}>
                <IconButton $dark onClick={() => setShowVoiceNote(false)} title="Type text instead" style={{ marginRight: 'auto' }}>
                  <Keyboard size={20} />
                </IconButton>
                <VoiceNote 
                  onStart={startRecording}
                  onStop={stopRecording}
                  onCancel={() => {
                    if (mediaRecorderRef.current) {
                      mediaRecorderRef.current.onstop = null; // Prevent sending
                    }
                    stopRecording(); // but without sending!
                  }}
                />
              </div>
            ) : (
              <InputWrapper>
                <Input 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                  placeholder="Ask any health or medical question..."
                  disabled={isLoading}
                />
                {input.trim() ? (
                  <ActionButton onClick={() => sendMessage(input)} disabled={isLoading} data-slot="send-button" data-sound="send">
                    <Send size={18} />
                  </ActionButton>
                ) : (
                  <ActionButton 
                    onClick={() => setShowVoiceNote(true)}
                    disabled={isLoading}
                    title="Switch to Voice Note"
                  >
                    <Mic size={18} />
                  </ActionButton>
                )}
              </InputWrapper>
            )}
          </ChatInputArea>
        </ChatWindow>
      )}

      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            width: '80px',
            height: '80px',
            position: 'relative',
            transition: 'transform 0.2s cubic-bezier(0.3, 1.5, 0.4, 1)',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.25))'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15) translateY(-4px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
        >
          <img src="/chatbot-avatar.png" alt="Open AI Assistant" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
          <div style={{
            position: 'absolute',
            bottom: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#ffffff',
            color: '#10b981',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            letterSpacing: '0.02em',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            border: '2px solid #10b981',
            whiteSpace: 'nowrap'
          }}>
            AI Chatbot
          </div>
        </button>
      )}
    </ChatContainer>
  );
};

export default SwasthyaSethuAIAssistant;
