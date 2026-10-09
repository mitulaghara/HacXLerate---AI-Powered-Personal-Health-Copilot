import * as React from 'react';

// Web Audio synthesizer for conversational UI sound effects
class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playPop(freq = 600, duration = 0.06) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio playback suspended or not allowed
    }
  }

  playSend() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio fallback
    }
  }
}

const engine = new SoundEngine();

export function SoundEffects({ children }) {
  React.useEffect(() => {
    function handleDocumentClick(e) {
      engine.init();
      const target = e.target.closest('[data-slot], [data-sound]');
      if (!target) return;

      const slot = target.getAttribute('data-slot');
      const sound = target.getAttribute('data-sound');

      if (sound === 'send' || slot === 'send-button') {
        engine.playSend();
      } else if (slot === 'conversation-bubble' || slot === 'conversation-reactions') {
        engine.playPop(520, 0.05);
      }
    }

    document.addEventListener('click', handleDocumentClick, { passive: true });
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  return <>{children}</>;
}

export default SoundEffects;
