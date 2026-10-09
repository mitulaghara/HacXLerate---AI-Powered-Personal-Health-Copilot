// Clean and prepare text for Speech Synthesis
export const cleanTextForSpeech = (rawText) => {
  if (!rawText) return '';
  return rawText
    .replace(/```[\s\S]*?```/g, '') // remove code blocks
    .replace(/\|[^\n]+\|/g, '') // remove markdown table rows
    .replace(/[-*#_~`>+=\|\[\]\(\)]/g, ' ') // remove markdown syntax characters
    .replace(/https?:\/\/\S+/g, '') // remove urls
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // remove emojis
    .replace(/\s+/g, ' ')
    .trim();
};

export const LANG_SPEECH_CONFIG = {
  English: { bcp47: 'en-IN', fallback: 'en-US', ttsCode: 'en' },
  Hindi: { bcp47: 'hi-IN', fallback: 'hi', ttsCode: 'hi' },
  Gujarati: { bcp47: 'gu-IN', fallback: 'gu', ttsCode: 'gu' },
  Marathi: { bcp47: 'mr-IN', fallback: 'mr', ttsCode: 'mr' },
  Tamil: { bcp47: 'ta-IN', fallback: 'ta', ttsCode: 'ta' },
  Telugu: { bcp47: 'te-IN', fallback: 'te', ttsCode: 'te' },
  Bengali: { bcp47: 'bn-IN', fallback: 'bn', ttsCode: 'bn' }
};

let currentAudio = null;

export const stopSpeech = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Speak text in the specified language using Web Speech API with Google TTS fallback
 */
export const speakAssistantMessage = (rawText, languageName = 'English', onStart, onEnd, onError) => {
  stopSpeech();

  const cleaned = cleanTextForSpeech(rawText);
  if (!cleaned) {
    if (onEnd) onEnd();
    return;
  }

  const config = LANG_SPEECH_CONFIG[languageName] || LANG_SPEECH_CONFIG.English;

  // 1. Try Browser Native SpeechSynthesis if suitable voice exists
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const voices = window.speechSynthesis.getVoices();
    const prefix = config.ttsCode.toLowerCase();
    
    // Look for a voice matching this Indian language
    const matchedVoice = voices.find(v => {
      const vLang = (v.lang || '').toLowerCase();
      const vName = (v.name || '').toLowerCase();
      return vLang.startsWith(prefix) || vName.includes(languageName.toLowerCase());
    });

    // If native voice is available, use SpeechSynthesis
    if (matchedVoice || prefix === 'en') {
      try {
        const utterance = new SpeechSynthesisUtterance(cleaned);
        utterance.lang = config.bcp47;
        if (matchedVoice) utterance.voice = matchedVoice;
        utterance.rate = 0.95; // Slightly clearer pace for medical guidance
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          if (onStart) onStart();
        };

        utterance.onend = () => {
          if (onEnd) onEnd();
        };

        utterance.onerror = (e) => {
          console.warn('Native speech synthesis error, switching to fallback:', e);
          fallbackToAudioTTS(cleaned, config.ttsCode, onStart, onEnd, onError);
        };

        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        console.warn('SpeechSynthesis failed:', err);
      }
    }
  }

  // 2. High-Fidelity Fallback: Google Neural/Standard Audio TTS
  fallbackToAudioTTS(cleaned, config.ttsCode, onStart, onEnd, onError);
};

// Fallback audio player chunking text to max 200 chars for clean playback
const fallbackToAudioTTS = (text, langCode, onStart, onEnd, onError) => {
  try {
    // Split into sentences / manageable chunks
    const chunks = text.match(/[^.!?।\n]+[.!?।\n]?/g) || [text];
    const safeChunks = chunks
      .map(c => c.trim())
      .filter(c => c.length > 0)
      .slice(0, 5); // Read up to first 5 sentences for responsiveness

    if (safeChunks.length === 0) {
      if (onEnd) onEnd();
      return;
    }

    if (onStart) onStart();

    let currentIndex = 0;
    const playNextChunk = () => {
      if (currentIndex >= safeChunks.length) {
        if (onEnd) onEnd();
        return;
      }

      const chunkText = safeChunks[currentIndex];
      currentIndex++;

      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(langCode)}&client=tw-ob&q=${encodeURIComponent(chunkText.substring(0, 180))}`;
      const audio = new Audio(url);
      currentAudio = audio;

      audio.onended = () => {
        playNextChunk();
      };

      audio.onerror = (err) => {
        console.warn('Audio playback error for chunk:', err);
        // Continue to next or stop
        playNextChunk();
      };

      audio.play().catch(e => {
        console.warn('Audio play was interrupted or blocked by browser policy:', e);
        if (onEnd) onEnd();
      });
    };

    playNextChunk();
  } catch (err) {
    console.error('TTS playback failure:', err);
    if (onError) onError(err);
    if (onEnd) onEnd();
  }
};
