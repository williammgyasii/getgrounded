import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ReflectCue({
  visible,
  onPress,
}: {
  visible: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  if (!visible) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="It's your reflect window. Close the night."
      onPress={onPress}
      style={[styles.cue, { backgroundColor: theme.primary }]}>
      <ThemedText type="smallBold" style={styles.on}>
        It's your reflect window
      </ThemedText>
      <ThemedText type="small" style={styles.on}>
        Close the night when you're ready.
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cue: {
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    gap: 2,
  },
  on: {
    color: '#FFFFFF',
  },
});
