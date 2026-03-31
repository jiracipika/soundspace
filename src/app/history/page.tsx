'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getHistory, type HistoryEntry } from '../../lib/storage';
import { getSoundById } from '../../lib/sounds';

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setEntries(getHistory());
  }, []);

  const clearHistory = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('soundspace_history');
      setEntries([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/60 hover:text-white transition-colors">
              ← Back
            </Link>
          </div>
          <h1 className="text-2xl font-bold">🎧 History</h1>
          {entries.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-sm text-red-400/70 hover:text-red-400 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎵</div>
            <p className="text-white/40 text-lg">No sessions yet</p>
            <p className="text-white/30 text-sm mt-2">Your mixing sessions will appear here</p>
            <Link
              href="/mixer"
              className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Start Mixing
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const sounds = entry.mix
                .map((m) => getSoundById(m.soundId))
                .filter(Boolean);
              const isSelected = selected === entry.id;

              return (
                <div
                  key={entry.id}
                  onClick={() => setSelected(isSelected ? null : entry.id)}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{entry.presetName || 'Custom Mix'}</p>
                      <p className="text-sm text-white/40 mt-1">
                        {sounds.map((s) => s!.emoji).join(' ')} · {formatDuration(entry.duration)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white/50">{timeAgo(entry.endedAt)}</p>
                      <div className="flex gap-1 mt-1 justify-end">
                        {entry.mix.slice(0, 5).map((m) => {
                          const sound = getSoundById(m.soundId);
                          return (
                            <div
                              key={m.soundId}
                              className="w-6 h-1.5 rounded-full bg-purple-400/60"
                              style={{ width: `${Math.max(8, m.volume * 24)}px` }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                      {entry.mix.map((m) => {
                        const sound = getSoundById(m.soundId);
                        if (!sound) return null;
                        return (
                          <div key={m.soundId} className="flex items-center gap-3 text-sm">
                            <span>{sound.emoji}</span>
                            <span className="text-white/70">{sound.name}</span>
                            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-400 rounded-full"
                                style={{ width: `${m.volume * 100}%` }}
                              />
                            </div>
                            <span className="text-white/40 w-8 text-right">
                              {Math.round(m.volume * 100)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
