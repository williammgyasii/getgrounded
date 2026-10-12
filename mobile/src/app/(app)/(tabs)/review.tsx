import { type Href, router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAuthUser } from '@/components/auth/auth-session';
import { HomeTopBar } from '@/components/home/home-top-bar';
import { PageWait } from '@/components/talk/page-wait';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Typography, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deviceTimezone } from '@/lib/api';
import { longDayLabel } from '@/lib/day-tasks';
import { useGetReviewQuery } from '@/store/api';

import { PlanBlue } from '@/constants/plan-theme';

const ClosedInk = PlanBlue.deep;

function initialFrom(email: string | null | undefined): string {
  const local = email?.split('@')[0]?.trim();
  return local ? local[0].toUpperCase() : '';
}

export default function ReviewScreen() {
  const theme = useTheme();
  const user = useAuthUser();
  const signedIn = user != null;
  const timezone = deviceTimezone();
  const { data: review, isLoading, refetch } = useGetReviewQuery(timezone, { skip: !signedIn });

  useFocusEffect(
    useCallback(() => {
      if (signedIn) {
        void refetch();
      }
    }, [signedIn, refetch]),
  );

  const waiting = signedIn && isLoading;

  return (
    <ThemedView style={styles.screen}>
      <HomeTopBar
        title="Review"
        subtitle="Closed nights, last seven days."
        initial={initialFrom(user?.email)}
        onAvatarPress={() => router.push('/you')}
      />
      {waiting ? <PageWait /> : null}
      <ScrollView contentContainerStyle={styles.content}>
        {waiting ? null : review == null || review.followThrough == null ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ThemedText type="smallBold">This week</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.copy}>
              Close a night and the week appears.
            </ThemedText>
          </View>
        ) : (
          <>
            <View style={[styles.score, { backgroundColor: ClosedInk }]}>
              <ThemedText style={[styles.percent, { color: theme.primaryOn }]}>
                {review.followThrough}%
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.primaryOn }}>
                Follow-through
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.primaryOn }}>
                {review.closedNights} closed night{review.closedNights === 1 ? '' : 's'} · {review.planned}{' '}
                planned
              </ThemedText>
            </View>
            <View style={styles.stats}>
              <Stat label="Done" value={review.done} theme={theme} />
              <Stat label="Partial" value={review.partial} theme={theme} />
              <Stat label="Missed" value={review.missed} theme={theme} />
              <Stat label="Also" value={review.extras} theme={theme} />
            </View>
            {review.nights.map((night) => (
              <Pressable
                key={night.dayId}
                accessibilityRole="button"
                accessibilityLabel={`Open ${night.title ?? night.localDate}`}
                onPress={() => router.push(`/day/${night.dayId}` as Href)}
                style={[styles.card, { backgroundColor: theme.card, borderColor: ClosedInk, borderWidth: 2 }]}>
                <ThemedText type="small" themeColor="textSecondary">
                  {longDayLabel(night.localDate)}
                </ThemedText>
                <ThemedText style={styles.nightTitle}>{night.title ?? 'Untitled day'}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {night.done} done · {night.partial} partial · {night.missed} missed
                  {night.extras > 0 ? ` · ${night.extras} also happened` : ''}
                </ThemedText>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function Stat({
  label,
  value,
  theme,
}: {
  label: string;
  value: number;
  theme: { card: string; border: string };
}) {
  return (
    <View style={[styles.stat, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  score: {
    borderRadius: Radius.card,
    padding: Spacing.four,
    gap: 4,
  },
  percent: {
    ...Typography.score,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    ...Typography.title, fontSize: 20, lineHeight: 26,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    gap: 2,
  },
  nightTitle: {
    ...Typography.title, fontSize: 18, lineHeight: 24,
  },
  copy: {
    ...Typography.body,
  },
});
