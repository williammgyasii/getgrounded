import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

export function MicWaves({ metering, active }: { metering?: number; active: boolean }) {
  const theme = useTheme();
  const a = useSharedValue(0.2);
  const b = useSharedValue(0.2);
  const c = useSharedValue(0.2);
  const d = useSharedValue(0.2);
  const e = useSharedValue(0.2);

  useEffect(() => {
    const bars = [a, b, c, d, e];
    if (!active) {
      bars.forEach((bar) => {
        bar.value = withTiming(0.15, { duration: 180 });
      });
      return;
    }

    const normalized = metering == null ? 0.45 : Math.min(1, Math.max(0, (metering + 50) / 50));
    bars.forEach((bar, index) => {
      const offset = 1 - Math.abs(index - 2) / 2;
      bar.value = withTiming(0.2 + normalized * offset, { duration: 90 });
    });
  }, [a, b, c, d, e, active, metering]);

  return (
    <View style={styles.row}>
      <WaveBar level={a} color={theme.primary} />
      <WaveBar level={b} color={theme.primary} />
      <WaveBar level={c} color={theme.primary} />
      <WaveBar level={d} color={theme.primary} />
      <WaveBar level={e} color={theme.primary} />
    </View>
  );
}

function WaveBar({
  level,
  color,
}: {
  level: SharedValue<number>;
  color: string;
}) {
  const style = useAnimatedStyle(() => ({
    height: 12 + level.value * 36,
    backgroundColor: color,
  }));

  return <Animated.View style={[styles.bar, style]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    height: 52,
  },
  bar: {
    width: 8,
    borderRadius: 4,
  },
});
