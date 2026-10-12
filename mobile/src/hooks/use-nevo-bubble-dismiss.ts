import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import NevoBubble from 'nevo-bubble';

import { hideNevoBubbleOverlay } from '@/lib/nevo-bubble-bridge';
import { dismissBubbleOverlayForDay } from '@/lib/nevo-settings';

export function useNevoBubbleDismissListener(localDate: string | null) {
  const dateRef = useRef(localDate);
  dateRef.current = localDate;

  useEffect(() => {
    if (Platform.OS !== 'android' || !localDate) {
      return;
    }

    let sub: { remove: () => void } | undefined;
    try {
      sub = NevoBubble.addListener('onBubbleDismissed', () => {
        const day = dateRef.current;
        if (day) {
          void dismissBubbleOverlayForDay(day);
          void hideNevoBubbleOverlay();
        }
      });
    } catch {
      // Native module unavailable in this build.
    }

    return () => sub?.remove();
  }, [localDate]);
}
