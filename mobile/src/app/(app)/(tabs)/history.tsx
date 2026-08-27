import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';

import { useAuthUser } from '@/components/auth/auth-session';
import { HomeTopBar } from '@/components/home/home-top-bar';
import { agendaSummary } from '@/components/talk/day-agenda';
import { DangerConfirm } from '@/components/talk/danger-confirm';
import { EveningSheet } from '@/components/talk/evening-sheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deviceTimezone, type DayRecord } from '@/lib/api';
import { longDayLabel, scheduledTasks } from '@/lib/day-tasks';
import { useReflectToday } from '@/lib/reflect-settings';
import { canRecoverDay } from '@/lib/reflect-window';
import { useGetHistoryQuery, useRemoveDayMutation } from '@/store/api';

function initialFrom(email: string | null | undefined): string {
  const local = email?.split('@')[0]?.trim();
  return local ? local[0].toUpperCase() : '';
}

export default function TasksScreen() {
  const theme = useTheme();
  const user = useAuthUser();
  const signedIn = user != null;
  const { data: days = [], refetch } = useGetHistoryQuery(deviceTimezone(), { skip: !signedIn });
  const [removeDay] = useRemoveDayMutation();
  const today = useReflectToday();
  const [pending, setPending] = useState<{ id: string; title: string } | null>(null);
  const [recover, setRecover] = useState<DayRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (signedIn) {
        void refetch();
      }
    }, [signedIn, refetch]),
  );

  async function confirmDelete() {
    if (!pending) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await removeDay(pending.id).unwrap();
      setPending(null);
    } catch {
      setError('Could not delete this day. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView style={styles.screen}>
      <HomeTopBar
        title="Tasks"
        subtitle="Each day you spoke."
        initial={initialFrom(user?.email)}
        onAvatarPress={() => router.push('/you')}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {days.length === 0 ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ThemedText type="smallBold">No days yet</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.copy}>
              Plan a morning and it will land here.
            </ThemedText>
          </View>
        ) : (
          days.map((day, index) => {
            const tasks = scheduledTasks(day.commitments);
            return (
              <Animated.View key={day.id} entering={FadeInDown.duration(280).delay(index * 40)}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${day.title ?? day.localDate}`}
                  onPress={() => router.push(`/day/${day.id}`)}
                  style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardCopy}>
                      <ThemedText type="small" themeColor="textSecondary">
                        {longDayLabel(day.localDate)}
                      </ThemedText>
                      <ThemedText style={styles.dayTitle}>{day.title ?? 'Untitled day'}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {agendaSummary(tasks)}
                      </ThemedText>
                    </View>
                    {canRecoverDay(day, today) ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Close this night"
                        onPress={() => setRecover(day)}
                        hitSlop={8}
                        style={styles.trash}>
                        <SymbolView
                          name={{ ios: 'moon.fill', android: 'bedtime', web: 'bedtime' }}
                          size={18}
                          tintColor={theme.accent}
                        />
                      </Pressable>
                    ) : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Delete day"
                      onPress={() => {
                        setError(null);
                        setPending({ id: day.id, title: day.title ?? day.localDate });
                      }}
                      hitSlop={8}
                      style={styles.trash}>
                      <SymbolView
                        name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                        size={18}
                        tintColor={theme.textSecondary}
                      />
                    </Pressable>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
      <EveningSheet day={recover} onClose={() => setRecover(null)} />
      <DangerConfirm
        open={pending != null}
        title="Delete this day?"
        body={pending ? `${pending.title} and every task on it will be gone.` : ''}
        confirmLabel="Delete day"
        busy={busy}
        error={error}
        onCancel={() => {
          if (!busy) {
            setPending(null);
            setError(null);
          }
        }}
        onConfirm={() => void confirmDelete()}
      />
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
    paddingHorizontal: 10,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardCopy: {
    flex: 1,
    gap: 2,
  },
  dayTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  trash: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    fontSize: 16,
    lineHeight: 24,
  },
});
