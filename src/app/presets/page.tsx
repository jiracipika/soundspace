'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { getPresets, exportPresets, importPresets } from '../../lib/storage';
import { COMMUNITY_PRESETS } from '../../lib/mock-data';
import { getSoundById } from '../../lib/sounds';

export default function Presets() {
  const [saved, setSaved] = useState<any[]>([]);
  const [tab, setTab] = useState<'community' | 'saved'>('community');
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { setSaved(getPresets()); }, []);

  const refresh = () => setSaved(getPresets());

  const handleExport = () => {
    const blob = new Blob([exportPresets()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'soundspace-presets.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const result = importPresets(await file.text());
    setImportMessage(
      result.imported === 0 && result.skipped === 0
        ? 'That file did not contain any presets.'
        : `Imported ${result.imported} preset${result.imported === 1 ? '' : 's'}` +
          (result.skipped > 0 ? ` · skipped ${result.skipped} (duplicate or invalid)` : ''),
    );
    refresh();
  };

  const presets = tab === 'community' ? COMMUNITY_PRESETS : saved;

  return (
    <div style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 16px 40px' }}>
        <Link href="/" style={{ fontSize: 14, color: 'var(--ios-blue)', marginBottom: 8, display: 'inline-block' }}>Back</Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>Presets</h1>
        <p style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 24 }}>{presets.length} presets</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {(['community', 'saved'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: tab === t ? 'var(--ios-blue)' : 'var(--ios-bg2)', color: tab === t ? '#fff' : 'var(--ios-label2)',
            }}>{t === 'community' ? 'Community' : 'My Presets'}</button>
          ))}
          {tab === 'saved' && (
            <>
              <div style={{ flex: 1 }} />
              <button onClick={handleExport} disabled={saved.length === 0} style={{
                padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: saved.length ? 'pointer' : 'default',
                border: '1px solid var(--ios-separator)', background: 'var(--ios-bg2)', color: saved.length ? 'var(--ios-blue)' : 'var(--ios-label3)',
              }}>Export</button>
              <button onClick={() => fileInput.current?.click()} style={{
                padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: '1px solid var(--ios-separator)', background: 'var(--ios-bg2)', color: 'var(--ios-blue)',
              }}>Import</button>
              <input ref={fileInput} type="file" accept="application/json,.json" onChange={handleImportFile} style={{ display: 'none' }} aria-label="Import presets from a JSON file" />
            </>
          )}
        </div>
        {tab === 'saved' && importMessage && (
          <p role="status" style={{ fontSize: 13, color: 'var(--ios-label2)', marginBottom: 16 }}>{importMessage}</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {presets.map((p, index) => (
            <motion.div
              key={`${tab}-${p.id}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.6, delay: Math.min(index * 0.05, 0.4) }}
              whileHover={{ y: -4, transition: { type: 'spring', bounce: 0.4, duration: 0.35 } }}
            >
              <Link href={`/presets/${p.id}`} style={{ padding: 20, borderRadius: 16, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)', display: 'block' }}>
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
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
