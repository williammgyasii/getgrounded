import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function BusyLock({ message }: { message: string | null }) {
  const theme = useTheme();

  return (
    <Modal
      visible={message != null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => undefined}>
      <View style={styles.lock} pointerEvents="auto">
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
            },
          ]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={styles.message}>{message}</ThemedText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  lock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28, 25, 21, 0.28)',
    paddingHorizontal: Spacing.five,
  },
  card: {
    minWidth: 168,
    maxWidth: 240,
    borderRadius: Radius.card,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
  },
  message: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
