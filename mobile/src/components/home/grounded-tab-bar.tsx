import { type Href, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type GroundedTabBarProps = {
  state: { index: number; routes: { name: string }[] };
};

const todayIcon = { ios: 'sun.max.fill', android: 'wb_sunny', web: 'wb_sunny' } as const;
const historyIcon = { ios: 'book.fill', android: 'menu_book', web: 'menu_book' } as const;
const reviewIcon = { ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' } as const;
const youIcon = { ios: 'person.fill', android: 'person', web: 'person' } as const;

export function GroundedTabBar({ state }: GroundedTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const current = state.routes[state.index]?.name;

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, Spacing.two),
          backgroundColor: theme.inputBackground,
          borderTopColor: theme.border,
        },
      ]}>
      <TabItem
        label="Today"
        focused={current === 'today'}
        icon={todayIcon}
        onPress={() => router.navigate('/today' as Href)}
      />
      <TabItem
        label="Work"
        focused={current === 'history'}
        icon={historyIcon}
        onPress={() => router.navigate('/history' as Href)}
      />
      <RaisedTalk focused={current === 'talk'} onPress={() => router.navigate('/talk' as Href)} />
      <TabItem
        label="Review"
        focused={current === 'review'}
        icon={reviewIcon}
        onPress={() => router.navigate('/review' as Href)}
      />
      <TabItem
        label="You"
        focused={current === 'you'}
        icon={youIcon}
        onPress={() => router.navigate('/you' as Href)}
      />
    </View>
  );
}

function TabItem({
  label,
  focused,
  icon,
  onPress,
}: {
  label: string;
  focused: boolean;
  icon: typeof todayIcon | typeof historyIcon | typeof reviewIcon | typeof youIcon;
  onPress: () => void;
}) {
  const theme = useTheme();
  const color = focused ? theme.accent : theme.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.item}>
      <View style={[styles.chip, focused && { backgroundColor: theme.primarySoft }]}>
        <SymbolView name={icon} size={22} tintColor={color} />
      </View>
      <ThemedText type="small" style={[styles.label, { color }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function RaisedTalk({ focused, onPress }: { focused: boolean; onPress: () => void }) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      scale.value = withRepeat(
        withSequence(withTiming(1.08, { duration: 700 }), withTiming(1, { duration: 700 })),
        -1,
        true,
      );
      return;
    }

    scale.value = withSpring(1);
  }, [focused, scale]);

  const bulge = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.talkSlot}>
      <Animated.View style={bulge}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Plan"
          onPressIn={() => {
            scale.value = withSpring(0.92);
          }}
          onPressOut={() => {
            scale.value = focused
              ? withRepeat(
                  withSequence(withTiming(1.08, { duration: 700 }), withTiming(1, { duration: 700 })),
                  -1,
                  true,
                )
              : withSpring(1);
          }}
          onPress={onPress}
          style={[
            styles.mic,
            {
              backgroundColor: theme.primary,
              shadowColor: theme.text,
            },
          ]}>
          <SymbolView
            name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
            size={30}
            tintColor={theme.primaryOn}
          />
        </Pressable>
      </Animated.View>
      <ThemedText type="small" style={[styles.label, { color: focused ? theme.accent : theme.textSecondary }]}>
        Plan
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingBottom: Spacing.one,
  },
  chip: {
    width: 40,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
  },
  talkSlot: {
    width: 76,
    alignItems: 'center',
    gap: 4,
    marginTop: -28,
  },
  mic: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
