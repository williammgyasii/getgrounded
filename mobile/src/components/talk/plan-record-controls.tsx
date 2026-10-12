import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { type PlanMicPalette, PlanBlue } from '@/constants/plan-theme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MaxMs = 60_000;

function clock(ms: number) {
  const total = Math.min(MaxMs, Math.max(0, Math.floor(ms / 1000)));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function PlanRecordButton({
  palette: paletteOverride,
  onStart,
}: {
  palette?: PlanMicPalette;
  onStart: () => void;
}) {
  const theme = useTheme();
  const palette = paletteOverride ?? {
    primary: theme.primary,
    primarySoft: theme.primarySoft,
    primaryOn: theme.primaryOn,
    record: theme.primary,
  };
  const pulse = useSharedValue(1);
  const ring = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
      true,
    );
    ring.value = withRepeat(
      withSequence(withTiming(0.85, { duration: 1200 }), withTiming(0.35, { duration: 1200 })),
      -1,
      true,
    );
  }, [pulse, ring]);

  const bulge = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const halo = useAnimatedStyle(() => ({
    opacity: ring.value * 0.5,
    transform: [{ scale: 1 + ring.value * 0.18 }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Start recording"
      onPress={onStart}
      style={styles.startWrap}>
      <Animated.View
        style={[
          styles.halo,
          { borderColor: PlanBlue.light, backgroundColor: PlanBlue.soft },
          halo,
        ]}
      />
      <Animated.View style={[styles.startBtn, bulge]}>
        <SymbolView
          name={{ ios: 'mic.circle.fill', android: 'mic', web: 'mic' }}
          size={88}
          tintColor={palette.primary}
        />
      </Animated.View>
    </Pressable>
  );
}

export function PlanRecordDock({
  durationMillis = 0,
  palette: paletteOverride,
  onSend,
  onDiscard,
}: {
  durationMillis?: number;
  palette?: PlanMicPalette;
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
  const [lineW, setLineW] = useState(0);
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withTiming(Math.min(1, durationMillis / MaxMs), { duration: 80 });
  }, [durationMillis, fill]);

  const line = useAnimatedStyle(() => ({
    width: fill.value * lineW,
  }));

  return (
    <View style={styles.dock}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Discard this take"
        onPress={onDiscard}
        style={[styles.dockBtn, { borderColor: PlanBlue.border, backgroundColor: PlanBlue.mist }]}>
        <SymbolView
          name={{ ios: 'xmark', android: 'close', web: 'close' }}
          size={20}
          tintColor={PlanBlue.deep}
        />
      </Pressable>

      <View style={styles.dockCenter}>
        <View
          style={styles.lineTrack}
          onLayout={(event) => setLineW(event.nativeEvent.layout.width)}>
          <View style={[styles.lineBase, { backgroundColor: PlanBlue.border }]} />
          <Animated.View style={[styles.lineFill, { backgroundColor: PlanBlue.primary }, line]} />
        </View>
        <ThemedText type="small" style={[styles.clock, { color: PlanBlue.mid }]}>
          {clock(durationMillis)}
        </ThemedText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send this take"
        onPress={onSend}
        style={[styles.dockBtn, styles.dockSend, { backgroundColor: palette.primary }]}>
        <SymbolView
          name={{ ios: 'checkmark', android: 'check', web: 'check' }}
          size={22}
          tintColor={palette.primaryOn}
        />
      </Pressable>
    </View>
  );
}

const BTN = 52;

const styles = StyleSheet.create({
  startWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
  },
  startBtn: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  dockBtn: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockSend: {
    borderWidth: 0,
  },
  dockCenter: {
    flex: 1,
    gap: 6,
    alignItems: 'stretch',
  },
  lineTrack: {
    height: 12,
    justifyContent: 'center',
  },
  lineBase: {
    height: 4,
    borderRadius: Radius.pill,
    width: '100%',
  },
  lineFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: Radius.pill,
  },
  clock: {
    textAlign: 'center',
    fontFamily: Typography.bodyMedium.fontFamily,
  },
});
