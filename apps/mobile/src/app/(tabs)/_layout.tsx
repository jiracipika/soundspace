import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: '#0a0a0f' },
      headerTintColor: '#fff',
      tabBarStyle: { backgroundColor: '#0a0a0f', borderTopColor: '#1a1a2e' },
      tabBarActiveTintColor: '#a78bfa',
    }}>
      <Tabs.Screen name="mixer" options={{ title: "Mixer" }} />
      <Tabs.Screen name="presets" options={{ title: "Presets" }} />
      <Tabs.Screen name="timer" options={{ title: "Timer" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
    </Tabs>
  );
}
