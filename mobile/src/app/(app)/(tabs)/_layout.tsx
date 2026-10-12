import { Tabs } from 'expo-router';

import { GroundedTabBar } from '@/components/home/grounded-tab-bar';
import { Colors } from '@/constants/theme';

export default function AppTabsLayout() {
  return (
    <Tabs
      initialRouteName="today"
      tabBar={(props) => <GroundedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Colors.light.background },
      }}>
      <Tabs.Screen name="today" />
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="talk" />
      <Tabs.Screen name="review" options={{ href: null }} />
      <Tabs.Screen name="you" />
      <Tabs.Screen name="home" options={{ href: null }} />
    </Tabs>
  );
}
