import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiddayWizard } from '@/components/talk/midday-wizard';
import { MorningWizard } from '@/components/talk/morning-wizard';
import { PageWait } from '@/components/talk/page-wait';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { deviceTimezone } from '@/lib/api';
import { canUpdateDay, hasEvening } from '@/lib/reflect-window';
import { useGetDeskQuery } from '@/store/api';

export default function TalkScreen() {
  const insets = useSafeAreaInsets();
  const timezone = deviceTimezone();
  const { data: desk, isLoading } = useGetDeskQuery(timezone);
  const today = desk?.today ?? null;
  const closed = today != null && hasEvening(today);
  const update = today != null && canUpdateDay(today);

  return (
    <ThemedView style={styles.screen}>
      {isLoading && desk == null ? (
        <PageWait />
      ) : closed ? (
        <View style={[styles.closed, { paddingTop: insets.top + Spacing.five }]}>
          <ThemedText style={styles.closedTitle}>Night is closed</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.closedBody}>
            See you in the morning.
          </ThemedText>
        </View>
      ) : update && today ? (
        <MiddayWizard day={today} />
      ) : (
        <MorningWizard />
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
    fontFamily: FontFamily.semibold,
    fontSize: 22,
    lineHeight: 28,
  },
  closedBody: {
    fontSize: 16,
    lineHeight: 24,
  },
});
