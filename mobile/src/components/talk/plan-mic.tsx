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
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MicSize = 56;
const MaxMs = 60_000;
const RecordBlue = '#1F5AA6';
const OnBlue = '#F7F3EC';

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
  onStart,
  onSend,
  onDiscard,
}: {
  recording: boolean;
  durationMillis?: number;
  metering?: number;
  onStart: () => void;
  onSend: () => void;
  onDiscard: () => void;
}) {
  const theme = useTheme();
  const [trackW, setTrackW] = useState(MicSize);
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

  const extra = Math.max(0, trackW - MicSize);
  const pill = useAnimatedStyle(() => ({
    width: MicSize + open.value * extra,
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
    opacity: ring.value * 0.4,
    transform: [{ scale: 1 + ring.value * 0.28 }],
  }));

  return (
    <View
      style={styles.track}
      onLayout={(event) => setTrackW(event.nativeEvent.layout.width)}>
      <Animated.View
        style={[
          styles.pill,
          { backgroundColor: recording ? RecordBlue : theme.primary },
          pill,
        ]}>
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
                  tintColor={OnBlue}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send this take"
                onPress={onSend}
                style={[styles.action, styles.send]}>
                <SymbolView
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  size={18}
                  tintColor={RecordBlue}
                />
              </Pressable>
            </View>
            <View style={styles.meter}>
              <MicWaves compact metering={metering} active={recording} color={OnBlue} />
              <View
                style={styles.lineTrack}
                onLayout={(event) => setLineW(event.nativeEvent.layout.width)}>
                <View style={[styles.lineBase, { backgroundColor: 'rgba(247, 243, 236, 0.28)' }]} />
                <Animated.View style={[styles.lineFill, { backgroundColor: OnBlue }, line]} />
              </View>
            </View>
            <ThemedText style={styles.clock}>{clock(durationMillis)}</ThemedText>
          </Animated.View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start recording"
            onPress={onStart}
            style={styles.stage}>
            <Animated.View
              style={[
                styles.halo,
                { borderColor: theme.primaryOn, backgroundColor: theme.primarySoft },
                halo,
              ]}
            />
            <Animated.View style={bulge}>
              <SymbolView
                name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
                size={24}
                tintColor={theme.primaryOn}
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
    minHeight: MicSize,
  },
  pill: {
    minHeight: MicSize,
    borderRadius: MicSize / 2,
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
    backgroundColor: 'rgba(247, 243, 236, 0.16)',
  },
  send: {
    backgroundColor: OnBlue,
  },
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
    color: OnBlue,
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
    minWidth: 40,
    textAlign: 'right',
  },
  stage: {
    width: MicSize,
    height: MicSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
  },
});
