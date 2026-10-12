import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PlanSurface } from '@/constants/plan-surface';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { canDrawOverlays, openOverlaySettings, stopNevoBubble } from '@/lib/nevo-bubble-bridge';
import { syncNevoPresence } from '@/lib/nevo-sync';
import {
  clearBubbleOverlayDismissed,
  DEFAULT_LEAD_MINUTES,
  dismissBubbleOverlayForDay,
  isBubbleOverlayDismissed,
  loadBubbleEnabled,
  loadLeadMinutes,
  saveBubbleEnabled,
  saveLeadMinutes,
} from '@/lib/nevo-settings';
import { type DayRecord } from '@/lib/api';

export function NevoPresenceCard({
  day,
  streakDays = 0,
  onChanged,
}: {
  day?: DayRecord | null;
  streakDays?: number;
  onChanged?: () => void;
}) {
  const theme = useTheme();
  const [bubble, setBubble] = useState(false);
  const [lead, setLead] = useState(DEFAULT_LEAD_MINUTES);
  const [chipHiddenToday, setChipHiddenToday] = useState(false);

  const refreshHidden = useCallback(async () => {
    if (!day?.localDate) {
      setChipHiddenToday(false);
      return;
    }
    setChipHiddenToday(await isBubbleOverlayDismissed(day.localDate));
  }, [day?.localDate]);

  useEffect(() => {
    void loadBubbleEnabled().then(setBubble);
    void loadLeadMinutes().then(setLead);
    void refreshHidden();
  }, [refreshHidden]);

  async function toggleBubble(next: boolean) {
    setBubble(next);
    await saveBubbleEnabled(next);
    if (!next) {
      await stopNevoBubble();
    } else {
      await clearBubbleOverlayDismissed();
      const allowed = await canDrawOverlays();
      if (!allowed) {
        await openOverlaySettings();
      }
    }
    onChanged?.();
    if (day && next) {
      void syncNevoPresence(day, streakDays);
    }
    void refreshHidden();
  }

  async function showChipAgain() {
    if (!day) {
      return;
    }
    await clearBubbleOverlayDismissed();
    setChipHiddenToday(false);
    void syncNevoPresence(day, streakDays);
    onChanged?.();
  }

  async function hideChipToday() {
    if (!day) {
      return;
    }
    await dismissBubbleOverlayForDay(day.localDate);
    await stopNevoBubble();
    setChipHiddenToday(true);
    onChanged?.();
  }

  async function bumpLead() {
    const next = lead === 15 ? 30 : lead === 30 ? 45 : 15;
    setLead(next);
    await saveLeadMinutes(next);
    onChanged?.();
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
      <ThemedText type="smallBold">Nevo nearby</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.hint}>
        On-screen chip shows your next task. Heads-up notifications still work if you hide the chip.
      </ThemedText>
      <View style={styles.row}>
        <ThemedText type="bodyMedium">On-screen chip</ThemedText>
        <Switch value={bubble} onValueChange={(next) => void toggleBubble(next)} />
      </View>
      {bubble && chipHiddenToday ? (
        <Pressable accessibilityRole="button" onPress={() => void showChipAgain()} style={styles.linkRow}>
          <ThemedText type="bodyMedium" style={{ color: PlanSurface.accent }}>
            Show chip again today
          </ThemedText>
        </Pressable>
      ) : bubble && day ? (
        <Pressable accessibilityRole="button" onPress={() => void hideChipToday()} style={styles.linkRow}>
          <ThemedText type="caption" themeColor="textSecondary">
            Hide chip for today (× on the bubble does the same)
          </ThemedText>
        </Pressable>
      ) : null}
      <Pressable accessibilityRole="button" onPress={() => void bumpLead()} style={styles.row}>
        <ThemedText type="bodyMedium">Heads-up lead time</ThemedText>
        <ThemedText type="bodyMedium" themeColor="textSecondary">
          {lead} min
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  hint: {
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
  },
  linkRow: {
    paddingVertical: Spacing.one,
  },
});
