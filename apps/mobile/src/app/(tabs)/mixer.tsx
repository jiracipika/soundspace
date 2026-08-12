import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SOUNDS, getSoundById, type MixEntry } from '../../lib/store';

export default function MixerScreen() {
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [playing, setPlaying] = useState<Record<string, boolean>>({});

  const togglePlay = useCallback((soundId: string) => {
    setPlaying(prev => ({ ...prev, [soundId]: !prev[soundId] }));
  }, []);

  const setVolume = useCallback((soundId: string, vol: number) => {
    setVolumes(prev => ({ ...prev, [soundId]: vol }));
  }, []);

  const activeSounds = Object.entries(playing).filter(([, v]) => v).map(([id]) => id);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Sound Mixer</Text>
        <Text style={styles.subtitle}>{activeSounds.length} sound{activeSounds.length !== 1 ? 's' : ''} active</Text>

        {SOUNDS.map(sound => {
          const isPlaying = playing[sound.id];
          const vol = volumes[sound.id] ?? 0.5;
          return (
            <View key={sound.id} style={[styles.soundCard, isPlaying && styles.soundCardActive]}>
              <View style={styles.soundHeader}>
                <Text style={styles.soundEmoji}>{sound.emoji}</Text>
                <Text style={styles.soundName}>{sound.name}</Text>
                <Pressable
                  style={[styles.playBtn, isPlaying ? styles.playBtnActive : styles.playBtnIdle]}
                  onPress={() => togglePlay(sound.id)}
                >
                  <Text style={styles.playBtnText}>{isPlaying ? '⏸' : '▶'}</Text>
                </Pressable>
              </View>
              {isPlaying && (
                <View style={styles.volumeRow}>
                  <Pressable onPress={() => setVolume(sound.id, Math.max(0, vol - 0.1))} style={styles.volBtn}>
                    <Text style={styles.volBtnText}>−</Text>
                  </Pressable>
                  <View style={styles.volumeBar}>
                    <View style={[styles.volumeFill, { width: `${vol * 100}%`, backgroundColor: sound.gradientTo }]} />
                  </View>
                  <Pressable onPress={() => setVolume(sound.id, Math.min(1, vol + 0.1))} style={styles.volBtn}>
                    <Text style={styles.volBtnText}>+</Text>
                  </Pressable>
                  <Text style={styles.volLabel}>{Math.round(vol * 100)}%</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 16 },
  header: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 16 },
  soundCard: {
    backgroundColor: '#1c1c2e', borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 2, borderColor: 'transparent',
  },
  soundCardActive: { borderColor: '#0A84FF' },
  soundHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  soundEmoji: { fontSize: 28 },
  soundName: { flex: 1, fontSize: 17, fontWeight: '600', color: '#fff' },
  playBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  playBtnActive: { backgroundColor: '#0A84FF' },
  playBtnIdle: { backgroundColor: '#333' },
  playBtnText: { fontSize: 16, color: '#fff' },
  volumeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  volBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  volBtnText: { fontSize: 18, color: '#fff', fontWeight: '700' },
  volumeBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#333', overflow: 'hidden' },
  volumeFill: { height: '100%', borderRadius: 3 },
  volLabel: { fontSize: 12, color: '#888', width: 36, textAlign: 'right' },
});
