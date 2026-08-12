import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Sound {
  id: string;
  name: string;
  emoji: string;
  gradientFrom: string;
  gradientTo: string;
  category: 'nature' | 'urban' | 'noise' | 'music';
}

export interface MixEntry {
  soundId: string;
  volume: number;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  mix: MixEntry[];
  tags: string[];
  createdAt: number;
  isCommunity?: boolean;
  author?: string;
  playCount?: number;
}

export interface HistoryEntry {
  id: string;
  presetName: string;
  mix: MixEntry[];
  duration: number;
  startedAt: number;
  endedAt: number;
}

export interface TimerSession {
  duration: number;
  type: 'focus' | 'short-break' | 'long-break' | 'custom';
  completedAt: number;
}

// ─── Sounds Catalog ───────────────────────────────────────────────────────────

export const SOUNDS: Sound[] = [
  { id: 'rain', name: 'Rain', emoji: '🌧️', gradientFrom: '#5AC8FA', gradientTo: '#0A84FF', category: 'nature' },
  { id: 'thunder', name: 'Thunder', emoji: '⛈️', gradientFrom: '#8B5CF6', gradientTo: '#3B1F8C', category: 'nature' },
  { id: 'fire', name: 'Fire', emoji: '🔥', gradientFrom: '#FF9500', gradientTo: '#FF2D55', category: 'nature' },
  { id: 'wind', name: 'Wind', emoji: '🌬️', gradientFrom: '#34C759', gradientTo: '#007AFF', category: 'nature' },
  { id: 'birds', name: 'Birds', emoji: '🐦', gradientFrom: '#FFD60A', gradientTo: '#FF9500', category: 'nature' },
  { id: 'ocean', name: 'Ocean', emoji: '🌊', gradientFrom: '#0A84FF', gradientTo: '#00C7BE', category: 'nature' },
  { id: 'forest', name: 'Forest', emoji: '🌲', gradientFrom: '#30D158', gradientTo: '#009F41', category: 'nature' },
  { id: 'cafe', name: 'Café', emoji: '☕', gradientFrom: '#A0826D', gradientTo: '#5D4037', category: 'urban' },
  { id: 'traffic', name: 'Traffic', emoji: '🚗', gradientFrom: '#78909C', gradientTo: '#37474F', category: 'urban' },
  { id: 'whitenoise', name: 'White Noise', emoji: '📺', gradientFrom: '#BDBDBD', gradientTo: '#616161', category: 'noise' },
  { id: 'brownnoise', name: 'Brown Noise', emoji: '🟤', gradientFrom: '#8D6E63', gradientTo: '#3E2723', category: 'noise' },
  { id: 'piano', name: 'Piano', emoji: '🎹', gradientFrom: '#CE93D8', gradientTo: '#7B1FA2', category: 'music' },
];

export function getSoundById(id: string): Sound | undefined {
  return SOUNDS.find(s => s.id === id);
}

// ─── Community Presets ────────────────────────────────────────────────────────

export const COMMUNITY_PRESETS: Preset[] = [
  { id: 'p1', name: 'Rainy Café', description: 'Cozy coffee shop on a rainy day', mix: [{ soundId: 'rain', volume: 0.7 }, { soundId: 'cafe', volume: 0.4 }], tags: ['cozy', 'focus'], createdAt: Date.now(), isCommunity: true, author: 'SoundSpace', playCount: 1240 },
  { id: 'p2', name: 'Thunderstorm', description: 'Dramatic thunder and rain', mix: [{ soundId: 'thunder', volume: 0.6 }, { soundId: 'rain', volume: 0.5 }], tags: ['dramatic', 'sleep'], createdAt: Date.now(), isCommunity: true, author: 'SoundSpace', playCount: 980 },
  { id: 'p3', name: 'Forest Morning', description: 'Birds and gentle wind in the trees', mix: [{ soundId: 'birds', volume: 0.5 }, { soundId: 'forest', volume: 0.4 }, { soundId: 'wind', volume: 0.3 }], tags: ['peaceful', 'nature'], createdAt: Date.now(), isCommunity: true, author: 'SoundSpace', playCount: 756 },
  { id: 'p4', name: 'Deep Focus', description: 'Brown noise for maximum concentration', mix: [{ soundId: 'brownnoise', volume: 0.6 }], tags: ['focus', 'study'], createdAt: Date.now(), isCommunity: true, author: 'SoundSpace', playCount: 1530 },
  { id: 'p5', name: 'Ocean Calm', description: 'Gentle waves for relaxation', mix: [{ soundId: 'ocean', volume: 0.6 }, { soundId: 'wind', volume: 0.2 }], tags: ['relax', 'sleep'], createdAt: Date.now(), isCommunity: true, author: 'SoundSpace', playCount: 1100 },
  { id: 'p6', name: 'Crackling Fire', description: 'Warm fireplace on a cold night', mix: [{ soundId: 'fire', volume: 0.55 }, { soundId: 'wind', volume: 0.15 }], tags: ['cozy', 'sleep'], createdAt: Date.now(), isCommunity: true, author: 'SoundSpace', playCount: 890 },
];

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  savedPresets: 'soundspace_saved_presets',
  history: 'soundspace_history',
  timerSessions: 'soundspace_timer_sessions',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

async function save<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage save failed', e);
  }
}

// ─── Preset API ───────────────────────────────────────────────────────────────

export async function getSavedPresets(): Promise<Preset[]> {
  return load<Preset[]>(KEYS.savedPresets, []);
}

export async function savePreset(preset: Preset): Promise<void> {
  const presets = await getSavedPresets();
  presets.unshift(preset);
  await save(KEYS.savedPresets, presets);
}

// ─── History API ──────────────────────────────────────────────────────────────

export async function getHistory(): Promise<HistoryEntry[]> {
  return load<HistoryEntry[]>(KEYS.history, []);
}

export async function addHistory(entry: HistoryEntry): Promise<void> {
  const history = await getHistory();
  history.unshift(entry);
  await save(KEYS.history, history.slice(0, 100));
}

// ─── Timer API ────────────────────────────────────────────────────────────────

export async function getTimerSessions(): Promise<TimerSession[]> {
  return load<TimerSession[]>(KEYS.timerSessions, []);
}

export async function addTimerSession(session: TimerSession): Promise<void> {
  const sessions = await getTimerSessions();
  sessions.unshift(session);
  await save(KEYS.timerSessions, sessions.slice(0, 100));
}
