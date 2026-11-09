import * as THREE from 'three';

/**
 * Web Audio System for Club Pulse 3D:
 * - Real-time Electronic Dance Music procedural synthesizer (Kick, Bass, Hats, Claps, Lead Synths)
 * - Custom Audio File loader (.mp3 / .wav / .ogg)
 * - FFT Spectrum Analysis (Sub-Bass, Bass, Mids, Highs)
 * - Algorithmic Beat Drop & Peak Detection
 * - Real-time Equalizer hook for UI visualizer
 */
export class SoundSystem {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.analyser = null;
    this.freqData = null;

    this.isPlaying = false;
    this.isMuted = false;
    this.currentTrack = 'synth';
    this.volume = 0.8;

    // Synthesizer Sequencer State (128 BPM Club House)
    this.bpm = 128;
    this.step = 0;
    this.timerId = null;
    this.customAudioBuffer = null;
    this.customSourceNode = null;

    // Beat Detection
    this.beatThreshold = 0.65;
    this.lastBeatTime = 0;
    this.isBeat = false;

    // Frequency bands
    this.audioData = {
      subBass: 0,
      bass: 0,
      lowMid: 0,
      mid: 0,
      high: 0,
      volume: 0,
      isBeat: false
    };
  }

  async init() {
    if (this.audioContext) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();

    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  start() {
    this.init().then(() => {
      this.isPlaying = true;
      if (this.currentTrack !== 'custom') {
        this.startSynthSequencer();
      }
    });
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.customSourceNode) {
      this.customSourceNode.stop();
      this.customSourceNode = null;
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.volume,
        this.audioContext.currentTime,
        0.05
      );
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.setVolume(this.volume);
    return this.isMuted;
  }

  setTrack(trackId) {
    this.currentTrack = trackId;
    if (this.isPlaying) {
      this.stop();
      this.start();
    }
  }

  // Procedural 128 BPM Club Beat Sequencer
  startSynthSequencer() {
    if (this.timerId) clearInterval(this.timerId);

    const stepInterval = (60 / this.bpm / 4) * 1000; // 16th notes (~117ms)
    this.step = 0;

    this.timerId = setInterval(() => {
      if (!this.isPlaying || !this.audioContext) return;
      const t = this.audioContext.currentTime + 0.02;

      // 4-on-the-floor Kick (Every 4 sixteenth steps: 0, 4, 8, 12)
      if (this.step % 4 === 0) {
        this.triggerKick(t);
      }

      // Snare / Clap on beats 2 and 4 (steps 4 and 12)
      if (this.step % 8 === 4) {
        this.triggerClap(t);
      }

      // Hi-hats: Offbeat open hats on steps 2, 6, 10, 14; 16th closed hats
      if (this.step % 4 === 2) {
        this.triggerOpenHat(t);
      } else {
        this.triggerClosedHat(t);
      }

      // Rolling Bassline (16th groove)
      this.triggerBass(t, this.step);

      // Lead Synth Melody
      this.triggerLead(t, this.step);

      this.step = (this.step + 1) % 16;
    }, stepInterval);
  }

  // Synthesized Punchy Club Kick Drum
  triggerKick(time) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.frequency.setValueAtTime(145, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    gain.gain.setValueAtTime(1.1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  // Synthesized Club Clap
  triggerClap(time) {
    const bufferSize = this.audioContext.sampleRate * 0.15;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.audioContext.sampleRate * 0.04));
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, time);
    filter.Q.setValueAtTime(2.5, time);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
  }

  // Synthesized Hi-Hats
  triggerClosedHat(time) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(9000, time);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  triggerOpenHat(time) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(7500, time);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.16);
  }

  // Synthesized Bassline (Electro Sawtooth / Square)
  triggerBass(time, step) {
    // 16-step bass notes (F - Ab - Eb - Bb progression)
    const baseFreqs = [55, 55, 65.4, 55, 49, 49, 58.2, 49, 43.6, 43.6, 55, 43.6, 58.2, 58.2, 65.4, 55];
    const freq = baseFreqs[step] || 55;

    const osc = this.audioContext.createOscillator();
    osc.type = this.currentTrack === 'trance' ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, time);
    filter.frequency.exponentialRampToValueAtTime(80, time + 0.1);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.11);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.12);
  }

  // Synthesized Arp Lead
  triggerLead(time, step) {
    if (this.currentTrack === 'breakbeat' && step % 2 !== 0) return;

    const leadNotes = [220, 261.6, 329.6, 392, 440, 523.2, 659.2, 523.2];
    const note = leadNotes[(step * 2) % leadNotes.length];

    const osc = this.audioContext.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(note, time);

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.Q.setValueAtTime(3.0, time);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.22, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.13);
  }

  // Load custom user audio file
  async loadCustomFile(file) {
    await this.init();
    const arrayBuffer = await file.arrayBuffer();
    this.customAudioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    this.currentTrack = 'custom';
    this.stop();

    this.customSourceNode = this.audioContext.createBufferSource();
    this.customSourceNode.buffer = this.customAudioBuffer;
    this.customSourceNode.loop = true;
    this.customSourceNode.connect(this.masterGain);
    this.customSourceNode.start(0);
    this.isPlaying = true;
  }

  // Frame update: extract frequency bands & detect beat pulses
  update() {
    if (!this.analyser || !this.isPlaying) {
      return this.audioData;
    }

    this.analyser.getByteFrequencyData(this.freqData);

    const avg = (start, end) => {
      let sum = 0;
      for (let i = start; i < end; i++) {
        sum += this.freqData[i];
      }
      return sum / (end - start) / 255;
    };

    // 256 frequency bins (each ~86Hz)
    this.audioData.subBass = avg(0, 3);
    this.audioData.bass = avg(3, 10);
    this.audioData.lowMid = avg(10, 35);
    this.audioData.mid = avg(35, 90);
    this.audioData.high = avg(90, 180);

    // Total average volume
    this.audioData.volume = (this.audioData.bass + this.audioData.mid + this.audioData.high) / 3;

    // Beat detection
    const now = performance.now();
    if (this.audioData.bass > this.beatThreshold && now - this.lastBeatTime > 280) {
      this.audioData.isBeat = true;
      this.lastBeatTime = now;
    } else {
      this.audioData.isBeat = false;
    }

    return this.audioData;
  }
}
