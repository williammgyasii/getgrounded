import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function RoundProgress({
  done,
  total,
}: {
  done: number;
  total: number;
}) {
  const theme = useTheme();
  const percent = total === 0 ? 0 : Math.min(1, done / total);
  const size = 72;
  const stroke = 8;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: stroke,
            borderColor: theme.backgroundElement,
            borderTopColor: percent > 0 ? theme.accent : theme.backgroundElement,
            borderRightColor: percent > 0.25 ? theme.accent : theme.backgroundElement,
            borderBottomColor: percent > 0.5 ? theme.accent : theme.backgroundElement,
            borderLeftColor: percent > 0.75 ? theme.accent : theme.backgroundElement,
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
      <View style={styles.center}>
        <ThemedText style={styles.value}>
          {done}/{total}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    ...Typography.bodyMedium, fontFamily: Typography.title.fontFamily,
    lineHeight: 20,
  },
});
