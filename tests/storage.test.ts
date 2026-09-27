import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
// storage.ts reads via bare `localStorage` but the browser contract is
// window.localStorage — in node they diverge, so stub BOTH to one store.
const storage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};
vi.stubGlobal('localStorage', storage);
vi.stubGlobal('window', { localStorage: storage });

import { getPresets, savePreset } from '../src/lib/storage';
import type { Preset } from '../src/lib/types';

const preset = (id: string): Preset => ({
  id,
  name: `Preset ${id}`,
  description: '',
  mix: [],
  tags: [],
  createdAt: Date.now(),
});

beforeEach(() => store.clear());

describe('preset storage', () => {
  it('round-trips presets through localStorage', () => {
    savePreset(preset('p1'));
    savePreset(preset('p2'));
    const all = getPresets();
    expect(all.map((p) => p.id)).toEqual(['p2', 'p1']); // newest first
  });

  it('updates in place when the id already exists', () => {
    savePreset(preset('p1'));
    savePreset({ ...preset('p1'), name: 'Renamed' });
    const all = getPresets();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Renamed');
  });
});
