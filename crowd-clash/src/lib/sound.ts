// Lightweight procedural Web Audio sound cues for the Host stage (no external audio assets)

class StageAudio {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.08, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playJoin() {
    this.tone(587.33, 0.09, 'triangle', 0.05);
    this.tone(880, 0.12, 'triangle', 0.05, 0.06);
  }

  playRoundStart() {
    this.tone(440, 0.14, 'triangle', 0.09, 0);
    this.tone(554.37, 0.14, 'triangle', 0.09, 0.1);
    this.tone(880, 0.28, 'triangle', 0.11, 0.2);
  }

  playTick() {
    this.tone(720, 0.06, 'sine', 0.05);
  }

  playRoundEnd() {
    this.tone(659.25, 0.14, 'triangle', 0.09, 0);
    this.tone(523.25, 0.28, 'triangle', 0.09, 0.14);
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.tone(n, idx === notes.length - 1 ? 0.55 : 0.16, 'triangle', 0.1, idx * 0.11);
    });
  }
}

export const stageAudio = new StageAudio();
