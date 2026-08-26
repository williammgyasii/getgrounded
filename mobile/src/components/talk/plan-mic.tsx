import { useEffect } from 'react';
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
import { useTheme } from '@/hooks/use-theme';

export function PlanMic({
  recording,
  metering,
  onPress,
}: {
  recording: boolean;
  metering?: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const pulse = useSharedValue(1);
  const ring = useSharedValue(0.4);

  useEffect(() => {
    if (recording) {
      pulse.value = withRepeat(
        withSequence(withTiming(1.08, { duration: 500 }), withTiming(1, { duration: 500 })),
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
  }, [pulse, recording, ring]);

  const bulge = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const halo = useAnimatedStyle(() => ({
    opacity: ring.value * 0.45,
    transform: [{ scale: 1 + ring.value * 0.35 }],
  }));

  return (
    <View style={styles.wrap}>
      <MicWaves metering={metering} active={recording} />
      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.halo,
            { borderColor: theme.primary, backgroundColor: theme.primarySoft },
            halo,
          ]}
        />
        <Animated.View style={bulge}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
            onPress={onPress}
            style={({ pressed }) => [
              styles.mic,
              {
                backgroundColor: recording ? theme.text : theme.primary,
                shadowColor: theme.text,
                opacity: pressed ? 0.88 : 1,
              },
            ]}>
            <SymbolView
              name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
              size={52}
              tintColor={theme.primaryOn}
            />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 16,
  },
  stage: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
  },
  mic: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
});
