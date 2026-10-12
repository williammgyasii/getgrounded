import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { PlanBlue } from '@/constants/plan-theme';
import { PlanSurface } from '@/constants/plan-surface';

export function PlanGradientBackdrop({
  active,
  rich: _rich = false,
}: {
  active: boolean;
  rich?: boolean;
}) {
  const breathe = useSharedValue(0);

  useEffect(() => {
    if (active) {
      breathe.value = withRepeat(
        withSequence(withTiming(1, { duration: 1800 }), withTiming(0.35, { duration: 1800 })),
        -1,
        true,
      );
      return;
    }
    breathe.value = withTiming(0, { duration: 400 });
  }, [active, breathe]);

  const glow = useAnimatedStyle(() => ({
    opacity: 0.12 + breathe.value * 0.14,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: PlanSurface.bgDeep }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: PlanSurface.bg, opacity: 0.92 }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: PlanBlue.soft, opacity: 0.06 }]} />
      <Animated.View style={[styles.glow, glow]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: PlanBlue.primary, opacity: 0.08 }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: '-5%',
    left: '-25%',
    right: '-25%',
    height: '42%',
    borderRadius: 999,
    overflow: 'hidden',
  },
});
