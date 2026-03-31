'use client';

interface ActiveSound {
  gainNode: GainNode;
  stopFn: () => void;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeSounds = new Map<string, ActiveSound>();
  private _masterVolume = 1;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._masterVolume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private createWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    return buffer;
  }

  private startNoiseSource(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.start();
    return source;
  }

  private buildRain(ctx: AudioContext, masterGain: GainNode, volume: number): ActiveSound {
    const gainNode = ctx.createGain();
    gainNode.gain.value = volume * 0.7;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.5;
    const source = this.startNoiseSource(ctx, this.createWhiteNoiseBuffer(ctx));
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);
    return { gainNode, stopFn: () => source.stop() };
  }

  private buildThunder(ctx: AudioContext, masterGain: GainNode, volume: number): ActiveSound {
    const gainNode = ctx.createGain();
    gainNode.gain.value = volume * 0.4;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    const source = this.startNoiseSource(ctx, this.createBrownNoiseBuffer(ctx));
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);

    // Periodic thunder rumbles
    let stopped = false;
    const scheduleThunder = () => {
      if (stopped) return;
      const delay = 8000 + Math.random() * 20000;
      setTimeout(() => {
        if (stopped) return;
        const burst = ctx.createGain();
        burst.gain.value = 0;
        burst.gain.linearRampToValueAtTime(volume * 1.2, ctx.currentTime + 0.1);
        burst.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);
        filter.connect(burst);
        burst.connect(masterGain);
        setTimeout(() => { try { filter.disconnect(burst); } catch (e) {} }, 3000);
        scheduleThunder();
      }, delay);
    };
    scheduleThunder();

    return {
      gainNode, stopFn: () => {
        stopped = true;
        source.stop();
      }
    };
  }

  private buildFire(ctx: AudioContext, masterGain: GainNode, volume: number): ActiveSound {
    const gainNode = ctx.createGain();
    gainNode.gain.value = volume * 0.5;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 0.8;
    const source = this.startNoiseSource(ctx, this.createWhiteNoiseBuffer(ctx));
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);

    // LFO for crackling
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 4 + Math.random() * 4;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.15;
    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);
    lfo.start();

    return { gainNode, stopFn: () => { source.stop(); lfo.stop(); } };
  }

  private buildWind(ctx: AudioContext, masterGain: GainNode, volume: number): ActiveSound {
    const gainNode = ctx.createGain();
    gainNode.gain.value = volume * 0.5;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    const source = this.startNoiseSource(ctx, this.createWhiteNoiseBuffer(ctx));
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);

    // LFO for wind gusts
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.3;
    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);
    lfo.start();

    return { gainNode, stopFn: () => { source.stop(); lfo.stop(); } };
  }

  private buildBirds(ctx: AudioContext, masterGain: GainNode, volume: number): ActiveSound {
    const gainNode = ctx.createGain();
    gainNode.gain.value = volume * 0.3;
    gainNode.connect(masterGain);

    const oscillators: OscillatorNode[] = [];
    let stopped = false;

    const chirp = () => {
      if (stopped) return;
      const freq = 2000 + Math.random() * 3000;
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      oscGain.gain.value = 0;
      oscGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
      oscGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      osc.connect(oscGain);
      oscGain.connect(gainNode);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
      oscillators.push(osc);
      const next = 200 + Math.random() * 1500;
      setTimeout(chirp, next);
    };
    chirp();

    return {
      gainNode, stopFn: () => {
        stopped = true;
        oscillators.forEach(o => { try { o.stop(); } catch (e) {} });
      }
    };
  }

  private buildOcean(ctx: AudioContext, masterGain: GainNode, volume: number): ActiveSound {
    const gainNode = ctx.createGain();
    gainNode.gain.value = volume * 0.6;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 0.6;
    const source = this.startNoiseSource(ctx, this.createWhiteNoiseBuffer(ctx));
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);

    // Wave LFO
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.4;
    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);
    lfo.start();

    return { gainNode, stopFn: () => { source.stop(); lfo.stop(); } };
  }

  private buildForest(ctx: AudioContext, masterGain: GainNode, volume: number): ActiveSound {
    const gainNode = ctx.createGain();
    gainNode.gain.value = volume * 0.45;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.4;
    const source = this.startNoiseSource(ctx, this.createWhiteNoiseBuffer(ctx));
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.2;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.2;
    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);
    lfo.start();

    return { gainNode, stopFn: () => { source.stop(); lfo.stop(); } };
  }

  private buildCoffee(ctx: AudioContext, masterGain: GainNode, volume: number): ActiveSound {
    const gainNode = ctx.createGain();
    gainNode.gain.value = volume * 0.4;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.3;
    const source = this.startNoiseSource(ctx, this.createBrownNoiseBuffer(ctx));
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);
    return { gainNode, stopFn: () => source.stop() };
  }

  private buildWhiteNoise(ctx: AudioContext, masterGain: GainNode, volume: number): ActiveSound {
    const gainNode = ctx.createGain();
    gainNode.gain.value = volume * 0.4;
    const source = this.startNoiseSource(ctx, this.createWhiteNoiseBuffer(ctx));
    source.connect(gainNode);
    gainNode.connect(masterGain);
    return { gainNode, stopFn: () => source.stop() };
  }

  private buildBrownNoise(ctx: AudioContext, masterGain: GainNode, volume: number): ActiveSound {
    const gainNode = ctx.createGain();
    gainNode.gain.value = volume * 0.5;
    const source = this.startNoiseSource(ctx, this.createBrownNoiseBuffer(ctx));
    source.connect(gainNode);
    gainNode.connect(masterGain);
    return { gainNode, stopFn: () => source.stop() };
  }

  private buildPiano(ctx: AudioContext, masterGain: GainNode, volume: number): ActiveSound {
    const gainNode = ctx.createGain();
    gainNode.gain.value = volume * 0.25;
    gainNode.connect(masterGain);

    const notes = [261.63, 329.63, 392.0, 523.25, 659.25]; // C4 E4 G4 C5 E5
    let stopped = false;
    let noteIndex = 0;

    const playNote = () => {
      if (stopped) return;
      const freq = notes[noteIndex % notes.length];
      noteIndex++;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const env = ctx.createGain();
      env.gain.value = 0;
      env.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
      osc.connect(env);
      env.connect(gainNode);
      osc.start();
      osc.stop(ctx.currentTime + 2.6);
      const next = 2000 + Math.random() * 3000;
      setTimeout(playNote, next);
    };
    playNote();

    return {
      gainNode, stopFn: () => {
        stopped = true;
      }
    };
  }

  private buildCity(ctx: AudioContext, masterGain: GainNode, volume: number): ActiveSound {
    const gainNode = ctx.createGain();
    gainNode.gain.value = volume * 0.35;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 250;
    const source = this.startNoiseSource(ctx, this.createBrownNoiseBuffer(ctx));
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);
    return { gainNode, stopFn: () => source.stop() };
  }

  start(soundId: string, volume: number = 0.5): void {
    if (this.activeSounds.has(soundId)) return;
    const ctx = this.getCtx();
    const masterGain = this.masterGain!;
    let sound: ActiveSound;

    switch (soundId) {
      case 'rain': sound = this.buildRain(ctx, masterGain, volume); break;
      case 'thunder': sound = this.buildThunder(ctx, masterGain, volume); break;
      case 'fire': sound = this.buildFire(ctx, masterGain, volume); break;
      case 'wind': sound = this.buildWind(ctx, masterGain, volume); break;
      case 'birds': sound = this.buildBirds(ctx, masterGain, volume); break;
      case 'ocean': sound = this.buildOcean(ctx, masterGain, volume); break;
      case 'forest': sound = this.buildForest(ctx, masterGain, volume); break;
      case 'coffee': sound = this.buildCoffee(ctx, masterGain, volume); break;
      case 'white': sound = this.buildWhiteNoise(ctx, masterGain, volume); break;
      case 'brown': sound = this.buildBrownNoise(ctx, masterGain, volume); break;
      case 'piano': sound = this.buildPiano(ctx, masterGain, volume); break;
      case 'city': sound = this.buildCity(ctx, masterGain, volume); break;
      default: return;
    }
    this.activeSounds.set(soundId, sound);
  }

  stop(soundId: string): void {
    const sound = this.activeSounds.get(soundId);
    if (!sound) return;
    try { sound.stopFn(); } catch (e) {}
    this.activeSounds.delete(soundId);
  }

  setVolume(soundId: string, volume: number): void {
    const sound = this.activeSounds.get(soundId);
    if (!sound || !this.ctx) return;
    sound.gainNode.gain.linearRampToValueAtTime(
      volume * 0.7,
      this.ctx.currentTime + 0.05
    );
  }

  setMasterVolume(volume: number): void {
    this._masterVolume = volume;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.05);
    }
  }

  isPlaying(soundId: string): boolean {
    return this.activeSounds.has(soundId);
  }

  stopAll(): void {
    this.activeSounds.forEach((_, id) => this.stop(id));
  }
}

// Singleton
let engine: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!engine) engine = new AudioEngine();
  return engine;
}
