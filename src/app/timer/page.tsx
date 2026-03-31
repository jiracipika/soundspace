'use client';
import { useState } from 'react';
import Link from 'next/link';

const TIMER_PRESETS = [
  { label: 'Pomodoro', minutes: 25, emoji: '🍅' },
  { label: 'Short Break', minutes: 5, emoji: '☕' },
  { label: 'Long Break', minutes: 15, emoji: '🧘' },
  { label: 'Deep Work', minutes: 50, emoji: '🧠' },
  { label: 'Nap', minutes: 20, emoji: '😴' },
];

export default function Timer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);

  const toggle = () => {
    if (!running) { setTotalSeconds(minutes * 60); setSeconds(0); }
    setRunning(!running);
  };

  const reset = () => { setRunning(false); setSeconds(0); setTotalSeconds(minutes * 60); };

  const elapsed = totalSeconds - (running ? seconds : 0);
  const progress = totalSeconds > 0 ? (elapsed / totalSeconds) : 0;
  const displayMin = Math.floor(elapsed / 60);
  const displaySec = elapsed % 60;

  return (
    <div style={{ background: 'var(--ios-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 16px 40px', textAlign: 'center' }}>
        <Link href="/" style={{ fontSize: 14, color: 'var(--ios-blue)', marginBottom: 8, display: 'inline-block' }}>Back</Link>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 24 }}>Focus Timer</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, marginBottom: 32 }}>
          {TIMER_PRESETS.map(p => (
            <button key={p.label} onClick={() => { setMinutes(p.minutes); setSeconds(0); setTotalSeconds(p.minutes * 60); setRunning(false); }} style={{
              padding: 14, borderRadius: 14, fontSize: 13, fontWeight: 600, border: minutes === p.minutes ? '2px solid var(--ios-blue)' : 'none', cursor: 'pointer',
              background: minutes === p.minutes ? 'rgba(0,122,255,0.08)' : 'var(--ios-bg2)', color: minutes === p.minutes ? 'var(--ios-blue)' : 'var(--ios-label2)',
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{p.emoji}</div>
              <div>{p.label}</div>
              <div style={{ fontSize: 11, color: 'var(--ios-label3)' }}>{p.minutes} min</div>
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: 240, height: 240, margin: '0 auto 32px' }}>
          <svg width="240" height="240" viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="108" fill="none" stroke="var(--ios-bg2)" strokeWidth="8" />
            <circle cx="120" cy="120" r="108" fill="none" stroke="var(--ios-blue)" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 108}`} strokeDashoffset={`${2 * Math.PI * 108 * (1 - progress)}`}
              strokeLinecap="round" transform="rotate(-90 120 120)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-2px', color: 'var(--ios-label)' }}>
              {String(displayMin).padStart(2, '0')}:{String(displaySec).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ios-label3)' }}>{minutes} min session</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={toggle} style={{
            padding: '14px 40px', borderRadius: 14, fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: running ? 'var(--ios-red)' : 'var(--ios-green)', color: '#fff',
          }}>{running ? 'Stop' : 'Start'}</button>
          <button onClick={reset} style={{
            padding: '14px 24px', borderRadius: 14, fontSize: 16, fontWeight: 600, border: '1px solid var(--ios-sep)', cursor: 'pointer',
            background: 'var(--ios-bg2)', color: 'var(--ios-label)',
          }}>Reset</button>
        </div>
      </div>
    </div>
  );
}
