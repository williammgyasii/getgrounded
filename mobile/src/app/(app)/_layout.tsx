import { Tabs } from 'expo-router';

import { GroundedTabBar } from '@/components/home/grounded-tab-bar';
import { Colors } from '@/constants/theme';

export default function AppTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <GroundedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Colors.light.background },
      }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="you" />
      <Tabs.Screen name="talk" options={{ href: null }} />
    </Tabs>
  );
}
