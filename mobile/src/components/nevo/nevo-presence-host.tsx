import { useNevoBubbleDismissListener } from '@/hooks/use-nevo-bubble-dismiss';
import { useNevoPresenceSync } from '@/hooks/use-nevo-presence';
import { deviceTimezone } from '@/lib/api';
import { canUpdateDay } from '@/lib/reflect-window';
import { useGetDeskQuery } from '@/store/api';

/** Keeps Nevo bubble + heads-ups in sync on any tab (Plan is lazy-unmounted). */
export function NevoPresenceHost() {
  const timezone = deviceTimezone();
  const { data: desk } = useGetDeskQuery(timezone);
  const today = desk?.today ?? null;
  const streakDays = desk?.streakDays ?? 0;
  const planned = today != null && canUpdateDay(today);

  useNevoPresenceSync(planned && today ? today : null, streakDays);
  useNevoBubbleDismissListener(today?.localDate ?? null);

  return null;
}
