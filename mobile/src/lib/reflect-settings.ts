import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { deviceTimezone } from '@/lib/api';
import {
  DefaultReflectEnd,
  DefaultReflectStart,
  inReflectWindow,
  localDateInZone,
  minuteOfDayInZone,
} from '@/lib/reflect-window';

const Key = 'reflect-hours';
const listeners = new Set<() => void>();

export type ReflectHours = {
  startMinute: number;
  endMinute: number;
  timezone: string;
};

function defaults(): ReflectHours {
  return {
    startMinute: DefaultReflectStart,
    endMinute: DefaultReflectEnd,
    timezone: deviceTimezone(),
  };
}

async function readHours(): Promise<ReflectHours> {
  const fallback = defaults();
  const raw = await AsyncStorage.getItem(Key);
  if (!raw) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<ReflectHours>;
    return {
      startMinute: Number.isFinite(parsed.startMinute) ? Number(parsed.startMinute) : fallback.startMinute,
      endMinute: Number.isFinite(parsed.endMinute) ? Number(parsed.endMinute) : fallback.endMinute,
      timezone: typeof parsed.timezone === 'string' && parsed.timezone.length > 0 ? parsed.timezone : fallback.timezone,
    };
  } catch {
    return fallback;
  }
}

export async function writeReflectHours(hours: ReflectHours): Promise<void> {
  await AsyncStorage.setItem(Key, JSON.stringify(hours));
  listeners.forEach((listen) => listen());
}

export function useReflectHours(): ReflectHours & { save: (next: Partial<ReflectHours>) => Promise<void> } {
  const [hours, setHours] = useState<ReflectHours>(defaults);

  useEffect(() => {
    let alive = true;
    const load = () => {
      void readHours().then((next) => {
        if (alive) {
          setHours(next);
        }
      });
    };
    load();
    listeners.add(load);
    return () => {
      alive = false;
      listeners.delete(load);
    };
  }, []);

  return {
    ...hours,
    save: async (patch) => {
      let next: ReflectHours | null = null;
      setHours((current) => {
        const merged = { ...current, ...patch };
        if (merged.startMinute === merged.endMinute) {
          return current;
        }
        next = merged;
        return merged;
      });
      if (next) {
        await writeReflectHours(next);
      }
    },
  };
}

export function useReflectOpen(): boolean {
  const { startMinute, endMinute, timezone } = useReflectHours();
  const [minute, setMinute] = useState(() => minuteOfDayInZone(timezone));

  useEffect(() => {
    const tick = () => setMinute(minuteOfDayInZone(timezone));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [timezone]);

  return inReflectWindow(minute, startMinute, endMinute);
}

export function useReflectToday(): string {
  const { timezone } = useReflectHours();
  return localDateInZone(timezone);
}
