import { deviceTimezone } from '@/lib/api';

const Suggested = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'America/Sao_Paulo',
  'Atlantic/Reykjavik',
  'Europe/London',
  'Europe/Paris',
  'Africa/Accra',
  'Africa/Lagos',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
];

export function reflectTimezones(current?: string): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const zone of [current, deviceTimezone(), ...Suggested]) {
    if (!zone || seen.has(zone)) {
      continue;
    }
    seen.add(zone);
    list.push(zone);
  }
  return list;
}
