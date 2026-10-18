'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { SOUNDS, getSoundById } from '../../lib/sounds';
import { savePreset, addHistoryEntry } from '../../lib/storage';
import type { Preset } from '../../lib/types';
import { getAudioEngine } from '../../lib/audio-engine';
import type { MixEntry } from '../../lib/types';

// House default: soft spring used for entrance + interaction feedback.
const spring = { type: 'spring', bounce: 0.3, duration: 0.6 } as const;

export default function Mixer() {
  const [active, setActive] = useState<Record<string, number>>({});
  const [master, setMaster] = useState(0.8);
  const [saveName, setSaveName] = useState('');
  const [showSave, setShowSave] = useState(false);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [sleepFadeMin, setSleepFadeMin] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  // Wire master volume to audio engine
  useEffect(() => {
    const engine = getAudioEngine();
    engine.setMasterVolume(master);
  }, [master]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const engine = getAudioEngine();
      engine.stopAll();
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const engine = getAudioEngine();
    setActive(prev => {
      const next = { ...prev };
      if (next[id] !== undefined) {
        delete next[id];
        engine.stop(id);
      } else {
        next[id] = 0.6;
        engine.start(id, 0.6);
      }
      // Session starts when the first sound goes live; checked against the
      // post-toggle snapshot so the very first toggle counts.
      if (Object.keys(next).length > 0) {
        setSessionStart(current => current ?? Date.now());
      }
      return next;
    });
  }, []);

  const setVolume = useCallback((id: string, vol: number) => {
    const engine = getAudioEngine();
    engine.setVolume(id, vol);
    setActive(prev => ({ ...prev, [id]: vol }));
  }, []);

  const handleSave = () => {
    if (!saveName.trim()) return;
    const mix: MixEntry[] = Object.entries(active).map(([soundId, volume]) => ({ soundId, volume }));
    const preset: Preset = {
      id: `preset-${Date.now()}`,
      name: saveName,
      description: 'Custom preset',
      mix,
      tags: ['custom'],
      createdAt: Date.now(),
      isCommunity: false,
      author: 'you',
      playCount: 0,
    };
    savePreset(preset);
    setShowSave(false);
    setSaveName('');
  };

  // Log session to history when all sounds stop
  const activeSounds = Object.keys(active);

  const endSession = useCallback(() => {
    if (sessionStart && activeSounds.length > 0) {
      const mix: MixEntry[] = Object.entries(active).map(([soundId, volume]) => ({ soundId, volume }));
      addHistoryEntry({
        id: `h-${Date.now()}`,
        presetName: 'Custom Mix',
        mix,
        duration: Math.round((Date.now() - sessionStart) / 1000),
        startedAt: sessionStart,
        endedAt: Date.now(),
      });
    }
    setActive({});
    setSessionStart(null);
  }, [active, sessionStart, activeSounds.length]);

  const stopAll = () => {
    getAudioEngine().stopAll();
    endSession();
  };

  const startSleepFade = useCallback((minutes: number) => {
    getAudioEngine().stopAllWithFade(minutes * 60);
    setSleepFadeMin(minutes);
  }, []);

  const cancelSleepFade = useCallback(() => {
    const engine = getAudioEngine();
    // Ramp every still-active sound back up to its slider volume.
    for (const [id, volume] of Object.entries(active)) engine.setVolume(id, volume);
    setSleepFadeMin(null);
  }, [active]);

  // Mirror the engine's fade in the UI: when the fade window ends, log the
  // session and clear the mix. Cancelling clears this timer via cleanup.
  useEffect(() => {
    if (sleepFadeMin === null) return;
    const t = setTimeout(() => {
      endSession();
      setSleepFadeMin(null);
    }, sleepFadeMin * 60 * 1000);
    return () => clearTimeout(t);
  }, [sleepFadeMin, endSession]);

  return (
    <div style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 16px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Link href="/" style={{ fontSize: 14, color: 'var(--ios-blue)', marginBottom: 8, display: 'inline-block' }}>Back</Link>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>Mixer</h1>
            <p style={{ fontSize: 15, color: 'var(--ios-label3)' }}>{activeSounds.length} sounds active</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {activeSounds.length > 0 && (
              <button onClick={stopAll} style={{
                padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: 'var(--ios-red)', color: '#fff',
              }}>Stop All</button>
            )}
            <button onClick={() => setShowSave(true)} disabled={activeSounds.length === 0} style={{
              padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: activeSounds.length ? 'var(--ios-blue)' : 'var(--ios-sep)', color: activeSounds.length ? '#fff' : 'var(--ios-label3)',
            }}>Save Mix</button>
          </div>
        </div>

        {showSave && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ padding: 16, borderRadius: 14, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)', marginBottom: 20, display: 'flex', gap: 8 }}
          >
            <input type="text" value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Preset name..." onKeyDown={e => { if (e.key === 'Enter') handleSave(); }} style={{
              flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--ios-sep)', fontSize: 14, background: 'var(--ios-bg)', color: 'var(--ios-label)',
              }} autoFocus aria-label="Preset name" />
            <button onClick={handleSave} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', background: 'var(--ios-green)', color: '#fff' }}>Save</button>
          </motion.div>
        )}

        {/* Master volume — settings surface, fade-only entrance so the range
            input's geometry is never animated. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ padding: 16, borderRadius: 14, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)', marginBottom: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)' }}>Master Volume</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ios-blue)' }}>{Math.round(master * 100)}%</span>
          </div>
          <input type="range" min={0} max={1} step={0.01} value={master} onChange={e => setMaster(+e.target.value)} style={{ width: '100%' }} aria-label="Master volume" />
        </motion.div>

        {/* Sleep fade — spring entrance; while a fade is pending a soft blue
            glow gently pulses (opacity mirror loop, skipped for
            prefers-reduced-motion) so the pending state feels alive. */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          style={{ position: 'relative', padding: 16, borderRadius: 14, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)', marginBottom: 20 }}
        >
          {sleepFadeMin !== null && !reduceMotion && (
            <motion.div
              aria-hidden
              style={{
                position: 'absolute', inset: -1, borderRadius: 14, pointerEvents: 'none',
                boxShadow: '0 0 22px rgba(10,132,255,0.55)',
              }}
              animate={{ opacity: [0.2, 0.65] }}
              transition={{ duration: 2.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            />
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)' }}>Sleep Fade</span>
            {sleepFadeMin !== null && (
              <motion.button whileTap={{ scale: 0.92 }} onClick={cancelSleepFade} style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: '1px solid var(--ios-sep)', background: 'var(--ios-bg)', color: 'var(--ios-label)',
              }}>Cancel</motion.button>
            )}
          </div>
          {sleepFadeMin !== null ? (
            <p role="status" style={{ fontSize: 13, color: 'var(--ios-blue)' }}>
              Current mix fades to silence over {sleepFadeMin} min.
            </p>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[5, 15, 30, 60].map(min => (
                <motion.button
                  key={min}
                  whileTap={activeSounds.length ? { scale: 0.92 } : undefined}
                  disabled={activeSounds.length === 0}
                  onClick={() => startSleepFade(min)}
                  aria-label={`Fade all sounds out over ${min} minutes`}
                  style={{
                    padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    cursor: activeSounds.length ? 'pointer' : 'default',
                    border: '1px solid var(--ios-sep)', background: 'var(--ios-bg)',
                    color: activeSounds.length ? 'var(--ios-blue)' : 'var(--ios-label3)',
                  }}
                >{min} min</motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Sound grid — spring entrance stagger on mount, hover lift,
            press feedback on the play toggle (cards toggle sounds). */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {SOUNDS.map((sound, index) => {
            const isActive = active[sound.id] !== undefined;
            const volume = active[sound.id] ?? 0;
            return (
              <motion.div
                key={sound.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: index * 0.045 }}
                whileHover={{ y: -4, transition: { type: 'spring', bounce: 0.4, duration: 0.35 } }}
                style={{
                  padding: 20, borderRadius: 16, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)',
                  border: isActive ? '2px solid var(--ios-blue)' : '2px solid transparent',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: isActive ? `linear-gradient(135deg, ${sound.gradientFrom}, ${sound.gradientTo})` : 'var(--ios-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                    boxShadow: isActive ? `0 4px 12px ${sound.gradientFrom}40` : 'none',
                    transition: 'all 0.2s',
                  }}>
                    {sound.emoji}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => toggle(sound.id)}
                    aria-label={isActive ? `Stop ${sound.name}` : `Play ${sound.name}`}
                    style={{
                      width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: isActive ? 'var(--ios-blue)' : 'var(--ios-bg)', color: isActive ? '#fff' : 'var(--ios-label3)',
                      fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >{isActive ? '⏸' : '▶'}</motion.button>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)', marginBottom: 8 }}>{sound.name}</div>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--ios-label3)' }}>Volume</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ios-blue)' }}>{Math.round(volume * 100)}%</span>
                    </div>
                    <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(sound.id, +e.target.value)} style={{ width: '100%' }} aria-label={`${sound.name} volume`} />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
