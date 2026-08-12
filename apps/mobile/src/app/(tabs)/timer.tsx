import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addTimerSession } from '../../lib/store';

const PRESETS = [
  { label: 'Focus', minutes: 25, type: 'focus' as const, color: '#0A84FF' },
  { label: 'Short Break', minutes: 5, type: 'short-break' as const, color: '#34C759' },
  { label: 'Long Break', minutes: 15, type: 'long-break' as const, color: '#BF5AF2' },
];

export default function TimerScreen() {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSeconds = PRESETS[selectedPreset].minutes * 60;

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setRunning(false);
            addTimerSession({ duration: totalSeconds, type: PRESETS[selectedPreset].type, completedAt: Date.now() });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const selectPreset = useCallback((idx: number) => {
    setSelectedPreset(idx);
    setSecondsLeft(PRESETS[idx].minutes * 60);
    setRunning(false);
  }, []);

  const toggle = useCallback(() => {
    if (secondsLeft === 0) {
      setSecondsLeft(totalSeconds);
      setRunning(true);
    } else {
      setRunning(r => !r);
    }
  }, [secondsLeft, totalSeconds]);

  const reset = useCallback(() => {
    setRunning(false);
    setSecondsLeft(totalSeconds);
  }, [totalSeconds]);

  const progress = 1 - (secondsLeft / totalSeconds);
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Focus Timer</Text>

        <View style={styles.presetRow}>
          {PRESETS.map((p, i) => (
            <Pressable
              key={i}
              style={[styles.presetBtn, selectedPreset === i && { backgroundColor: p.color }]}
              onPress={() => selectPreset(i)}
            >
              <Text style={[styles.presetText, selectedPreset === i && styles.presetTextActive]}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.timerContainer}>
          <View style={[styles.progressRing, { borderColor: PRESETS[selectedPreset].color }]}>
            <Text style={styles.timerText}>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</Text>
            <Text style={styles.timerStatus}>{running ? 'Running' : secondsLeft === 0 ? 'Done!' : 'Paused'}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable style={styles.controlBtn} onPress={toggle}>
            <Text style={styles.controlText}>{running ? '⏸ Pause' : '▶ Start'}</Text>
          </Pressable>
          <Pressable style={[styles.controlBtn, styles.resetBtn]} onPress={reset}>
            <Text style={styles.controlText}>↻ Reset</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { flex: 1, padding: 16, alignItems: 'center' },
  header: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 24 },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 40 },
  presetBtn: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12,
    backgroundColor: '#1c1c2e',
  },
  presetText: { fontSize: 13, fontWeight: '600', color: '#888' },
  presetTextActive: { color: '#fff' },
  timerContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  progressRing: {
    width: 240, height: 240, borderRadius: 120,
    borderWidth: 4, borderColor: '#0A84FF',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1c1c2e',
  },
  timerText: { fontSize: 56, fontWeight: '800', color: '#fff', fontVariant: ['tabular-nums'] },
  timerStatus: { fontSize: 14, color: '#888', marginTop: 4 },
  controls: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  controlBtn: {
    paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16,
    backgroundColor: '#0A84FF',
  },
  resetBtn: { backgroundColor: '#333' },
  controlText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
