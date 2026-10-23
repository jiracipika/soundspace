import type { Preset, HistoryEntry, MixerState, MixEntry } from './types';

const KEYS = {
  PRESETS: 'soundspace_presets',
  HISTORY: 'soundspace_history',
  MIXER: 'soundspace_mixer',
};

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// Presets
export function getPresets(): Preset[] {
  return safeGet<Preset[]>(KEYS.PRESETS, []);
}

export function savePreset(preset: Preset): void {
  const presets = getPresets();
  const idx = presets.findIndex((p) => p.id === preset.id);
  if (idx >= 0) {
    presets[idx] = preset;
  } else {
    presets.unshift(preset);
  }
  safeSet(KEYS.PRESETS, presets);
}

export function deletePreset(id: string): void {
  const presets = getPresets().filter((p) => p.id !== id);
  safeSet(KEYS.PRESETS, presets);
}

export function getPresetById(id: string): Preset | undefined {
  return getPresets().find((p) => p.id === id);
}

// History
export function getHistory(): HistoryEntry[] {
  return safeGet<HistoryEntry[]>(KEYS.HISTORY, []);
}

export function addHistoryEntry(entry: HistoryEntry): void {
  const history = getHistory();
  history.unshift(entry);
  // Keep last 200 entries
  safeSet(KEYS.HISTORY, history.slice(0, 200));
}

// Mixer state
export function getMixerState(): MixerState | null {
  return safeGet<MixerState | null>(KEYS.MIXER, null);
}

export function saveMixerState(state: MixerState): void {
  safeSet(KEYS.MIXER, state);
}

// Preset export / import

export interface ImportResult {
  imported: number;
  skipped: number;
}

function isValidPreset(value: unknown): value is Preset {
  if (!value || typeof value !== 'object') return false;
  const p = value as Preset;
  return (
    typeof p.id === 'string' &&
    p.id.length > 0 &&
    typeof p.name === 'string' &&
    Array.isArray(p.mix) &&
    p.mix.every(
      (m) =>
        !!m &&
        typeof m === 'object' &&
        typeof (m as MixEntry).soundId === 'string' &&
        typeof (m as MixEntry).volume === 'number',
    )
  );
}

/** Serialize all saved presets to pretty-printed JSON for backup/sharing. */
export function exportPresets(): string {
  return JSON.stringify(getPresets(), null, 2);
}

/**
 * Merge presets from exported JSON (accepts a bare array or a single
 * preset object). Valid presets whose id is not already stored are added
 * newest-first; everything else counts as skipped. Never overwrites and
 * never throws — a bad payload simply imports nothing.
 */
export function importPresets(raw: string): ImportResult {
  if (typeof window === 'undefined') return { imported: 0, skipped: 0 };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { imported: 0, skipped: 0 };
  }
  const incoming = Array.isArray(parsed) ? parsed : [parsed];
  const existing = getPresets();
  const knownIds = new Set(existing.map((p) => p.id));
  const toAdd: Preset[] = [];
  let skipped = 0;
  for (const item of incoming) {
    if (!isValidPreset(item) || knownIds.has(item.id)) {
      skipped++;
      continue;
    }
    knownIds.add(item.id);
    toAdd.push({
      ...item,
      tags: Array.isArray(item.tags) ? item.tags : [],
      createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
    });
  }
  if (toAdd.length > 0) {
    safeSet(KEYS.PRESETS, [...toAdd, ...existing]);
  }
  return { imported: toAdd.length, skipped };
}
