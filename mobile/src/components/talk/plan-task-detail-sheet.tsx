import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { PlanSurface } from '@/constants/plan-surface';
import { PlanSheet } from '@/constants/plan-sheet';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { type DayRecord } from '@/lib/api';
import { clockLabelCompact } from '@/lib/clock';

export function PlanTaskDetailSheet({
  open,
  task,
  onClose,
}: {
  open: boolean;
  task: DayRecord['commitments'][number] | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const completed = task?.status?.toUpperCase() === 'COMPLETED';

  return (
    <Modal visible={open && task != null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close task" />
        <View style={[styles.card, { marginBottom: insets.bottom + Spacing.four }]}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>{task?.title ?? ''}</ThemedText>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={16} tintColor={PlanSheet.ink} />
            </Pressable>
          </View>
          <ThemedText style={styles.meta}>
            {task?.plannedStartMinute != null ? clockLabelCompact(task.plannedStartMinute) : 'Flexible time'}
            {task?.plannedDurationMinutes ? ` · ${task.plannedDurationMinutes} min` : ''}
          </ThemedText>
          <ThemedText style={styles.status}>{completed ? 'Done' : 'Up next on your plan'}</ThemedText>
          <View style={styles.comingRow}>
            <SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={16} tintColor={PlanSurface.accent} />
            <ThemedText type="bodySmall" style={styles.comingCopy}>
              Nevo deep-dives (recipes, prep questions) are coming — this is your task home for now.
            </ThemedText>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.three,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: PlanSheet.scrim,
  },
  card: {
    backgroundColor: PlanSheet.bg,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: PlanSheet.border,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  title: {
    ...Typography.titleMedium,
    color: PlanSheet.ink,
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PlanSheet.bgElevated,
    borderWidth: 1,
    borderColor: PlanSheet.border,
  },
  meta: {
    ...Typography.bodySmall,
    color: PlanSheet.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  status: {
    ...Typography.bodyMedium,
    color: PlanSurface.accent,
  },
  comingRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
    paddingTop: Spacing.one,
  },
  comingCopy: {
    flex: 1,
    color: PlanSheet.inkMuted,
    lineHeight: 20,
  },
});
