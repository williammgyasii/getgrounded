import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PlanBlue } from '@/constants/plan-theme';
import { PlanSheet } from '@/constants/plan-sheet';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { canDrawOverlays, openOverlaySettings } from '@/lib/nevo-bubble-bridge';
import { markOptInSeen, saveBubbleEnabled } from '@/lib/nevo-settings';

export function NevoBubbleOptInSheet({
  open,
  onClose,
  onEnabled,
}: {
  open: boolean;
  onClose: () => void;
  onEnabled: () => void;
}) {
  const insets = useSafeAreaInsets();

  async function enable() {
    await saveBubbleEnabled(true);
    await markOptInSeen();
    const allowed = await canDrawOverlays();
    if (!allowed) {
      await openOverlaySettings();
    }
    onEnabled();
    onClose();
  }

  async function skip() {
    await markOptInSeen();
    onClose();
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={skip}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.three }]}>
          <ThemedText style={styles.title}>Keep Nevo nearby?</ThemedText>
          <ThemedText style={styles.body}>
            On Android, Nevo can show a small draggable chip on top of whatever app you are in (not a home-screen
            widget). You will need Display over other apps — then look near the top-right of your screen. Tap the chip
            to jump back to your plan. Heads-up notifications still work if you skip this.
          </ThemedText>
          <Pressable accessibilityRole="button" onPress={() => void enable()} style={styles.primary}>
            <ThemedText style={styles.primaryLabel}>Turn on Nevo bubble</ThemedText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => void skip()} style={styles.ghost}>
            <ThemedText style={styles.ghostLabel}>Not now</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: PlanSheet.scrim,
  },
  sheet: {
    backgroundColor: PlanSheet.bg,
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    ...Typography.titleMedium,
    color: PlanSheet.ink,
  },
  body: {
    ...Typography.bodySmall,
    color: PlanSheet.inkMuted,
    lineHeight: 22,
  },
  primary: {
    backgroundColor: PlanBlue.primary,
    borderRadius: Radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryLabel: {
    ...Typography.bodyMedium,
    color: PlanBlue.on,
    fontWeight: '600',
  },
  ghost: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  ghostLabel: {
    ...Typography.bodyMedium,
    color: PlanSheet.inkMuted,
  },
});
