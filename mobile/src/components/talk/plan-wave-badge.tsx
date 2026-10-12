import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { PlanBlue } from '@/constants/plan-theme';

function MiniBar({ level }: { level: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    height: 4 + level.value * 14,
    opacity: 0.5 + level.value * 0.5,
  }));

  return <Animated.View style={[styles.bar, style]} />;
}

export function PlanWaveBadge({ speaking, alive = false }: { speaking: boolean; alive?: boolean }) {
  const a = useSharedValue(0.2);
  const b = useSharedValue(0.35);
  const c = useSharedValue(0.55);
  const d = useSharedValue(0.35);
  const e = useSharedValue(0.2);
  const bars = [a, b, c, d, e];
  const on = speaking || alive;

  useEffect(() => {
    if (!on) {
      bars.forEach((bar) => {
        bar.value = withTiming(0.15, { duration: 200 });
      });
      return;
    }

    const scale = speaking ? 1 : 0.55;
    bars.forEach((bar, index) => {
      const delay = index * 80;
      bar.value = withRepeat(
        withSequence(
          withTiming((0.85 - index * 0.08) * scale, { duration: (speaking ? 280 : 420) + delay }),
          withTiming(0.2, { duration: (speaking ? 280 : 420) + delay }),
        ),
        -1,
        true,
      );
    });
  }, [on, speaking, a, b, c, d, e]);

  return (
    <View style={styles.wrap} accessibilityLabel={speaking ? 'Nevo speaking' : 'Listen to Nevo'}>
      {bars.map((level, index) => (
        <MiniBar key={index} level={level} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
    height: 22,
    width: 36,
    overflow: 'hidden',
  },
  bar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: PlanBlue.primary,
  },
});
