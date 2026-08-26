import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AddTakeSheet } from '@/components/talk/add-take-sheet';
import { DangerConfirm } from '@/components/talk/danger-confirm';
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
  const { data: history = [] } = useGetHistoryQuery(timezone);
  const { data: desk } = useGetDeskQuery(timezone);
  const day = id ? findDay(id, history, desk) : null;
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
  const clips = (day?.clips ?? [])
    .filter((clip) => clip.transcript.trim().length > 0)
    .map((clip, index) => ({
      id: clip.id,
      transcript: clip.transcript,
      label: clip.kind === 'EVENING_REFLECTION' ? 'Evening' : `Take ${index + 1}`,
      playable: clip.playable === true,
    }));
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
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMenuOpen(false);
              setAddOpen(true);
            }}
            style={styles.menuItem}>
            <ThemedText>Add another take</ThemedText>
          </Pressable>
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
      <ScrollView contentContainerStyle={styles.body} onScrollBeginDrag={() => setMenuOpen(false)}>
        {day == null ? (
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
                  {minutesPhrase(totalMinutes)
                    ? `${minutesPhrase(totalMinutes)} to finish`
                    : 'No time on these tasks yet'}
                </ThemedText>
              </View>
            </View>
            {takes.map((take) => (
              <View key={take.key} style={styles.take}>
                {take.label ? (
                  <ThemedText type="smallBold" style={take.latest ? { color: theme.accent } : null}>
                    {take.label}
                  </ThemedText>
                ) : null}
                <TaskRows
                  items={take.items}
                  onToggle={(item) =>
                    void markCommitment({
                      id: item.key,
                      status: item.status?.toUpperCase() === 'COMPLETED' ? 'PLANNED' : 'COMPLETED',
                    })
                  }
                  onRemove={(item) => void removeCommitment(item.key)}
                />
              </View>
            ))}
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
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
  take: {
    gap: Spacing.two,
  },
});
