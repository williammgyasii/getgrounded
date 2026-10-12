import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { type WordTake } from '@/components/talk/day-words';
import { PlanInlineTranscripts } from '@/components/talk/plan-inline-transcripts';
import { ThemedText } from '@/components/themed-text';
import { PlanBlue } from '@/constants/plan-theme';
import { PlanSheet } from '@/constants/plan-sheet';
import { Spacing, Typography } from '@/constants/theme';
import { type DayRecord } from '@/lib/api';
import { transcriptsForDay } from '@/lib/plan-clips';

type PlanActionsSheetProps = {
  open: boolean;
  day: DayRecord;
  onClose: () => void;
  onAddUpdate: () => void;
  onPlanAgain: () => void;
  onDeleteDay: () => void;
};

export function PlanActionsSheet({
  open,
  day,
  onClose,
  onAddUpdate,
  onPlanAgain,
  onDeleteDay,
}: PlanActionsSheetProps) {
  const insets = useSafeAreaInsets();
  const [takes, setTakes] = useState<WordTake[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }
    void transcriptsForDay(day).then(setTakes);
  }, [open, day]);

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.scrimTap} accessibilityLabel="Dismiss" onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.three, maxHeight: '82%' }]}>
          <View style={styles.sheetHeader}>
            <View style={styles.grabber} />
            <View style={styles.titleRow}>
              <ThemedText style={styles.title}>More</ThemedText>
              <Pressable accessibilityRole="button" onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={16} tintColor={PlanSheet.ink} />
              </Pressable>
            </View>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <ThemedText style={styles.sectionLabel}>Transcripts & recordings</ThemedText>
            <PlanInlineTranscripts takes={takes} light />

            <ThemedText style={styles.sectionLabel}>Actions</ThemedText>
            <SheetAction
              icon={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
              label="Add an update"
              onPress={() => {
                onClose();
                onAddUpdate();
              }}
            />
            <SheetAction
              icon={{ ios: 'arrow.counterclockwise', android: 'refresh', web: 'refresh' }}
              label="Plan again"
              hint="Fresh start — record a new plan"
              onPress={() => {
                onClose();
                onPlanAgain();
              }}
            />
            <SheetAction
              destructive
              icon={{ ios: 'trash', android: 'delete', web: 'delete' }}
              label="Delete this day"
              onPress={() => {
                onClose();
                onDeleteDay();
              }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SheetAction({
  icon,
  label,
  hint,
  destructive,
  onPress,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  hint?: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  const ink = destructive ? '#C23B3B' : PlanSheet.ink;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.actionRow}>
      <SymbolView name={icon} size={20} tintColor={destructive ? '#C23B3B' : PlanBlue.primary} />
      <View style={styles.actionCopy}>
        <ThemedText type="bodyMedium" style={{ color: ink }}>
          {label}
        </ThemedText>
        {hint ? (
          <ThemedText type="caption" style={{ color: PlanSheet.inkMuted }}>
            {hint}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrimTap: {
    ...StyleSheet.absoluteFill,
    backgroundColor: PlanSheet.scrim,
  },
  sheet: {
    backgroundColor: PlanSheet.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: PlanSheet.border,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  sheetHeader: {
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: PlanSheet.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  title: { ...Typography.title, color: PlanSheet.ink },
  sectionLabel: {
    ...Typography.caption,
    color: PlanBlue.mid,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: Spacing.one,
    marginTop: Spacing.two,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PlanBlue.soft,
  },
  actionCopy: { flex: 1, gap: 2 },
});
