import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PlanBlue } from '@/constants/plan-theme';
import { PlanSheet } from '@/constants/plan-sheet';
import { Radius, Spacing, Typography } from '@/constants/theme';

export function PlanConfirmSheet({
  open,
  title,
  body,
  confirmLabel,
  destructive,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.scrim} accessibilityLabel="Cancel" onPress={onCancel}>
        <Pressable onPress={() => undefined} style={[styles.card, { marginBottom: insets.bottom + Spacing.four }]}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={styles.body}>{body}</ThemedText>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onCancel} style={styles.secondary}>
              <ThemedText type="bodyMedium" style={{ color: PlanSheet.ink }}>
                Keep it
              </ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={[styles.primary, destructive && styles.primaryDanger]}>
              <ThemedText type="bodyMedium" style={{ color: PlanBlue.on }}>
                {confirmLabel}
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: PlanSheet.scrim,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.four,
  },
  card: {
    backgroundColor: PlanSheet.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PlanSheet.border,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    ...Typography.title,
    color: PlanSheet.ink,
  },
  body: {
    ...Typography.bodySmall,
    color: PlanSheet.inkMuted,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  secondary: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: PlanSheet.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PlanSheet.bgAlt,
  },
  primary: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.button,
    backgroundColor: PlanBlue.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDanger: {
    backgroundColor: '#C23B3B',
  },
});
