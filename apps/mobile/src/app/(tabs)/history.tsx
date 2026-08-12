import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getHistory, getTimerSessions, getSoundById, type HistoryEntry, type TimerSession } from '../../lib/store';

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setHistory(await getHistory());
    setSessions(await getTimerSessions());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const totalFocusMin = sessions
    .filter(s => s.type === 'focus')
    .reduce((sum, s) => sum + Math.round(s.duration / 60), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        <Text style={styles.header}>Your Activity</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{sessions.filter(s => s.type === 'focus').length}</Text>
            <Text style={styles.statLabel}>Focus Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{totalFocusMin}m</Text>
            <Text style={styles.statLabel}>Total Focus</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{history.length}</Text>
            <Text style={styles.statLabel}>Mix Sessions</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Mix Sessions</Text>
        {history.map(h => (
          <View key={h.id} style={styles.historyCard}>
            <View style={styles.mixIcons}>
              {h.mix.map((m, i) => {
                const sound = getSoundById(m.soundId);
                return <Text key={i} style={styles.mixIcon}>{sound?.emoji || '🎵'}</Text>;
              })}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.presetName}>{h.presetName}</Text>
              <Text style={styles.duration}>{Math.round(h.duration / 60)} min</Text>
            </View>
            <Text style={styles.date}>{new Date(h.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Recent Timer Sessions</Text>
        {sessions.slice(0, 10).map((s, i) => (
          <View key={i} style={styles.historyCard}>
            <Text style={styles.sessionEmoji}>{s.type === 'focus' ? '🎯' : '☕'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionType}>
                {s.type === 'focus' ? 'Focus' : s.type === 'short-break' ? 'Short Break' : 'Long Break'}
              </Text>
              <Text style={styles.duration}>{Math.round(s.duration / 60)} min</Text>
            </View>
            <Text style={styles.date}>{new Date(s.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
          </View>
        ))}

        {history.length === 0 && sessions.length === 0 && (
          <Text style={styles.emptyText}>No activity yet. Start a mix or timer!</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 16 },
  header: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#1c1c2e', borderRadius: 14, padding: 14, alignItems: 'center',
  },
  statNum: { fontSize: 24, fontWeight: '800', color: '#0A84FF' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 10, marginTop: 8 },
  historyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1c1c2e', borderRadius: 14, padding: 14, marginBottom: 8,
  },
  mixIcons: { flexDirection: 'row' },
  mixIcon: { fontSize: 16 },
  presetName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  duration: { fontSize: 12, color: '#888', marginTop: 2 },
  date: { fontSize: 12, color: '#666' },
  sessionEmoji: { fontSize: 20 },
  sessionType: { fontSize: 14, fontWeight: '600', color: '#fff' },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 40 },
});
