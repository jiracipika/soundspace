'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPresets } from '../../lib/storage';
import { COMMUNITY_PRESETS } from '../../lib/mock-data';
import { getSoundById } from '../../lib/sounds';

export default function Presets() {
  const [saved, setSaved] = useState<any[]>([]);
  const [tab, setTab] = useState<'community' | 'saved'>('community');

  useEffect(() => { setSaved(getPresets()); }, []);

  const presets = tab === 'community' ? COMMUNITY_PRESETS : saved;

  return (
    <div style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 16px 40px' }}>
        <Link href="/" style={{ fontSize: 14, color: 'var(--ios-blue)', marginBottom: 8, display: 'inline-block' }}>Back</Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>Presets</h1>
        <p style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 24 }}>{presets.length} presets</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['community', 'saved'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: tab === t ? 'var(--ios-blue)' : 'var(--ios-bg2)', color: tab === t ? '#fff' : 'var(--ios-label2)',
            }}>{t === 'community' ? 'Community' : 'My Presets'}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {presets.map(p => (
            <Link key={p.id} href={`/presets/${p.id}`} style={{ padding: 20, borderRadius: 16, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)', display: 'block' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {p.mix.slice(0, 5).map((m: any, i: number) => {
                  const sound = getSoundById(m.soundId);
                  return sound ? (
                    <div key={i} style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `linear-gradient(135deg, ${sound.gradientFrom}, ${sound.gradientTo})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>{sound.emoji}</div>
                  ) : null;
                })}
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginBottom: 8, lineHeight: 1.3 }}>{p.description}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ios-label3)' }}>
                <span>{p.mix.length} sounds</span>
                <span>{p.isCommunity ? `by ${p.author}` : 'Custom'}</span>
                {p.isCommunity && <span>{p.playCount.toLocaleString()} plays</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
