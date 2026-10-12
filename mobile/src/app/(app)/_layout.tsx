import { Stack } from 'expo-router';

import { NevoPresenceHost } from '@/components/nevo/nevo-presence-host';
import { Colors } from '@/constants/theme';

export default function AppLayout() {
  return (
    <>
      <NevoPresenceHost />
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: Colors.light.background },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="day/[id]" />
    </Stack>
    </>
  );
}
