import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { PillButton } from '@/components/auth/pill-button';
import { ThemedText } from '@/components/themed-text';
import { Typography, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const Danger = '#C23B3B';

export function DangerConfirm({
  open,
  title,
  body,
  confirmLabel = 'Delete',
  busy = false,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const theme = useTheme();

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable accessibilityRole="button" accessibilityLabel="Cancel" onPress={onCancel} style={styles.scrim}>
        <Pressable
          onPress={() => undefined}
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {body}
          </ThemedText>
          {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
          <View style={styles.actions}>
            <PillButton label="Keep it" variant="secondary" disabled={busy} onPress={onCancel} style={styles.btn} />
            <PillButton
              label={confirmLabel}
              loading={busy}
              onPress={onConfirm}
              style={[styles.btn, { backgroundColor: Danger, borderColor: Danger }]}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(36, 48, 86, 0.45)',
    paddingHorizontal: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    ...Typography.title, fontSize: 20, lineHeight: 26,
  },
  error: {
    color: Danger,
    ...Typography.caption,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  btn: {
    flex: 1,
    minHeight: 48,
  },
});
