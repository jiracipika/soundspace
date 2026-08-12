import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COMMUNITY_PRESETS, getSavedPresets, getSoundById, type Preset } from '../../lib/store';

export default function PresetsScreen() {
  const [tab, setTab] = useState<'community' | 'saved'>('community');
  const [saved, setSaved] = useState<Preset[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSaved = useCallback(async () => {
    setSaved(await getSavedPresets());
  }, []);

  useEffect(() => { loadSaved(); }, [loadSaved]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSaved();
    setRefreshing(false);
  }, [loadSaved]);

  const presets = tab === 'community' ? COMMUNITY_PRESETS : saved;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, tab === 'community' && styles.tabActive]}
          onPress={() => setTab('community')}
        >
          <Text style={[styles.tabText, tab === 'community' && styles.tabTextActive]}>Community</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'saved' && styles.tabActive]}
          onPress={() => setTab('saved')}
        >
          <Text style={[styles.tabText, tab === 'saved' && styles.tabTextActive]}>Saved ({saved.length})</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        <Text style={styles.count}>{presets.length} presets</Text>
        {presets.map(p => (
          <View key={p.id} style={styles.presetCard}>
            <View style={styles.presetHeader}>
              <Text style={styles.presetName}>{p.name}</Text>
              {p.isCommunity && p.playCount != null && (
                <Text style={styles.playCount}>▶ {p.playCount}</Text>
              )}
            </View>
            <Text style={styles.presetDesc}>{p.description}</Text>
            <View style={styles.mixRow}>
              {p.mix.map((m, i) => {
                const sound = getSoundById(m.soundId);
                return (
                  <View key={i} style={styles.mixChip}>
                    <Text style={styles.mixEmoji}>{sound?.emoji || '🎵'}</Text>
                    <Text style={styles.mixLabel}>{sound?.name || m.soundId}</Text>
                    <Text style={styles.mixVol}>{Math.round(m.volume * 100)}%</Text>
                  </View>
                );
              })}
            </View>
            {p.tags && p.tags.length > 0 && (
              <View style={styles.tagRow}>
                {p.tags.map(tag => <Text key={tag} style={styles.tag}>#{tag}</Text>)}
              </View>
            )}
          </View>
        ))}
        {presets.length === 0 && (
          <Text style={styles.emptyText}>No {tab} presets yet.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  tabRow: { flexDirection: 'row', padding: 16, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#1c1c2e', alignItems: 'center' },
  tabActive: { backgroundColor: '#0A84FF' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#fff' },
  content: { padding: 16, paddingTop: 0 },
  count: { fontSize: 14, color: '#666', marginBottom: 12 },
  presetCard: { backgroundColor: '#1c1c2e', borderRadius: 16, padding: 16, marginBottom: 12 },
  presetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  presetName: { fontSize: 17, fontWeight: '700', color: '#fff' },
  playCount: { fontSize: 12, color: '#0A84FF' },
  presetDesc: { fontSize: 14, color: '#aaa', marginTop: 4 },
  mixRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  mixChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#2a2a3e', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10,
  },
  mixEmoji: { fontSize: 14 },
  mixLabel: { fontSize: 12, color: '#ccc' },
  mixVol: { fontSize: 12, color: '#666', fontWeight: '600' },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  tag: { fontSize: 12, color: '#5E5CE6' },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 40 },
});
