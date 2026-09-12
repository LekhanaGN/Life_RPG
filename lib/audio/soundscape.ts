// Web Audio API procedural soundscape engine for 80s supernatural synth FX
// Pure synthesizer - zero external media assets required.

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user gesture to comply with browser autoplay policies
  }

  private init() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : 0.4,
        this.ctx.currentTime
      );
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Retro hover blip
  public playHover() {
    if (this.isMuted) return;
    const ctx = this.init();
    if (!ctx || !this.masterGain) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Ignore audio policy restrictions
    }
  }

  // Retro glitch click
  public playGlitch() {
    if (this.isMuted) return;
    const ctx = this.init();
    if (!ctx || !this.masterGain) return;

    try {
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(3, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(ctx.currentTime);
    } catch {
      // Ignore audio policy restrictions
    }
  }

  // Cinematic 80s Inversion Portal: Sub-bass swell + resonant filter sweep + dark detuned chord
  public playInversion() {
    if (this.isMuted) return;
    const ctx = this.init();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const duration = 1.8;

      // Sub-bass drone
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = "sawtooth";
      subOsc.frequency.setValueAtTime(110, now);
      subOsc.frequency.exponentialRampToValueAtTime(45, now + duration);

      // Low pass filter with intense resonance
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + duration);
      filter.Q.setValueAtTime(8, now);

      subGain.gain.setValueAtTime(0.01, now);
      subGain.gain.linearRampToValueAtTime(0.25, now + 0.4);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      subOsc.connect(filter);
      filter.connect(subGain);
      subGain.connect(this.masterGain);

      subOsc.start(now);
      subOsc.stop(now + duration);

      // Detuned eerie harmonic
      const detunedOsc = ctx.createOscillator();
      const detunedGain = ctx.createGain();
      detunedOsc.type = "square";
      detunedOsc.frequency.setValueAtTime(146.83, now); // D3
      detunedOsc.detune.setValueAtTime(-25, now);
      detunedOsc.detune.linearRampToValueAtTime(-150, now + duration);

      detunedGain.gain.setValueAtTime(0.01, now);
      detunedGain.gain.linearRampToValueAtTime(0.12, now + 0.6);
      detunedGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      detunedOsc.connect(filter);
      detunedGain.connect(this.masterGain);
      detunedOsc.start(now);
      detunedOsc.stop(now + duration);
    } catch {
      // Ignore audio policy restrictions
    }
  }

  // Restoration Portal: Rising harmonious synth chord lifting back to the Right Side
  public playRestoration() {
    if (this.isMuted) return;
    const ctx = this.init();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const duration = 1.6;

      const chordFrequencies = [130.81, 164.81, 196.0, 261.63]; // C major spread

      chordFrequencies.forEach((freq, idx) => {
        if (!ctx || !this.masterGain) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq * 0.8, now);
        osc.frequency.exponentialRampToValueAtTime(freq, now + duration * 0.6);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.exponentialRampToValueAtTime(2400, now + duration * 0.8);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.1 / (idx + 1), now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration);
      });
    } catch {
      // Ignore audio policy restrictions
    }
  }
}

export const soundscape = new SoundscapeEngine();
