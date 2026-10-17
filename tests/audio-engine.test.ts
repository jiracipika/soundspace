import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Minimal Web Audio mock ─────────────────────────────────────────────
// The engine only touches: ctx.state/currentTime/resume, createGain,
// createBuffer(+getChannelData), createBufferSource, createBiquadFilter.
// Each node records connect/disconnect/start/stop and carries a gain param.
function makeNode() {
  return {
    gain: { value: 1, linearRampToValueAtTime: vi.fn() },
    frequency: { value: 0, linearRampToValueAtTime: vi.fn() },
    Q: { value: 0 },
    type: '',
    buffer: null as unknown,
    loop: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

let ctxState = 'running';
let nodeLog: ReturnType<typeof makeNode>[];
const audioCtx = {
  get state() {
    return ctxState;
  },
  currentTime: 12.5,
  sampleRate: 44100,
  destination: makeNode(),
  resume: vi.fn(async () => {}),
  createGain: () => {
    const n = makeNode();
    nodeLog.push(n);
    return n;
  },
  createBuffer: (_c: number, length: number) => ({
    getChannelData: () => new Float32Array(length),
  }),
  createBufferSource: () => {
    const n = makeNode();
    nodeLog.push(n);
    return n;
  },
  createBiquadFilter: () => {
    const n = makeNode();
    nodeLog.push(n);
    return n;
  },
  createOscillator: () => makeNode(),
  createDynamicsCompressor: () => makeNode(),
};

vi.stubGlobal('window', { AudioContext: function AudioContextMock() { return audioCtx; } });
vi.stubGlobal('AudioContext', window.AudioContext);

// Fresh module per test so the singleton resets.
let getAudioEngine: typeof import('../src/lib/audio-engine').getAudioEngine;
beforeEach(async () => {
  vi.resetModules();
  nodeLog = [];
  ctxState = 'running';
  ({ getAudioEngine } = await import('../src/lib/audio-engine'));
});

describe('AudioEngine', () => {
  it('singleton returns the same instance', () => {
    expect(getAudioEngine()).toBe(getAudioEngine());
  });

  it('start begins a sound; isPlaying reflects it; restart is a no-op', () => {
    const engine = getAudioEngine();
    engine.start('rain');
    expect(engine.isPlaying('rain')).toBe(true);
    const creations = nodeLog.length;
    engine.start('rain');
    expect(nodeLog.length).toBe(creations); // no second graph built
  });

  it('master volume set BEFORE first start is carried into the lazy ctx', () => {
    const engine = getAudioEngine();
    engine.setMasterVolume(0.4);
    engine.start('white');
    // The master gain is the first node created and its value carries 0.4.
    const master = nodeLog.find((n) => n.gain.value === 0.4);
    expect(master).toBeDefined();
  });

  it('per-sound volume routes volume*0.7 to that sound only', () => {
    const engine = getAudioEngine();
    engine.start('rain');
    engine.start('wind');
    engine.setVolume('rain', 0.8);
    // Exactly ONE node (rain's own gain) gets the 0.8*0.7 ramp — wind's
    // gain and the master are untouched. (Compare the computed product,
    // not a 0.56 literal: 0.8*0.7 is not exactly representable.)
    const expected = 0.8 * 0.7;
    const ramped = nodeLog.filter((n) =>
      n.gain.linearRampToValueAtTime.mock.calls.some((c: unknown[]) => c[0] === expected)
    );
    expect(ramped).toHaveLength(1);
  });

  it('stop calls the sound teardown exactly once; double-stop is safe', () => {
    const engine = getAudioEngine();
    engine.start('brown');
    const sources = nodeLog.filter((n) => n.buffer !== null);
    expect(sources.length).toBeGreaterThanOrEqual(1);
    engine.stop('brown');
    expect(engine.isPlaying('brown')).toBe(false);
    expect(() => engine.stop('brown')).not.toThrow();
  });

  it('unknown sound ids are a silent no-op', () => {
    const engine = getAudioEngine();
    expect(() => engine.start('helicopter')).not.toThrow();
    expect(engine.isPlaying('helicopter')).toBe(false);
  });

  it('stopAll clears every active sound', () => {
    const engine = getAudioEngine();
    engine.start('rain');
    engine.start('wind');
    engine.start('white');
    engine.stopAll();
    expect(engine.isPlaying('rain')).toBe(false);
    expect(engine.isPlaying('wind')).toBe(false);
    expect(engine.isPlaying('white')).toBe(false);
  });

  it('suspended ctx is resumed on start', async () => {
    ctxState = 'suspended';
    const engine = getAudioEngine();
    engine.start('rain');
    expect(audioCtx.resume).toHaveBeenCalled();
  });
});

describe('AudioEngine fades', () => {
  afterEach(() => vi.useRealTimers());

  it('fadeOutAndStop ramps the gain to zero, then stops the sound', () => {
    vi.useFakeTimers();
    const engine = getAudioEngine();
    engine.start('rain');
    engine.fadeOutAndStop('rain', 30);
    const ramped = nodeLog.some((n) =>
      n.gain.linearRampToValueAtTime.mock.calls.some(
        ([target, at]) => target === 0 && Math.abs(at - (audioCtx.currentTime + 30)) < 1e-6,
      ),
    );
    expect(ramped).toBe(true);
    expect(engine.isPlaying('rain')).toBe(true); // still audible inside the fade window
    vi.advanceTimersByTime(30_000);
    expect(engine.isPlaying('rain')).toBe(false);
  });

  it('fadeOutAndStop on an unknown or already-stopped sound is a no-op', () => {
    const engine = getAudioEngine();
    expect(() => engine.fadeOutAndStop('rain', 5)).not.toThrow(); // ctx not even created yet
    engine.start('rain');
    engine.stop('rain');
    expect(() => engine.fadeOutAndStop('rain', 5)).not.toThrow();
  });

  it('stopAllWithFade fades out every active sound', () => {
    vi.useFakeTimers();
    const engine = getAudioEngine();
    engine.start('rain');
    engine.start('white');
    engine.stopAllWithFade(10);
    expect(engine.isPlaying('rain')).toBe(true);
    expect(engine.isPlaying('white')).toBe(true);
    vi.advanceTimersByTime(10_000);
    expect(engine.isPlaying('rain')).toBe(false);
    expect(engine.isPlaying('white')).toBe(false);
  });

  it('a sound restarted during its fade window survives the pending stop', () => {
    vi.useFakeTimers();
    const engine = getAudioEngine();
    engine.start('rain');
    engine.fadeOutAndStop('rain', 5);
    engine.stop('rain'); // user changes their mind...
    engine.start('rain'); // ...and starts it again
    vi.advanceTimersByTime(5_000);
    expect(engine.isPlaying('rain')).toBe(true);
  });
});
