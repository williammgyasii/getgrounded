import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AddTakeSheet } from '@/components/talk/add-take-sheet';
import { DangerConfirm } from '@/components/talk/danger-confirm';
import { EveningSheet } from '@/components/talk/evening-sheet';
import { HappenedCard } from '@/components/talk/happened-card';
import { PageWait } from '@/components/talk/page-wait';
import { ReflectCue } from '@/components/talk/reflect-cue';
import { DayWords, type WordTake } from '@/components/talk/day-words';
import { RoundProgress } from '@/components/talk/round-progress';
import { TaskRows } from '@/components/talk/task-rows';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type DayRecord, deviceTimezone } from '@/lib/api';
import { minutesPhrase } from '@/lib/clock';
import { loadWords } from '@/lib/day-notes';
import { longDayLabel, takesOnDay } from '@/lib/day-tasks';
import { useReflectOpen, useReflectToday } from '@/lib/reflect-settings';
import { canRecoverDay, hasEvening } from '@/lib/reflect-window';
import {
  useGetDeskQuery,
  useGetHistoryQuery,
  useMarkCommitmentMutation,
  useRemoveCommitmentMutation,
  useRemoveDayMutation,
  useRenameDayMutation,
} from '@/store/api';

function findDay(id: string, history: DayRecord[], desk?: { today: DayRecord | null; yesterday: DayRecord | null }) {
  return (
    history.find((day) => day.id === id) ??
    (desk?.today?.id === id ? desk.today : null) ??
    (desk?.yesterday?.id === id ? desk.yesterday : null) ??
    null
  );
}

export default function DayScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const timezone = deviceTimezone();
  const { data: history = [], isLoading: historyLoading } = useGetHistoryQuery(timezone);
  const { data: desk, isLoading: deskLoading } = useGetDeskQuery(timezone);
  const day = id ? findDay(id, history, desk) : null;
  const waiting = day == null && (historyLoading || deskLoading);
  const [savedWords, setSavedWords] = useState<WordTake[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [wordsOpen, setWordsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(day?.title ?? '');
  const [renameDay] = useRenameDayMutation();
  const [removeDay] = useRemoveDayMutation();
  const [markCommitment] = useMarkCommitmentMutation();
  const [removeCommitment] = useRemoveCommitmentMutation();
  const today = useReflectToday();
  const inWindow = useReflectOpen();
  const canReflect = day != null && canRecoverDay(day, today);
  const closed = day != null && hasEvening(day);
  const [reflectOpen, setReflectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setTitleDraft(day?.title ?? '');
  }, [day?.title]);

  useEffect(() => {
    if (!day) {
      return;
    }
    void loadWords(day.localDate).then((takes) =>
      setSavedWords(
        takes.map((take, index) => ({
          id: take.id,
          transcript: take.transcript,
          label: `Take ${index + 1}`,
        })),
      ),
    );
  }, [day?.localDate]);

  const takes = day ? takesOnDay(day.commitments) : [];
  const items = takes.flatMap((take) => take.items);
  const done = items.filter((item) => item.status?.toUpperCase() === 'COMPLETED').length;
  const totalMinutes = items.reduce((sum, item) => sum + (item.plannedDurationMinutes ?? 0), 0);
  let morningIndex = 0;
  const clips = (day?.clips ?? [])
    .filter((clip) => clip.transcript.trim().length > 0)
    .map((clip) => {
      const evening = clip.kind === 'EVENING_REFLECTION';
      morningIndex += evening ? 0 : 1;
      return {
        id: clip.id,
        transcript: clip.transcript,
        kind: clip.kind,
        label: evening ? 'Evening' : `Morning ${morningIndex}`,
        playable: clip.playable === true,
        words: clip.words,
      };
    });
  const transcripts = useMemo(
    () => (clips.length > 0 ? clips : savedWords),
    [clips, savedWords],
  );

  async function saveTitle() {
    if (!day) {
      return;
    }
    const next = titleDraft.trim();
    setEditing(false);
    if (!next || next === day.title) {
      setTitleDraft(day.title ?? '');
      return;
    }
    await renameDay({ id: day.id, title: next });
  }

  async function confirmDeleteDay() {
    if (!day) {
      return;
    }
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await removeDay(day.id).unwrap();
      setDeleteOpen(false);
      router.back();
    } catch {
      setDeleteError('Could not delete this day. Try again.');
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <ThemedView style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.three }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.iconBtn}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            size={20}
            tintColor={theme.text}
          />
        </Pressable>
        <View style={styles.heading}>
          <ThemedText type="small" themeColor="textSecondary">
            {day ? longDayLabel(day.localDate) : ''}
          </ThemedText>
          {editing ? (
            <TextInput
              value={titleDraft}
              onChangeText={setTitleDraft}
              onBlur={() => void saveTitle()}
              onSubmitEditing={() => void saveTitle()}
              autoFocus
              style={[styles.titleInput, { color: theme.text, borderColor: theme.border }]}
            />
          ) : (
            <Pressable onPress={() => setEditing(true)} accessibilityRole="button" accessibilityLabel="Edit day name">
              <ThemedText style={styles.title} numberOfLines={1}>
                {day?.title ?? 'Tasks'}
              </ThemedText>
            </Pressable>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More"
          hitSlop={12}
          onPress={() => setMenuOpen((open) => !open)}
          style={styles.iconBtn}>
          <SymbolView
            name={{ ios: 'ellipsis', android: 'more_vert', web: 'more_vert' }}
            size={22}
            tintColor={theme.text}
          />
        </Pressable>
      </View>
      {menuOpen ? (
        <Animated.View
          entering={FadeIn.duration(160)}
          style={[styles.menu, { backgroundColor: theme.card, borderColor: theme.border, top: insets.top + 58 }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMenuOpen(false);
              setEditing(true);
            }}
            style={styles.menuItem}>
            <ThemedText>Edit name</ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMenuOpen(false);
              setWordsOpen(true);
            }}
            style={styles.menuItem}>
            <ThemedText>Recordings</ThemedText>
          </Pressable>
          {closed ? null : (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMenuOpen(false);
                setAddOpen(true);
              }}
              style={styles.menuItem}>
              <ThemedText>Add another take</ThemedText>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMenuOpen(false);
              setDeleteError(null);
              setDeleteOpen(true);
            }}
            style={styles.menuItem}>
            <ThemedText style={{ color: '#C23B3B' }}>Delete day</ThemedText>
          </Pressable>
        </Animated.View>
      ) : null}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + Spacing.five }]}
        onScrollBeginDrag={() => setMenuOpen(false)}>
        {waiting ? (
          <PageWait />
        ) : day == null ? (
          <ThemedText themeColor="textSecondary">That day is not on this phone yet.</ThemedText>
        ) : (
          <Animated.View entering={FadeIn.duration(240)} style={styles.bodyInner}>
            <View style={[styles.progress, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <RoundProgress done={done} total={items.length} />
              <View style={styles.progressCopy}>
                <ThemedText type="smallBold">
                  {done} of {items.length} done
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {closed
                    ? 'This night is closed.'
                    : minutesPhrase(totalMinutes)
                      ? `${minutesPhrase(totalMinutes)} to finish`
                      : 'No time on these tasks yet'}
                </ThemedText>
              </View>
              {canReflect ? (
                <ReflectMic pulsing={inWindow} onPress={() => setReflectOpen(true)} />
              ) : null}
            </View>
            {closed ? (
              <View style={[styles.closed, { backgroundColor: theme.accent }]}>
                <ThemedText type="smallBold" style={styles.closedTitle}>
                  Night saved
                </ThemedText>
                <ThemedText type="small" style={styles.closedTitle}>
                  See you in the morning.
                </ThemedText>
              </View>
            ) : (
              <ReflectCue visible={inWindow && canReflect} onPress={() => setReflectOpen(true)} />
            )}
            {takes.map((take) => (
              <View key={take.key} style={styles.take}>
                {take.label ? (
                  <ThemedText type="smallBold" style={take.latest ? { color: theme.accent } : null}>
                    {take.label}
                  </ThemedText>
                ) : null}
                <TaskRows
                  items={take.items}
                  onToggle={
                    closed
                      ? undefined
                      : (item) =>
                          void markCommitment({
                            id: item.key,
                            status: item.status?.toUpperCase() === 'COMPLETED' ? 'PLANNED' : 'COMPLETED',
                          })
                  }
                  onRemove={closed ? undefined : (item) => void removeCommitment(item.key)}
                />
              </View>
            ))}
            {closed && (day.wins?.length ?? 0) > 0 ? (
              <View style={styles.take}>
                <ThemedText style={styles.happenedTitle}>Also happened</ThemedText>
                {day.wins.map((win) => (
                  <HappenedCard
                    key={win.id}
                    win={{ title: win.title, lifeArea: win.lifeArea }}
                  />
                ))}
              </View>
            ) : null}
          </Animated.View>
        )}
      </ScrollView>
      <DangerConfirm
        open={deleteOpen}
        title="Delete this day?"
        body={`${day?.title ?? day?.localDate ?? 'This day'} and every task on it will be gone.`}
        confirmLabel="Delete day"
        busy={deleteBusy}
        error={deleteError}
        onCancel={() => {
          if (!deleteBusy) {
            setDeleteOpen(false);
            setDeleteError(null);
          }
        }}
        onConfirm={() => void confirmDeleteDay()}
      />
      <DayWords open={wordsOpen} takes={transcripts} onClose={() => setWordsOpen(false)} />
      {day ? (
        <AddTakeSheet open={addOpen} dayDate={day.localDate} onClose={() => setAddOpen(false)} />
      ) : null}
      <EveningSheet day={reflectOpen && day ? day : null} onClose={() => setReflectOpen(false)} />
    </ThemedView>
  );
}

function ReflectMic({ pulsing, onPress }: { pulsing: boolean; onPress: () => void }) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (pulsing) {
      scale.value = withRepeat(
        withSequence(withTiming(1.08, { duration: 700 }), withTiming(1, { duration: 700 })),
        -1,
        true,
      );
      return;
    }
    scale.value = withSpring(1);
  }, [pulsing, scale]);

  const pulse = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={pulse}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reflect on this day"
        onPressIn={() => {
          scale.value = withSpring(0.92);
        }}
        onPressOut={() => {
          scale.value = pulsing
            ? withRepeat(
                withSequence(withTiming(1.08, { duration: 700 }), withTiming(1, { duration: 700 })),
                -1,
                true,
              )
            : withSpring(1);
        }}
        onPress={onPress}
        style={[styles.mic, { backgroundColor: theme.primary, shadowColor: theme.text }]}>
        <SymbolView
          name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
          size={22}
          tintColor={theme.primaryOn}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.one,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: FontFamily.semibold,
    fontSize: 20,
    lineHeight: 26,
  },
  titleInput: {
    fontFamily: FontFamily.semibold,
    fontSize: 20,
    lineHeight: 26,
    borderBottomWidth: 1,
    paddingVertical: 0,
  },
  menu: {
    position: 'absolute',
    right: Spacing.four,
    zIndex: 4,
    borderWidth: 1,
    borderRadius: 12,
    minWidth: 180,
    overflow: 'hidden',
  },
  menuItem: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  body: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  bodyInner: {
    gap: Spacing.three,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  progressCopy: {
    flex: 1,
    gap: 2,
  },
  mic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  take: {
    gap: Spacing.two,
  },
  happenedTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  closed: {
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    gap: 2,
  },
  closedTitle: {
    color: '#FFFFFF',
  },
});
