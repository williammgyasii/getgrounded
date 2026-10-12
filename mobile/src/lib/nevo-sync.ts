import { type DayRecord } from '@/lib/api';
import { syncNevoBubble, stopNevoBubble } from '@/lib/nevo-bubble-bridge';
import { scheduleNevoHeadsUps } from '@/lib/nevo-notifications';
import {
  buildSnapshotFromDay,
  buildSnapshotPrefs,
  saveNevoSnapshot,
  type NevoDaySnapshot,
} from '@/lib/nevo-presence';

export async function syncNevoPresence(day: DayRecord, streakDays: number): Promise<NevoDaySnapshot> {
  const prefs = await buildSnapshotPrefs();
  const snapshot = buildSnapshotFromDay(day, streakDays, prefs);
  await saveNevoSnapshot(snapshot);
  await scheduleNevoHeadsUps(snapshot, day.commitments);
  await syncNevoBubble(snapshot);
  return snapshot;
}

export async function clearNevoPresence(localDate: string): Promise<void> {
  const { cancelNevoNotifications } = await import('@/lib/nevo-notifications');
  await cancelNevoNotifications(localDate);
  await stopNevoBubble();
}
