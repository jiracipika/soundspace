import type { Preset, HistoryEntry, MixerState } from './types';

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
