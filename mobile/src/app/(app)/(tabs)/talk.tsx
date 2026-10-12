import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MorningWizard } from '@/components/talk/morning-wizard';
import { PlanAssistantOnboarding } from '@/components/talk/plan-assistant-onboarding';
import { PlanDayHome } from '@/components/talk/plan-day-home';
import { PageWait } from '@/components/talk/page-wait';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PlanSurface } from '@/constants/plan-surface';
import { MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { deviceTimezone } from '@/lib/api';
import { loadPlanAssistant, type PlanAssistant } from '@/lib/plan-assistant';
import { canUpdateDay, hasEvening } from '@/lib/reflect-window';
import { NevoBubbleOptInSheet } from '@/components/talk/nevo-bubble-opt-in-sheet';
import { useNevoNotificationLinks } from '@/hooks/use-nevo-presence';
import { loadBubbleEnabled, loadOptInSeen } from '@/lib/nevo-settings';
import { syncNevoPresence } from '@/lib/nevo-sync';
import { useGetDeskQuery, useRemoveDayMutation } from '@/store/api';

export default function TalkScreen() {
  const insets = useSafeAreaInsets();
  const timezone = deviceTimezone();
  const { data: desk, isLoading, refetch } = useGetDeskQuery(timezone);
  const [removeDay] = useRemoveDayMutation();
  const [assistant, setAssistant] = useState<PlanAssistant | null>(null);
  const [bubbleOptInOpen, setBubbleOptInOpen] = useState(false);
  const today = desk?.today ?? null;
  const streakDays = desk?.streakDays ?? 0;
  const closed = today != null && hasEvening(today);
  const planned = today != null && canUpdateDay(today);

  useNevoNotificationLinks();

  useEffect(() => {
    void loadPlanAssistant().then(setAssistant);
  }, []);

  async function clearTodayAndReplan() {
    if (!today) {
      return;
    }
    const localDate = today.localDate;
    await removeDay(today.id).unwrap();
    const { clearNevoPresence } = await import('@/lib/nevo-sync');
    await clearNevoPresence(localDate);
    await refetch();
  }

  async function afterMorningSave(savedDay: import('@/lib/api').DayRecord) {
    await refetch();
    await syncNevoPresence(savedDay, streakDays);
    const [seen, bubble] = await Promise.all([loadOptInSeen(), loadBubbleEnabled()]);
    if (!seen && !bubble) {
      setBubbleOptInOpen(true);
    }
  }

  if (assistant == null) {
    return (
      <ThemedView style={[styles.screen, { backgroundColor: PlanSurface.bg }]}>
        <PageWait />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.screen, { backgroundColor: PlanSurface.bg }]}>
      <PlanAssistantOnboarding
        open={!assistant.onboarded}
        initial={assistant}
        onDone={(profile) => setAssistant(profile)}
      />
      {isLoading && desk == null ? (
        <PageWait />
      ) : closed ? (
        <View style={[styles.closed, { paddingTop: insets.top + Spacing.five }]}>
          <ThemedText style={[styles.closedTitle, { color: PlanSurface.text }]}>Night is closed</ThemedText>
          <ThemedText style={[styles.closedBody, { color: PlanSurface.textMuted }]}>
            See you in the morning.
          </ThemedText>
        </View>
      ) : planned && today ? (
        <PlanDayHome
          day={today}
          streakDays={desk?.streakDays ?? 0}
          assistant={assistant}
          onRefresh={() => {
            void refetch().then(() => {
              if (today) {
                void syncNevoPresence(today, streakDays);
              }
            });
          }}
          onPlanAgain={() => void clearTodayAndReplan()}
          onDeleteDay={() => void clearTodayAndReplan()}
        />
      ) : (
        <MorningWizard
          assistant={assistant}
          onSaved={(saved) => void afterMorningSave(saved)}
        />
      )}
      <NevoBubbleOptInSheet
        open={bubbleOptInOpen}
        onClose={() => setBubbleOptInOpen(false)}
        onEnabled={() => {
          void refetch().then((result) => {
            const day = result.data?.today;
            if (day) {
              void syncNevoPresence(day, result.data?.streakDays ?? 0);
            }
          });
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  closed: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  closedTitle: {
    ...Typography.title,
  },
  closedBody: {
    ...Typography.body,
  },
});
