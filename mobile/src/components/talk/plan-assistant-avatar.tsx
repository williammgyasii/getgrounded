import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { PlanSheet } from '@/constants/plan-sheet';
import { PlanSurface } from '@/constants/plan-surface';
import { Typography } from '@/constants/theme';
import { type PlanAssistant } from '@/lib/plan-assistant';

const NevoImage = require('@/assets/muse/muse-coach.jpg');

export type NevoPresence = 'idle' | 'listening' | 'thinking' | 'speaking';

export function PlanAssistantAvatar({
  assistant,
  size = 'lg',
  listening,
  presence = 'idle',
  interactive = false,
  minimal = false,
  onPress,
}: {
  assistant: PlanAssistant;
  size?: 'md' | 'lg';
  listening?: boolean;
  presence?: NevoPresence;
  interactive?: boolean;
  /** Sheet / inline — no halo blob, subtle motion only */
  minimal?: boolean;
  onPress?: () => void;
}) {
  const mode: NevoPresence = listening ? 'listening' : presence;
  const dim = size === 'lg' ? 88 : 56;

  const breathe = useSharedValue(1);
  const bob = useSharedValue(0);
  const tilt = useSharedValue(0);
  const ring = useSharedValue(0.5);
  const press = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(breathe);
    cancelAnimation(bob);
    cancelAnimation(tilt);
    cancelAnimation(ring);

    const slow = minimal ? 2600 : 2200;
    breathe.value = withRepeat(
      withSequence(
        withTiming(minimal ? 1.02 : mode === 'speaking' ? 1.04 : 1.03, {
          duration: mode === 'listening' ? 800 : slow,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(1, { duration: mode === 'listening' ? 800 : slow, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    const bobAmount = minimal ? 2 : 3;
    bob.value = withRepeat(
      withSequence(withTiming(-bobAmount, { duration: mode === 'speaking' ? 520 : 1800 }), withTiming(0, { duration: mode === 'speaking' ? 520 : 1800 })),
      -1,
      true,
    );
    if (mode === 'listening') {
      tilt.value = withRepeat(
        withSequence(withTiming(minimal ? -1.5 : -2, { duration: 320 }), withTiming(minimal ? 1.5 : 2, { duration: 320 })),
        -1,
        true,
      );
    } else if (mode === 'speaking') {
      tilt.value = withRepeat(
        withSequence(withTiming(-1, { duration: 280 }), withTiming(1, { duration: 280 })),
        -1,
        true,
      );
    } else {
      tilt.value = withTiming(0, { duration: 200 });
    }

    if (mode === 'listening') {
      ring.value = withRepeat(
        withSequence(withTiming(1, { duration: 500 }), withTiming(0.35, { duration: 500 })),
        -1,
        true,
      );
    } else if (mode === 'speaking' || mode === 'thinking') {
      ring.value = withRepeat(
        withSequence(withTiming(0.9, { duration: mode === 'speaking' ? 340 : 900 }), withTiming(0.4, { duration: mode === 'speaking' ? 340 : 900 })),
        -1,
        true,
      );
    } else {
      ring.value = withTiming(0.45, { duration: 400 });
    }
  }, [mode, bob, breathe, minimal, ring, tilt]);

  const body = useAnimatedStyle(() => ({
    transform: [
      { translateY: bob.value },
      { rotate: `${tilt.value}deg` },
      { scale: breathe.value * press.value },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + ring.value * 0.45,
    transform: [{ scale: 0.98 + ring.value * 0.06 }],
  }));

  const statusLabel =
    mode === 'listening'
      ? 'Listening…'
      : mode === 'thinking'
        ? 'Thinking…'
        : mode === 'speaking'
          ? 'Speaking…'
          : interactive
            ? 'Tap to say hi'
            : null;

  const core = (
    <View style={[styles.wrap, minimal && styles.wrapMinimal]}>
      {mode === 'listening' || mode === 'speaking' || mode === 'thinking' ? (
        <Animated.View
          style={[
            styles.listenRing,
            {
              width: dim + (minimal ? 8 : 12),
              height: dim + (minimal ? 8 : 12),
              borderRadius: (dim + (minimal ? 8 : 12)) / 2,
              borderColor: mode === 'thinking' ? PlanSheet.inkMuted : PlanSheet.accent,
            },
            ringStyle,
          ]}
        />
      ) : null}
      <Animated.View
        style={[
          styles.core,
          minimal && styles.coreMinimal,
          { width: dim, height: dim, borderRadius: dim / 2 },
          body,
          mode === 'listening' && !minimal ? { borderColor: PlanSheet.accent } : null,
        ]}>
        <Image source={NevoImage} style={[styles.face, { width: dim - 6, height: dim - 6, borderRadius: (dim - 6) / 2 }]} />
        {mode === 'listening' ? <View style={styles.liveDot} /> : null}
      </Animated.View>
      {size === 'lg' && !minimal ? (
        <>
          <ThemedText style={styles.name}>{assistant.name}</ThemedText>
          {statusLabel ? <ThemedText style={styles.status}>{statusLabel}</ThemedText> : null}
        </>
      ) : null}
    </View>
  );

  if (!interactive || !onPress) {
    return core;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${assistant.name}, ${statusLabel ?? 'planning assistant'}`}
      onPress={onPress}
      onPressIn={() => {
        press.value = withSpring(0.96, { damping: 14, stiffness: 420 });
      }}
      onPressOut={() => {
        press.value = withSpring(1, { damping: 12, stiffness: 280 });
      }}>
      {core}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 6,
  },
  wrapMinimal: {
    gap: 0,
  },
  listenRing: {
    position: 'absolute',
    top: -4,
    borderWidth: 2,
    borderColor: PlanSheet.accent,
    backgroundColor: 'transparent',
  },
  core: {
    backgroundColor: PlanSheet.bgElevated,
    borderWidth: 2,
    borderColor: PlanSheet.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coreMinimal: {
    backgroundColor: 'transparent',
    borderColor: PlanSheet.border,
  },
  face: {
    resizeMode: 'cover',
  },
  liveDot: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5BD67A',
    borderWidth: 2,
    borderColor: PlanSheet.bgElevated,
  },
  name: {
    ...Typography.caption,
    color: PlanSurface.textMuted,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  status: {
    ...Typography.caption,
    color: PlanSheet.accent,
    letterSpacing: 0.2,
  },
});
