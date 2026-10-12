import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { type DayRecord } from '@/lib/api';
import { syncNevoPresence } from '@/lib/nevo-sync';

export function useNevoPresenceSync(day: DayRecord | null, streakDays: number) {
  const synced = useRef<string | null>(null);

  useEffect(() => {
    if (!day) {
      return;
    }

    const key = `${day.id}-${day.commitments.map((row) => `${row.id}:${row.status}:${row.title}:${row.plannedStartMinute}`).join('|')}`;
    if (synced.current === key) {
      return;
    }

    synced.current = key;
    void syncNevoPresence(day, streakDays);
  }, [day, streakDays]);

  useEffect(() => {
    if (!day) {
      return;
    }

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncNevoPresence(day, streakDays);
      }
    });

    const interval = setInterval(() => {
      void syncNevoPresence(day, streakDays);
    }, 60_000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [day, streakDays]);
}

export function useNevoNotificationLinks() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const navigate = (url: unknown) => {
      if (typeof url !== 'string' || !url.startsWith('getgroundedapp://')) {
        return;
      }

      router.push('/(app)/(tabs)/talk');
    };

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      navigate(response.notification.request.content.data?.url);
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        navigate(response.notification.request.content.data?.url);
      }
    });

    return () => sub.remove();
  }, [router]);
}
