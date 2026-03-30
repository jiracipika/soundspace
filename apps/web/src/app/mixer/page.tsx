'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { SOUNDS, getSoundById } from '../../lib/sounds';
import { saveMix, type Preset, type MixEntry } from '../../lib/storage';

export default function Mixer() {
  const [active, setActive] = useState<Record<string, number>>({});
  const [master, setMaster] = useState(0.8);
  const [saveName, setSaveName] = useState('');
  const [showSave, setShowSave] = useState(false);

  const toggle = (id: string) => {
    setActive(prev => {
      const next = { ...prev };
      if (next[id] !== undefined) { delete next[id]; } else { next[id] = 0.6; }
      return next;
    });
  };

  const setVolume = (id: string, vol: number) => {
    setActive(prev => ({ ...prev, [id]: vol }));
  };

  const handleSave = () => {
    if (!saveName.trim()) return;
    const mix: MixEntry[] = Object.entries(active).map(([soundId, volume]) => ({ soundId, volume }));
    saveMix({ id: `preset-${Date.now()}`, name: saveName, description: 'Custom preset', mix, tags: ['custom'], createdAt: Date.now(), isCommunity: false, author: 'you', playCount: 0 });
    setShowSave(false);
    setSaveName('');
  };

  const activeSounds = Object.keys(active);

  return (
    <div style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 16px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Link href="/" style={{ fontSize: 14, color: 'var(--ios-blue)', marginBottom: 8, display: 'inline-block' }}>Back</Link>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>Mixer</h1>
            <p style={{ fontSize: 15, color: 'var(--ios-label3)' }}>{activeSounds.length} sounds active</p>
          </div>
          <button onClick={() => setShowSave(true)} disabled={activeSounds.length === 0} style={{
            padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: activeSounds.length ? 'var(--ios-blue)' : 'var(--ios-separator)', color: activeSounds.length ? '#fff' : 'var(--ios-label3)',
          }}>Save Mix</button>
        </div>

        {showSave && (
          <div style={{ padding: 16, borderRadius: 14, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)', marginBottom: 20, display: 'flex', gap: 8 }}>
            <input type="text" value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Preset name..." style={{
              flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--ios-separator)', fontSize: 14, background: 'var(--ios-bg)', color: 'var(--ios-label)',
            }} />
            <button onClick={handleSave} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', background: 'var(--ios-green)', color: '#fff' }}>Save</button>
          </div>
        )}

        {/* Master volume */}
        <div style={{ padding: 16, borderRadius: 14, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)' }}>Master Volume</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ios-blue)' }}>{Math.round(master * 100)}%</span>
          </div>
          <input type="range" min={0} max={1} step={0.01} value={master} onChange={e => setMaster(+e.target.value)} style={{ width: '100%' }} />
        </div>

        {/* Sound grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {SOUNDS.map(sound => {
            const isActive = active[sound.id] !== undefined;
            const volume = active[sound.id] ?? 0;
            return (
              <div key={sound.id} style={{
                padding: 20, borderRadius: 16, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)',
                border: isActive ? '2px solid var(--ios-blue)' : '2px solid transparent',
                transition: 'border-color 0.2s',
              }}>
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
                  <button onClick={() => toggle(sound.id)} style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: isActive ? 'var(--ios-blue)' : 'var(--ios-bg)', color: isActive ? '#fff' : 'var(--ios-label3)',
                    fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{isActive ? '⏸' : '▶'}</button>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)', marginBottom: 8 }}>{sound.name}</div>
                {isActive && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--ios-label3)' }}>Volume</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ios-blue)' }}>{Math.round(volume * 100)}%</span>
                    </div>
                    <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(sound.id, +e.target.value)} style={{ width: '100%' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
