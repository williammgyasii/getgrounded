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
import { useGetDeskQuery, useRemoveDayMutation } from '@/store/api';

export default function TalkScreen() {
  const insets = useSafeAreaInsets();
  const timezone = deviceTimezone();
  const { data: desk, isLoading, refetch } = useGetDeskQuery(timezone);
  const [removeDay] = useRemoveDayMutation();
  const [assistant, setAssistant] = useState<PlanAssistant | null>(null);
  const today = desk?.today ?? null;
  const closed = today != null && hasEvening(today);
  const planned = today != null && canUpdateDay(today);

  useEffect(() => {
    void loadPlanAssistant().then(setAssistant);
  }, []);

  async function clearTodayAndReplan() {
    if (!today) {
      return;
    }
    await removeDay(today.id).unwrap();
    await refetch();
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
          onRefresh={() => void refetch()}
          onPlanAgain={() => void clearTodayAndReplan()}
          onDeleteDay={() => void clearTodayAndReplan()}
        />
      ) : (
        <MorningWizard assistant={assistant} onSaved={() => void refetch()} />
      )}
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
