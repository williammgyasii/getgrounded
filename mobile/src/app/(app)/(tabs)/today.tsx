import { type Href, router, useFocusEffect } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAuthUser } from '@/components/auth/auth-session';
import { HomeTopBar } from '@/components/home/home-top-bar';
import { EveningSheet } from '@/components/talk/evening-sheet';
import { PageWait } from '@/components/talk/page-wait';
import { ReflectCue } from '@/components/talk/reflect-cue';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deviceTimezone } from '@/lib/api';
import {
  consistencyScore,
  givenName,
  greeting,
  monthHeat,
  todayProgress,
  weekStrip,
} from '@/lib/dashboard';
import { getFirebaseAuth } from '@/lib/firebase';
import { type DayRecord } from '@/lib/api';
import { useReflectOpen, useReflectToday } from '@/lib/reflect-settings';
import { openReflectDays } from '@/lib/reflect-window';
import { useGetDeskQuery, useGetHistoryQuery } from '@/store/api';

function weekdayDate(now = new Date()): string {
  return now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function initialFrom(email: string | null | undefined): string {
  const local = email?.split('@')[0]?.trim();
  return local ? local[0].toUpperCase() : '';
}

export default function HomeScreen() {
  const theme = useTheme();
  const user = useAuthUser();
  const signedIn = user != null;
  const timezone = deviceTimezone();
  const { data: desk, isLoading: deskLoading, refetch: refetchDesk } = useGetDeskQuery(timezone, {
    skip: !signedIn,
  });
  const { data: history = [], refetch: refetchHistory } = useGetHistoryQuery(timezone, {
    skip: !signedIn,
  });
  const waiting = signedIn && deskLoading;
  const inWindow = useReflectOpen();
  const reflectToday = useReflectToday();
  const book = desk?.today
    ? [desk.today, ...history.filter((day) => day.id !== desk.today?.id)]
    : history;
  const openNights = openReflectDays(book, reflectToday);
  const [recover, setRecover] = useState<DayRecord | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (signedIn) {
        void refetchDesk();
        void refetchHistory();
      }
    }, [signedIn, refetchDesk, refetchHistory]),
  );

  async function onSignOut() {
    await signOut(getFirebaseAuth());
    router.replace('/');
  }

  function onAvatar() {
    Alert.alert(user?.email ?? 'Account', undefined, [
      { text: 'You', onPress: () => router.push('/you') },
      { text: 'Sign out', style: 'destructive', onPress: onSignOut },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const name = givenName(user?.email, user?.displayName);
  const title = name ? `${greeting()}, ${name}` : greeting();
  const today = desk?.today ?? null;
  const progress = todayProgress(today);
  const week = weekStrip(history.concat(today ? [today] : []));
  const heat = monthHeat(history.concat(today ? [today] : []));
  const score = consistencyScore(history.concat(today ? [today] : []));
  const streak = desk?.streakDays ?? 0;

  return (
    <ThemedView style={styles.screen}>
      <HomeTopBar
        title={title}
        subtitle={weekdayDate()}
        initial={initialFrom(user?.email)}
        onAvatarPress={onAvatar}
      />
      {waiting ? <PageWait /> : null}
      {waiting ? null : (
      <ScrollView contentContainerStyle={styles.content}>
        <ReflectCue
          visible={inWindow && openNights.length > 0}
          onPress={() => setRecover(openNights[0] ?? null)}
        />
        <View style={styles.week}>
          {week.map((day) => (
            <View key={day.key} style={styles.weekDay}>
              <ThemedText type="small" themeColor="textSecondary">
                {day.label}
              </ThemedText>
              <View
                style={[
                  styles.weekDot,
                  {
                    backgroundColor: day.today
                      ? theme.accent
                      : day.showedUp
                        ? theme.primary
                        : theme.backgroundElement,
                  },
                ]}>
                <ThemedText
                  type="smallBold"
                  style={{ color: day.today || day.showedUp ? '#FFFFFF' : theme.text }}>
                  {day.date}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.stats}>
          <View style={[styles.ringCard, { backgroundColor: theme.accent }]}>
            <ThemedText style={styles.ringValue}>{score}%</ThemedText>
            <ThemedText type="small" style={styles.onAccent}>
              Consistency
            </ThemedText>
            <ThemedText type="small" style={styles.onAccent}>
              {week.filter((day) => day.showedUp).length} of 7 days
            </ThemedText>
          </View>
          <View style={styles.statCol}>
            <View style={[styles.stat, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ThemedText style={styles.statValue}>{streak}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Day streak
              </ThemedText>
            </View>
            <View style={[styles.stat, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ThemedText style={styles.statValue}>
                {progress.done}/{progress.total || 0}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Done today
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText type="smallBold">This week</ThemedText>
          <View style={styles.bars}>
            {week.map((day) => {
              const ratio = day.planned === 0 ? (day.showedUp ? 0.35 : 0.08) : Math.max(0.12, day.done / day.planned);
              return (
                <View key={day.key} style={styles.barCol}>
                  <View style={[styles.barTrack, { backgroundColor: theme.backgroundElement }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.round(ratio * 100)}%`,
                          backgroundColor: day.today ? theme.accent : theme.primary,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    {day.label}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText type="smallBold">Last 28 days</ThemedText>
          <View style={styles.heat}>
            {heat.map((cell) => (
              <View
                key={cell.iso}
                style={[
                  styles.heatCell,
                  {
                    backgroundColor:
                      cell.level === 0
                        ? theme.backgroundElement
                        : cell.level === 1
                          ? '#A8B6F5'
                          : cell.level === 2
                            ? '#6B82F0'
                            : theme.accent,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.navigate('/history' as Href)}
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText type="smallBold">{today?.title ?? 'No plan yet'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {today ? 'Open today’s tasks' : 'Speak the day from Plan'}
          </ThemedText>
        </Pressable>
      </ScrollView>
      )}
      <EveningSheet day={recover} onClose={() => setRecover(null)} />
    </ThemedView>
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    alignItems: 'center',
    gap: 6,
  },
  weekDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  ringCard: {
    flex: 1.1,
    borderRadius: 16,
    padding: Spacing.four,
    justifyContent: 'center',
    gap: 4,
  },
  ringValue: {
    fontFamily: FontFamily.semibold,
    fontSize: 40,
    lineHeight: 44,
    color: '#FFFFFF',
  },
  onAccent: {
    color: '#FFFFFF',
  },
  statCol: {
    flex: 1,
    gap: Spacing.three,
  },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: FontFamily.semibold,
    fontSize: 24,
    lineHeight: 30,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 96,
    gap: 6,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    height: '100%',
  },
  barTrack: {
    flex: 1,
    width: '70%',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  heat: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  heatCell: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
});
