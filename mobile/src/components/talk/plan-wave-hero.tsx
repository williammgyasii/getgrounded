import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PlanBlue } from '@/constants/plan-theme';

function HeroBar({ level }: { level: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    height: 24 + level.value * 96,
    opacity: 0.45 + level.value * 0.55,
  }));

  return (
    <Animated.View style={[styles.bar, style]}>
      <View style={styles.barFill} />
    </Animated.View>
  );
}

export function PlanWaveHero({
  active,
  metering,
}: {
  active: boolean;
  metering?: number;
}) {
  const a = useSharedValue(0.2);
  const b = useSharedValue(0.2);
  const c = useSharedValue(0.2);
  const d = useSharedValue(0.2);
  const e = useSharedValue(0.2);
  const f = useSharedValue(0.2);
  const g = useSharedValue(0.2);
  const levels = [a, b, c, d, e, f, g];

  useEffect(() => {
    if (!active) {
      levels.forEach((bar) => {
        bar.value = withTiming(0.12, { duration: 280 });
      });
      return;
    }

    const normalized = metering == null ? 0.5 : Math.min(1, Math.max(0.15, (metering + 50) / 50));
    levels.forEach((bar, index) => {
      const center = (levels.length - 1) / 2;
      const offset = 1 - Math.abs(index - center) / center;
      bar.value = withTiming(0.18 + normalized * offset * 0.72, { duration: 90 });
    });
  }, [active, metering, a, b, c, d, e, f, g, levels]);

  return (
    <View style={styles.stage} accessibilityLabel={active ? 'Listening' : 'Ready to record'}>
      {levels.map((level, index) => (
        <HeroBar key={index} level={level} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 160,
    paddingHorizontal: 8,
  },
  bar: {
    width: 6,
    borderRadius: 3,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    flex: 1,
    borderRadius: 3,
    backgroundColor: PlanBlue.primary,
  },
});
