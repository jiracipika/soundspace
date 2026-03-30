'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSoundById } from '../../../lib/sounds';
import { COMMUNITY_PRESETS } from '../../../lib/mock-data';

export default function PresetDetail({ params }: { params: { id: string } }) {
  const preset = COMMUNITY_PRESETS.find(p => p.id === params.id);
  if (!preset) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--ios-label3)' }}>Preset not found</div>;

  return (
    <div style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '60px 16px 40px' }}>
        <Link href="/presets" style={{ fontSize: 14, color: 'var(--ios-blue)', marginBottom: 8, display: 'inline-block' }}>← Presets</Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>{preset.name}</h1>
        <p style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 24 }}>{preset.description}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {preset.mix.map(entry => {
            const sound = getSoundById(entry.soundId);
            if (!sound) return null;
            return (
              <div key={entry.soundId} style={{ padding: 16, borderRadius: 14, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${sound.gradientFrom}, ${sound.gradientTo})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  {sound.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)', marginBottom: 4 }}>{sound.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--ios-bg)' }}>
                      <div style={{ width: `${entry.volume * 100}%`, height: '100%', borderRadius: 2, background: 'var(--ios-blue)' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-blue)' }}>{Math.round(entry.volume * 100)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ flex: 1, padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', background: 'var(--ios-blue)', color: '#fff' }}>▶ Play Mix</button>
          <button style={{ padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 600, border: '1px solid var(--ios-separator)', cursor: 'pointer', background: 'var(--ios-bg2)', color: 'var(--ios-label)' }}>Edit</button>
        </div>
      </div>
    </div>
  );
}
