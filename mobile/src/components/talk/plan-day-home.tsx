import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, Layout, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { PlanActionsSheet } from '@/components/talk/plan-actions-sheet';
import { humanAiText } from '@/lib/human-text';
import { PlanConfirmSheet } from '@/components/talk/plan-confirm-sheet';
import { PlanTaskDetailSheet } from '@/components/talk/plan-task-detail-sheet';
import { PlanUpdateSheet } from '@/components/talk/plan-update-sheet';
import { syncNevoPresence } from '@/lib/nevo-sync';
import { PlanScreenShell, PlanTabBarInset } from '@/components/talk/plan-screen-shell';
import { ThemedText } from '@/components/themed-text';
import { PlanSurface } from '@/constants/plan-surface';
import { MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { type DayRecord } from '@/lib/api';
import { clockLabelCompact } from '@/lib/clock';
import { shortDayLabel } from '@/lib/day-tasks';
import { type PlanAssistant } from '@/lib/plan-assistant';
import { formatDayClock } from '@/lib/plan-day-vibe';
import { useMarkCommitmentMutation, useRemoveCommitmentMutation } from '@/store/api';

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
    <Animated.View
      entering={ZoomIn.duration(320)}
      style={styles.streakBadge}
      accessibilityLabel={`${streak} day streak`}>
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
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [clock, setClock] = useState(formatDayClock());
  const [markCommitment] = useMarkCommitmentMutation();
  const [removeCommitment] = useRemoveCommitmentMutation();
  const tasks = useMemo(() => sortTasks(day), [day]);

  useEffect(() => {
    const tick = setInterval(() => setClock(formatDayClock()), 30_000);
    return () => clearInterval(tick);
  }, []);

  const openMore = useCallback(() => setActionsOpen(true), []);

  async function toggleTask(id: string, completed: boolean) {
    const saved = await markCommitment({ id, status: completed ? 'COMPLETED' : 'PLANNED' }).unwrap();
    void syncNevoPresence(saved, streakDays);
    onRefresh();
  }

  const selectedTask = selectedTaskId ? tasks.find((row) => row.id === selectedTaskId) ?? null : null;

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
        <Animated.View entering={FadeInDown.duration(360)} style={styles.headerRow}>
          <StreakBadge streak={streakDays} />
          <View style={styles.headerCenter}>
            <ThemedText style={styles.liveClock}>{clock}</ThemedText>
            <ThemedText style={styles.shortDate}>{shortDayLabel(day.localDate)}</ThemedText>
          </View>
          <View style={styles.headerActions}>
            <ToggleIcon
              active={viewMode === 'list'}
              icon={{ ios: 'list.bullet', android: 'list', web: 'list' }}
              label="List view"
              onPress={() => setViewMode('list')}
            />
            <ToggleIcon
              active={viewMode === 'grid'}
              icon={{ ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' }}
              label="Grid view"
              onPress={() => setViewMode('grid')}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="More actions"
              hitSlop={8}
              onPress={openMore}
              style={styles.headerIconBtn}>
              <SymbolView
                name={{ ios: 'ellipsis.circle', android: 'more_horiz', web: 'more_horiz' }}
                size={22}
                tintColor={PlanSurface.text}
              />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(380)} style={styles.heroMinimal}>
          <ThemedText style={styles.dayTitle} numberOfLines={2}>
            {humanAiText(day.title) || 'Today'}
          </ThemedText>
          {day.coachNote?.trim() ? (
            <ThemedText style={styles.coachLine} numberOfLines={2}>
              {humanAiText(day.coachNote)}
            </ThemedText>
          ) : null}
        </Animated.View>

        {viewMode === 'list' ? (
          <View style={styles.stack}>
            {tasks.map((task, index) => (
              <TaskListRow
                key={task.id}
                task={task}
                index={index}
                onToggle={(completed) => void toggleTask(task.id, completed)}
                onOpen={() => setSelectedTaskId(task.id)}
                onDelete={() => setDeleteTaskId(task.id)}
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
                onOpen={() => setSelectedTaskId(task.id)}
              />
            ))}
          </View>
        )}

        {tasks.length === 0 ? (
          <ThemedText style={styles.empty}>No tasks yet. Tap ··· to plan again.</ThemedText>
        ) : null}
      </ScrollView>

      <PlanActionsSheet
        open={actionsOpen}
        day={day}
        onClose={() => setActionsOpen(false)}
        onAddUpdate={() => setUpdateOpen(true)}
        onPlanAgain={() => setPlanAgainOpen(true)}
        onDeleteDay={() => setDeleteOpen(true)}
      />

      <PlanTaskDetailSheet
        open={selectedTaskId != null}
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
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

      <PlanConfirmSheet
        open={deleteTaskId != null}
        title="Remove this task?"
        body={
          deleteTaskId
            ? tasks.find((row) => row.id === deleteTaskId)?.title ?? 'This task will be removed from today.'
            : ''
        }
        confirmLabel="Remove task"
        destructive
        onCancel={() => setDeleteTaskId(null)}
        onConfirm={() => {
          const id = deleteTaskId;
          setDeleteTaskId(null);
          if (id) {
            void removeCommitment(id)
              .unwrap()
              .then((saved) => {
                void syncNevoPresence(saved, streakDays);
                onRefresh();
              });
          }
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
  onOpen,
  onDelete,
}: {
  task: DayRecord['commitments'][number];
  index: number;
  onToggle: (completed: boolean) => void;
  onOpen: () => void;
  onDelete: () => void;
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
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.taskTitleTap}>
        <ThemedText style={[styles.taskTitle, completed && styles.taskDone]} numberOfLines={2}>
          {task.title}
        </ThemedText>
      </Pressable>
      <ThemedText style={styles.taskTime} numberOfLines={1}>
        {task.plannedStartMinute != null ? clockLabelCompact(task.plannedStartMinute) : '—'}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${task.title}`}
        hitSlop={8}
        onPress={onDelete}
        style={styles.taskDelete}>
        <SymbolView
          name={{ ios: 'trash', android: 'delete', web: 'delete' }}
          size={16}
          tintColor={PlanSurface.textDim}
        />
      </Pressable>
    </Animated.View>
  );
}

function TaskGridCell({
  task,
  index,
  onToggle,
  onOpen,
}: {
  task: DayRecord['commitments'][number];
  index: number;
  onToggle: (completed: boolean) => void;
  onOpen: () => void;
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
      <Pressable accessibilityRole="button" onPress={onOpen}>
        <ThemedText style={[styles.gridTitle, completed && styles.taskDone]} numberOfLines={3}>
          {task.title}
        </ThemedText>
      </Pressable>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  liveClock: {
    ...Typography.titleMedium,
    color: PlanSurface.text,
    fontVariant: ['tabular-nums'],
  },
  shortDate: {
    ...Typography.caption,
    color: PlanSurface.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    borderRadius: 12,
    backgroundColor: PlanSurface.card,
    borderWidth: 1,
    borderColor: PlanSurface.borderSoft,
  },
  headerIconBtn: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: PlanSurface.card,
    borderWidth: 1,
    borderColor: PlanSurface.borderSoft,
    minWidth: 56,
  },
  flames: {
    flexDirection: 'row',
    gap: 2,
    height: 18,
    alignItems: 'center',
  },
  streakValue: {
    ...Typography.titleMedium,
    color: PlanSurface.fire,
    fontVariant: ['tabular-nums'],
  },
  heroMinimal: {
    gap: 6,
    paddingBottom: Spacing.one,
  },
  dayTitle: {
    ...Typography.headline,
    color: PlanSurface.text,
  },
  coachLine: {
    ...Typography.bodySmall,
    color: PlanSurface.textMuted,
    lineHeight: 20,
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
  taskTitleTap: {
    flex: 1,
    justifyContent: 'center',
  },
  taskTitle: {
    ...Typography.body,
    color: PlanSurface.text,
    lineHeight: 24,
  },
  taskDelete: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTime: {
    ...Typography.caption,
    color: PlanSurface.textMuted,
    minWidth: 64,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
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
    ...Typography.caption,
    color: PlanSurface.textMuted,
    alignSelf: 'flex-end',
    fontVariant: ['tabular-nums'],
  },
  empty: {
    ...Typography.bodySmall,
    color: PlanSurface.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
});
