'use client';
import Link from 'next/link';
import { MOCK_HISTORY } from '../../lib/mock-data';
import { getSoundById } from '../../lib/sounds';

export default function History() {
  const totalMin = Math.round(MOCK_HISTORY.reduce((s, h) => s + h.duration, 0) / 60);
  const topSoundId = MOCK_HISTORY.flatMap(h => h.mix.map(m => m.soundId))
    .sort((a, b) =>
      MOCK_HISTORY.flatMap(h => h.mix.map(m => m.soundId)).filter(v => v === a).length -
      MOCK_HISTORY.flatMap(h => h.mix.map(m => m.soundId)).filter(v => v === b).length
    ).pop();
  const topSound = topSoundId ? getSoundById(topSoundId) : null;

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return 'Just now';
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 16px 40px' }}>
        <Link href="/" style={{ fontSize: 14, color: 'var(--ios-blue)', marginBottom: 8, display: 'inline-block' }}>Back</Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>History</h1>
        <p style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 24 }}>Listening insights and session stats.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <div style={{ padding: 16, borderRadius: 14, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)' }}>
            <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginBottom: 4 }}>Total Listening</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{Math.round(totalMin / 60)}h {totalMin % 60}m</div>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)' }}>
            <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginBottom: 4 }}>Sessions</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{MOCK_HISTORY.length}</div>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)' }}>
            <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginBottom: 4 }}>Favorite Sound</div>
            <div style={{ fontSize: 24 }}>{topSound ? `${topSound.emoji} ${topSound.name}` : '—'}</div>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)' }}>
            <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginBottom: 4 }}>Streak</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>5 days 🔥</div>
          </div>
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Recent Sessions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MOCK_HISTORY.map(session => {
            const firstSound = session.mix[0] ? getSoundById(session.mix[0].soundId) : null;
            return (
              <div key={session.id} style={{ padding: 14, borderRadius: 14, background: 'var(--ios-bg2)', boxShadow: 'var(--ios-shadow)', display: 'flex', alignItems: 'center', gap: 14 }}>
                {firstSound && (
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${firstSound.gradientFrom}, ${firstSound.gradientTo})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {firstSound.emoji}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)' }}>{session.presetName || 'Custom Mix'}</div>
                  <div style={{ fontSize: 12, color: 'var(--ios-label3)' }}>{session.mix.length} sounds &middot; {Math.round(session.duration / 60)} min &middot; {formatTime(session.startedAt)}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-blue)' }}>{Math.round(session.duration / 60)}m</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
