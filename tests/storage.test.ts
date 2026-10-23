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

import { getPresets, savePreset, exportPresets, importPresets } from '../src/lib/storage';
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

describe('preset export/import', () => {
  const fullPreset = (id: string): Preset => ({
    id,
    name: `Preset ${id}`,
    description: 'desc',
    mix: [{ soundId: 'rain', volume: 0.5 }],
    tags: ['chill'],
    createdAt: 1700000000000,
  });

  it('exports saved presets as JSON and re-imports them into an empty store', () => {
    savePreset(fullPreset('a'));
    savePreset(fullPreset('b'));
    const json = exportPresets();
    expect(JSON.parse(json)).toHaveLength(2);

    store.clear();
    const result = importPresets(json);
    expect(result).toEqual({ imported: 2, skipped: 0 });
    expect(getPresets().map((p) => p.id)).toEqual(['b', 'a']); // newest-first
  });

  it('never overwrites: duplicate ids count as skipped', () => {
    savePreset(fullPreset('a'));
    const payload = JSON.stringify([fullPreset('a'), fullPreset('c')]);
    const result = importPresets(payload);
    expect(result).toEqual({ imported: 1, skipped: 1 });
    const stored = getPresets().find((p) => p.id === 'a')!;
    expect(stored.createdAt).toBe(1700000000000); // original untouched
  });

  it('corrupt JSON and malformed entries import nothing', () => {
    expect(importPresets('{not json')).toEqual({ imported: 0, skipped: 0 });
    const bad = JSON.stringify([
      { id: 'x' },                                  // missing name/mix
      { id: 'y', name: 'Y', mix: 'not-an-array' },  // invalid mix
      { id: 'z', name: 'Z', mix: [{ soundId: 42, volume: 'loud' }] }, // bad entry shape
      'garbage',
    ]);
    expect(importPresets(bad)).toEqual({ imported: 0, skipped: 4 });
    expect(getPresets()).toHaveLength(0);
  });

  it('accepts a single preset object (not wrapped in an array)', () => {
    const result = importPresets(JSON.stringify(fullPreset('solo')));
    expect(result).toEqual({ imported: 1, skipped: 0 });
    expect(getPresets()[0].id).toBe('solo');
  });

  it('fills in missing tags and createdAt on import instead of storing junk', () => {
    const partial = { id: 'p', name: 'Partial', mix: [{ soundId: 'wind', volume: 0.4 }] };
    const before = Date.now();
    expect(importPresets(JSON.stringify(partial))).toEqual({ imported: 1, skipped: 0 });
    const stored = getPresets()[0];
    expect(stored.tags).toEqual([]);
    expect(stored.createdAt).toBeGreaterThanOrEqual(before);
  });
});
