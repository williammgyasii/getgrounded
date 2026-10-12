import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, Layout, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { PlanActionsSheet } from '@/components/talk/plan-actions-sheet';
import { PlanAssistantAvatar } from '@/components/talk/plan-assistant-avatar';
import { humanAiText } from '@/lib/human-text';
import { PlanConfirmSheet } from '@/components/talk/plan-confirm-sheet';
import { PlanUpdateSheet } from '@/components/talk/plan-update-sheet';
import { PlanScreenShell, PlanTabBarInset } from '@/components/talk/plan-screen-shell';
import { ThemedText } from '@/components/themed-text';
import { PlanSurface } from '@/constants/plan-surface';
import { MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { type DayRecord } from '@/lib/api';
import { clockLabelCompact } from '@/lib/clock';
import { longDayLabel } from '@/lib/day-tasks';
import { type PlanAssistant } from '@/lib/plan-assistant';
import { formatDayClock, planDayVibe } from '@/lib/plan-day-vibe';
import { useMarkCommitmentMutation } from '@/store/api';

function sortTasks(day: DayRecord) {
  return [...day.commitments]
    .filter((item) => item.title.trim().length > 0)
    .sort((left, right) => {
      const leftStart = left.plannedStartMinute;
      const rightStart = right.plannedStartMinute;
      if (leftStart == null && rightStart == null) {
        return 0;
      }
      if (leftStart == null) {
        return 1;
      }
      if (rightStart == null) {
        return -1;
      }
      return leftStart - rightStart;
    });
}

function StreakBadge({ streak }: { streak: number }) {
  const flames = Math.min(3, Math.max(0, streak));
  return (
    <Animated.View entering={ZoomIn.duration(320)} style={styles.streakBadge}>
      <View style={styles.flames}>
        {flames === 0 ? (
          <SymbolView name={{ ios: 'flame', android: 'local_fire_department', web: 'local_fire_department' }} size={18} tintColor={PlanSurface.textDim} />
        ) : (
          Array.from({ length: flames }).map((_, index) => (
            <SymbolView
              key={index}
              name={{ ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' }}
              size={16}
              tintColor={PlanSurface.fire}
            />
          ))
        )}
      </View>
      <ThemedText style={styles.streakValue}>{streak}</ThemedText>
      <ThemedText style={styles.streakLabel}>day streak</ThemedText>
    </Animated.View>
  );
}

type ViewMode = 'list' | 'grid';

export function PlanDayHome({
  day,
  streakDays,
  assistant,
  onRefresh,
  onPlanAgain,
  onDeleteDay,
}: {
  day: DayRecord;
  streakDays: number;
  assistant: PlanAssistant;
  onRefresh: () => void;
  onPlanAgain: () => void;
  onDeleteDay: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [actionsOpen, setActionsOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [planAgainOpen, setPlanAgainOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [clock, setClock] = useState(formatDayClock());
  const [markCommitment] = useMarkCommitmentMutation();
  const tasks = useMemo(() => sortTasks(day), [day]);
  const vibe = useMemo(() => planDayVibe(), []);

  useEffect(() => {
    const tick = setInterval(() => setClock(formatDayClock()), 30_000);
    return () => clearInterval(tick);
  }, []);

  const openMore = useCallback(() => setActionsOpen(true), []);

  async function toggleTask(id: string, completed: boolean) {
    await markCommitment({ id, status: completed ? 'COMPLETED' : 'PLANNED' });
  }

  return (
    <PlanScreenShell>
      <ScrollView
        contentContainerStyle={[
          styles.page,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + PlanTabBarInset,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(360)} style={styles.topBar}>
          <View style={styles.vibeChip}>
            <SymbolView name={{ ios: 'clock', android: 'schedule', web: 'schedule' }} size={14} tintColor={PlanSurface.accent} />
            <ThemedText style={styles.vibeClock}>{clock}</ThemedText>
            <ThemedText style={styles.vibeDot}>·</ThemedText>
            <ThemedText style={styles.vibeToday}>Today only</ThemedText>
          </View>
          <StreakBadge streak={streakDays} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(380)} style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <ThemedText style={styles.kicker}>{longDayLabel(day.localDate)}</ThemedText>
              <ThemedText style={styles.title}>
                {humanAiText(day.title) || 'Your plan'}
              </ThemedText>
            </View>
            <PlanAssistantAvatar assistant={assistant} size="md" />
          </View>
          <ThemedText style={styles.vibeHeadline}>{humanAiText(vibe.headline)}</ThemedText>
          <ThemedText style={styles.vibeSub}>{humanAiText(vibe.sub)}</ThemedText>
          {day.coachNote?.trim() ? (
            <View style={styles.museNote}>
              <ThemedText style={styles.museNoteText}>{humanAiText(day.coachNote)}</ThemedText>
            </View>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(380)} style={styles.toolbar}>
          <ThemedText style={styles.taskCount}>
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </ThemedText>
          <View style={styles.viewToggle}>
            <ToggleIcon
              active={viewMode === 'list'}
              icon={{ ios: 'list.bullet', android: 'list', web: 'list' }}
              label="List"
              onPress={() => setViewMode('list')}
            />
            <ToggleIcon
              active={viewMode === 'grid'}
              icon={{ ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' }}
              label="Grid"
              onPress={() => setViewMode('grid')}
            />
          </View>
        </Animated.View>

        {viewMode === 'list' ? (
          <View style={styles.stack}>
            {tasks.map((task, index) => (
              <TaskListRow
                key={task.id}
                task={task}
                index={index}
                onToggle={(completed) => void toggleTask(task.id, completed)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.grid}>
            {tasks.map((task, index) => (
              <TaskGridCell
                key={task.id}
                task={task}
                index={index}
                onToggle={(completed) => void toggleTask(task.id, completed)}
              />
            ))}
          </View>
        )}

        {tasks.length === 0 ? (
          <ThemedText style={styles.empty}>No tasks yet — use More to plan again.</ThemedText>
        ) : null}

        <Pressable accessibilityRole="button" onPress={openMore} style={styles.moreBtn}>
          <ThemedText type="bodyMedium" style={{ color: PlanSurface.text }}>
            More
          </ThemedText>
          <SymbolView
            name={{ ios: 'ellipsis.circle', android: 'more_horiz', web: 'more_horiz' }}
            size={20}
            tintColor={PlanSurface.accent}
          />
        </Pressable>
      </ScrollView>

      <PlanActionsSheet
        open={actionsOpen}
        day={day}
        onClose={() => setActionsOpen(false)}
        onAddUpdate={() => setUpdateOpen(true)}
        onPlanAgain={() => setPlanAgainOpen(true)}
        onDeleteDay={() => setDeleteOpen(true)}
      />

      <PlanUpdateSheet
        open={updateOpen}
        day={day}
        assistant={assistant}
        onClose={() => setUpdateOpen(false)}
        onSaved={onRefresh}
      />

      <PlanConfirmSheet
        open={deleteOpen}
        title="Delete this day?"
        body={`${day.title ?? day.localDate} and every task on it will be gone.`}
        confirmLabel="Delete day"
        destructive
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false);
          onDeleteDay();
        }}
      />

      <PlanConfirmSheet
        open={planAgainOpen}
        title="Plan again?"
        body="This clears today's plan so you can record a fresh one."
        confirmLabel="Clear & replan"
        onCancel={() => setPlanAgainOpen(false)}
        onConfirm={() => {
          setPlanAgainOpen(false);
          onPlanAgain();
        }}
      />
    </PlanScreenShell>
  );
}

function ToggleIcon({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: { ios: string; android: string; web: string };
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.toggleBtn, active && styles.toggleBtnActive]}>
      <SymbolView name={icon} size={18} tintColor={active ? PlanSurface.text : PlanSurface.textDim} />
    </Pressable>
  );
}

function TaskListRow({
  task,
  index,
  onToggle,
}: {
  task: DayRecord['commitments'][number];
  index: number;
  onToggle: (completed: boolean) => void;
}) {
  const completed = task.status?.toUpperCase() === 'COMPLETED';
  return (
    <Animated.View
      entering={FadeInDown.delay(80 + index * 40).duration(300)}
      layout={Layout.springify()}
      style={styles.taskRow}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        onPress={() => onToggle(!completed)}
        style={[
          styles.tick,
          {
            backgroundColor: completed ? PlanSurface.accent : 'transparent',
            borderColor: completed ? PlanSurface.accent : PlanSurface.border,
          },
        ]}>
        {completed ? (
          <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={14} tintColor={PlanSurface.bgDeep} />
        ) : null}
      </Pressable>
      <ThemedText style={[styles.taskTitle, completed && styles.taskDone]} numberOfLines={2}>
        {task.title}
      </ThemedText>
      <ThemedText style={styles.taskTime} numberOfLines={1}>
        {task.plannedStartMinute != null ? clockLabelCompact(task.plannedStartMinute) : '—'}
      </ThemedText>
    </Animated.View>
  );
}

function TaskGridCell({
  task,
  index,
  onToggle,
}: {
  task: DayRecord['commitments'][number];
  index: number;
  onToggle: (completed: boolean) => void;
}) {
  const completed = task.status?.toUpperCase() === 'COMPLETED';
  return (
    <Animated.View entering={FadeInDown.delay(80 + index * 35).duration(280)} style={styles.gridCell}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        onPress={() => onToggle(!completed)}
        style={[
          styles.gridTick,
          {
            backgroundColor: completed ? PlanSurface.accent : 'transparent',
            borderColor: completed ? PlanSurface.accent : PlanSurface.border,
          },
        ]}>
        {completed ? (
          <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={12} tintColor={PlanSurface.bgDeep} />
        ) : null}
      </Pressable>
      <ThemedText style={[styles.gridTitle, completed && styles.taskDone]} numberOfLines={3}>
        {task.title}
      </ThemedText>
      <ThemedText style={styles.gridTime}>
        {task.plannedStartMinute != null ? clockLabelCompact(task.plannedStartMinute) : '—'}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  vibeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: PlanSurface.card,
    borderWidth: 1,
    borderColor: PlanSurface.borderSoft,
  },
  vibeClock: {
    ...Typography.caption,
    color: PlanSurface.text,
  },
  vibeDot: {
    color: PlanSurface.textDim,
  },
  vibeToday: {
    ...Typography.micro,
    color: PlanSurface.textMuted,
    letterSpacing: 0.3,
  },
  streakBadge: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: PlanSurface.card,
    borderWidth: 1,
    borderColor: PlanSurface.borderSoft,
    minWidth: 72,
  },
  flames: {
    flexDirection: 'row',
    gap: 2,
    height: 18,
    alignItems: 'center',
  },
  streakValue: {
    ...Typography.stat,
    color: PlanSurface.fire,
    lineHeight: 28,
  },
  streakLabel: {
    ...Typography.micro,
    color: PlanSurface.textMuted,
  },
  hero: {
    gap: 8,
    paddingVertical: Spacing.one,
  },
  kicker: {
    ...Typography.caption,
    color: PlanSurface.accent,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    ...Typography.headline,
    color: PlanSurface.text,
  },
  vibeHeadline: {
    ...Typography.bodyMedium,
    color: PlanSurface.text,
    marginTop: 4,
  },
  vibeSub: {
    ...Typography.bodySmall,
    color: PlanSurface.textMuted,
    lineHeight: 22,
  },
  museNote: {
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PlanSurface.borderSoft,
    backgroundColor: PlanSurface.card,
  },
  museNoteText: {
    ...Typography.bodySmall,
    color: PlanSurface.text,
    lineHeight: 22,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskCount: {
    ...Typography.caption,
    color: PlanSurface.textMuted,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 12,
    backgroundColor: PlanSurface.card,
    borderWidth: 1,
    borderColor: PlanSurface.borderSoft,
  },
  toggleBtn: {
    width: 36,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: PlanSurface.cardHover,
  },
  stack: {
    gap: 4,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PlanSurface.borderSoft,
  },
  tick: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: {
    ...Typography.body,
    flex: 1,
    color: PlanSurface.text,
    lineHeight: 24,
  },
  taskTime: {
    ...Typography.micro,
    color: PlanSurface.textMuted,
    minWidth: 40,
    textAlign: 'right',
  },
  taskDone: {
    opacity: 0.45,
    textDecorationLine: 'line-through',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCell: {
    width: '48%',
    minHeight: 108,
    padding: 12,
    borderRadius: 14,
    backgroundColor: PlanSurface.card,
    borderWidth: 1,
    borderColor: PlanSurface.borderSoft,
    gap: 8,
  },
  gridTick: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTitle: {
    ...Typography.bodySmall,
    color: PlanSurface.text,
    flex: 1,
  },
  gridTime: {
    ...Typography.micro,
    color: PlanSurface.textMuted,
    alignSelf: 'flex-end',
  },
  empty: {
    ...Typography.bodySmall,
    color: PlanSurface.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  moreBtn: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: PlanSurface.border,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: PlanSurface.card,
    marginTop: Spacing.one,
  },
});
