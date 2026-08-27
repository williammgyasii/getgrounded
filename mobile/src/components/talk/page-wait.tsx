import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function PageWait() {
  const theme = useTheme();
  return (
    <View style={styles.wait}>
      <ActivityIndicator size="large" color={theme.primary} />
      <ThemedText style={styles.copy}>One moment</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wait: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.six,
  },
  copy: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
  },
});
