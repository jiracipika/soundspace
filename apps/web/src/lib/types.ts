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
  volume: number; // 0-1
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
  presetId?: string;
  mix: MixEntry[];
  duration: number; // seconds
  startedAt: number;
  endedAt: number;
}

export interface TimerSession {
  duration: number; // seconds
  type: 'focus' | 'short-break' | 'long-break' | 'custom';
  completedAt: number;
}

export interface MixerState {
  volumes: Record<string, number>; // soundId -> volume 0-1
  playing: Record<string, boolean>; // soundId -> isPlaying
  masterVolume: number;
  startedAt?: number;
}
