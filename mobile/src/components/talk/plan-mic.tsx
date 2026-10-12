import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';

import { MicWaves } from '@/components/talk/mic-waves';
import { ThemedText } from '@/components/themed-text';
import { type PlanMicPalette } from '@/constants/plan-theme';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MaxMs = 60_000;

function clock(ms: number) {
  const total = Math.min(MaxMs, Math.max(0, Math.floor(ms / 1000)));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function PlanMic({
  recording,
  durationMillis = 0,
  metering,
  centered,
  large,
  palette: paletteOverride,
  onStart,
  onSend,
  onDiscard,
}: {
  recording: boolean;
  durationMillis?: number;
  metering?: number;
  centered?: boolean;
  large?: boolean;
  palette?: PlanMicPalette;
  onStart: () => void;
  onSend: () => void;
  onDiscard: () => void;
}) {
  const theme = useTheme();
  const palette = paletteOverride ?? {
    primary: theme.primary,
    primarySoft: theme.primarySoft,
    primaryOn: theme.primaryOn,
    record: theme.primary,
  };
  const micSize = large ? 72 : 56;
  const [trackW, setTrackW] = useState(micSize);
  const [lineW, setLineW] = useState(0);
  const open = useSharedValue(0);
  const pulse = useSharedValue(1);
  const ring = useSharedValue(0.4);
  const fill = useSharedValue(0);

  useEffect(() => {
    open.value = withSpring(recording ? 1 : 0, { damping: 16, stiffness: 170 });
    if (recording) {
      pulse.value = withRepeat(
        withSequence(withTiming(1.06, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
        true,
      );
      ring.value = withRepeat(
        withSequence(withTiming(1, { duration: 900 }), withTiming(0.35, { duration: 900 })),
        -1,
        true,
      );
      return;
    }

    pulse.value = withSpring(1);
    ring.value = withTiming(0.4, { duration: 200 });
    fill.value = withTiming(0, { duration: 160 });
  }, [fill, open, pulse, recording, ring]);

  useEffect(() => {
    fill.value = withTiming(Math.min(1, durationMillis / MaxMs), { duration: 80 });
  }, [durationMillis, fill]);

  const extra = Math.max(0, trackW - micSize);
  const pill = useAnimatedStyle(() => ({
    width: micSize + open.value * extra,
  }));
  const row = useAnimatedStyle(() => ({
    opacity: open.value,
  }));
  const line = useAnimatedStyle(() => ({
    width: fill.value * lineW,
  }));
  const bulge = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const halo = useAnimatedStyle(() => ({
    opacity: ring.value * 0.45,
    transform: [{ scale: 1 + ring.value * 0.32 }],
  }));

  const recordBg = recording ? palette.record : palette.primary;
  const onColor = palette.primaryOn;

  return (
    <View
      style={[styles.track, centered && styles.trackCenter, large && styles.trackLarge]}
      onLayout={(event) => setTrackW(event.nativeEvent.layout.width)}>
      <Animated.View style={[styles.pill, { backgroundColor: recordBg, minHeight: micSize, borderRadius: micSize / 2 }, pill]}>
        {recording ? (
          <Animated.View style={[styles.recordRow, row]}>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Discard this take"
                onPress={onDiscard}
                style={styles.action}>
                <SymbolView
                  name={{ ios: 'xmark', android: 'close', web: 'close' }}
                  size={18}
                  tintColor={onColor}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send this take"
                onPress={onSend}
                style={[styles.action, styles.send, { backgroundColor: onColor }]}>
                <SymbolView
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  size={18}
                  tintColor={palette.record}
                />
              </Pressable>
            </View>
            <View style={styles.meter}>
              <MicWaves compact metering={metering} active={recording} color={onColor} />
              <View
                style={styles.lineTrack}
                onLayout={(event) => setLineW(event.nativeEvent.layout.width)}>
                <View style={[styles.lineBase, { backgroundColor: 'rgba(248, 251, 255, 0.28)' }]} />
                <Animated.View style={[styles.lineFill, { backgroundColor: onColor }, line]} />
              </View>
            </View>
            <ThemedText style={[styles.clock, { color: onColor }]}>{clock(durationMillis)}</ThemedText>
          </Animated.View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start recording"
            onPress={onStart}
            style={[styles.stage, { width: micSize, height: micSize }]}>
            <Animated.View
              style={[
                styles.halo,
                {
                  width: large ? 60 : 48,
                  height: large ? 60 : 48,
                  borderRadius: large ? 30 : 24,
                  borderColor: palette.primaryOn,
                  backgroundColor: palette.primarySoft,
                },
                halo,
              ]}
            />
            <Animated.View style={bulge}>
              <SymbolView
                name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
                size={large ? 28 : 24}
                tintColor={palette.primaryOn}
              />
            </Animated.View>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    alignItems: 'flex-start',
    minHeight: 56,
  },
  trackCenter: {
    alignItems: 'center',
  },
  trackLarge: {
    minHeight: 72,
    paddingVertical: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  recordRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 10,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  action: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 251, 255, 0.16)',
  },
  send: {},
  meter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  lineTrack: {
    alignSelf: 'stretch',
    height: 10,
    justifyContent: 'center',
  },
  lineBase: {
    height: 3,
    borderRadius: 2,
    width: '100%',
  },
  lineFill: {
    position: 'absolute',
    left: 0,
    height: 3,
    borderRadius: 2,
  },
  clock: {
    ...Typography.bodyMedium,
    fontFamily: Typography.title.fontFamily,
    fontSize: 15,
    lineHeight: 20,
    minWidth: 40,
    textAlign: 'right',
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    borderWidth: 1.5,
  },
});
