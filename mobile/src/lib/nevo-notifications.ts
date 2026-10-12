import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { type CommitmentRecord } from '@/lib/api';
import { clockLabelCompact } from '@/lib/clock';
import { nevoPlanDeepLink, type NevoDaySnapshot, spokenMinuteNow } from '@/lib/nevo-presence';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function notificationId(localDate: string, commitmentId: string, kind: 'lead' | 'start') {
  return `nevo-${localDate}-${commitmentId}-${kind}`;
}

function triggerAt(localDate: string, minuteOfDay: number): Date | null {
  const [year, month, day] = localDate.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const hours = Math.floor(minuteOfDay / 60);
  const mins = minuteOfDay % 60;
  const when = new Date(year, month - 1, day, hours, mins, 0, 0);
  if (when.getTime() <= Date.now()) {
    return null;
  }

  return when;
}

export async function cancelNevoNotifications(localDate: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const mine = scheduled.filter((row) => row.identifier.startsWith(`nevo-${localDate}-`));
  await Promise.all(mine.map((row) => Notifications.cancelScheduledNotificationAsync(row.identifier)));
}

export async function scheduleNevoHeadsUps(
  snapshot: NevoDaySnapshot,
  commitments: CommitmentRecord[],
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  await cancelNevoNotifications(snapshot.localDate);

  const granted = await ensureNotificationPermission();
  if (!granted) {
    return;
  }

  const nowMinute = spokenMinuteNow();
  const lead = snapshot.leadMinutes;

  for (const row of commitments) {
    if (row.title.trim().length === 0) {
      continue;
    }

    if ((row.status ?? 'PLANNED').toUpperCase() === 'COMPLETED') {
      continue;
    }

    const start = row.plannedStartMinute;
    if (start == null || start < nowMinute - 1) {
      continue;
    }

    const leadMinute = Math.max(0, start - lead);
    const leadAt = triggerAt(snapshot.localDate, leadMinute);
    if (leadAt && leadMinute < start) {
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId(snapshot.localDate, row.id, 'lead'),
        content: {
          title: 'Nevo',
          body: `${row.title.trim()} in about ${lead} minutes (${clockLabelCompact(start)})`,
          data: { url: nevoPlanDeepLink(row.id) },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: leadAt },
      });
    }

    const startAt = triggerAt(snapshot.localDate, start);
    if (startAt) {
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId(snapshot.localDate, row.id, 'start'),
        content: {
          title: 'Nevo',
          body: `Time for ${row.title.trim()}`,
          data: { url: nevoPlanDeepLink(row.id) },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: startAt },
      });
    }
  }
}

export function useNotificationDeepLinks(onUrl: (url: string) => void) {
  // wired in hook file
  void onUrl;
}
