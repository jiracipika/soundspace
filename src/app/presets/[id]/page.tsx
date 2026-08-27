'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPresetById } from '../../../lib/storage';
import { COMMUNITY_PRESETS } from '../../../lib/mock-data';
import { getSoundById } from '../../../lib/sounds';
import type { Preset } from '../../../lib/types';

export default function PresetDetail() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [preset, setPreset] = useState<Preset | null | undefined>(undefined);
  const [playing, setPlaying] = useState(false);

  // Look in saved presets first, then community. The previous version only
  // searched COMMUNITY_PRESETS, so saved mixes 404'd on their detail page.
  useEffect(() => {
    if (!id) {
      setPreset(null);
      return;
    }
    const fromStorage = getPresetById(id);
    const fromCommunity = COMMUNITY_PRESETS.find((p) => p.id === id);
    setPreset(fromStorage ?? fromCommunity ?? null);
  }, [id]);

  if (preset === undefined) {
    return <div style={{ padding: 60, textAlign: 'center', color: 'var(--ios-label3)' }}>Loading…</div>;
  }

  if (!preset) {
    return (
      <div style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 16px 40px' }}>
          <Link href="/presets" style={{ fontSize: 14, color: 'var(--ios-blue)', display: 'inline-block', marginBottom: 24 }}>← Presets</Link>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ios-label)' }}>Preset not found</h1>
          <p style={{ fontSize: 14, color: 'var(--ios-label3)', marginTop: 8 }}>
            This preset may have been deleted on this device.
          </p>
        </div>
      </div>
    );
  }

  const togglePlay = () => {
    if (playing) {
      import('../../../lib/audio-engine').then(({ getAudioEngine }) => {
        getAudioEngine().stopAll();
        setPlaying(false);
      });
    } else {
      import('../../../lib/audio-engine').then(({ getAudioEngine }) => {
        const engine = getAudioEngine();
        for (const entry of preset.mix) {
          engine.start(entry.soundId, entry.volume);
        }
        setPlaying(true);
      });
    }
  };

  const removeIfCustom = () => {
    if (preset.isCommunity) return;
    try {
      const raw = localStorage.getItem('soundspace_presets');
      const all: Preset[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem('soundspace_presets', JSON.stringify(all.filter((p) => p.id !== preset.id)));
      router.push('/presets');
    } catch {
      // Ignore storage failures.
    }
  };

  return (
    <div style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '60px 16px 40px' }}>
        <Link href="/presets" style={{ fontSize: 14, color: 'var(--ios-blue)', marginBottom: 8, display: 'inline-block' }}>← Presets</Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>{preset.name}</h1>
        <p style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 24 }}>{preset.description}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {preset.mix.map((entry) => {
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
          <button
            onClick={togglePlay}
            style={{
              flex: 1, padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: playing ? 'var(--ios-red)' : 'var(--ios-blue)',
              color: '#fff',
            }}
          >
            {playing ? '■ Stop Mix' : '▶ Play Mix'}
          </button>
          {!preset.isCommunity && (
            <button
              onClick={removeIfCustom}
              style={{
                padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 600,
                border: '1px solid var(--ios-sep)', cursor: 'pointer',
                background: 'var(--ios-bg2)', color: 'var(--ios-red)',
              }}
              aria-label={`Delete ${preset.name}`}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
