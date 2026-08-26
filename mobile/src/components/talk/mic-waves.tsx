import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

export function MicWaves({
  metering,
  active,
  compact = false,
  color,
}: {
  metering?: number;
  active: boolean;
  compact?: boolean;
  color?: string;
}) {
  const theme = useTheme();
  const barColor = color ?? theme.primaryOn;
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

  const max = compact ? 18 : 36;
  const min = compact ? 8 : 12;

  return (
    <View style={[styles.row, compact ? styles.compactRow : null]}>
      <WaveBar level={a} color={barColor} min={min} max={max} />
      <WaveBar level={b} color={barColor} min={min} max={max} />
      <WaveBar level={c} color={barColor} min={min} max={max} />
      <WaveBar level={d} color={barColor} min={min} max={max} />
      <WaveBar level={e} color={barColor} min={min} max={max} />
    </View>
  );
}

function WaveBar({
  level,
  color,
  min,
  max,
}: {
  level: SharedValue<number>;
  color: string;
  min: number;
  max: number;
}) {
  const style = useAnimatedStyle(() => ({
    height: min + level.value * max,
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
  compactRow: {
    gap: 4,
    height: 28,
    alignItems: 'center',
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});
