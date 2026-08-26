import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: Colors.light.background },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="day/[id]" />
    </Stack>
  );
}
