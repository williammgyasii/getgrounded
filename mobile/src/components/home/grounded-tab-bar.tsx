import { type Href, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PlanBlue } from '@/constants/plan-theme';
import { PlanSurface } from '@/constants/plan-surface';
import { Spacing } from '@/constants/theme';

type GroundedTabBarProps = {
  state: { index: number; routes: { name: string }[] };
};

const todayIcon = { ios: 'house.fill', android: 'home', web: 'home' } as const;
const planIcon = { ios: 'waveform.circle.fill', android: 'graphic_eq', web: 'graphic_eq' } as const;
const youIcon = { ios: 'person.fill', android: 'person', web: 'person' } as const;

export function GroundedTabBar({ state }: GroundedTabBarProps) {
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name;

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, Spacing.two),
        },
      ]}>
      <TabItem
        label="Today"
        focused={current === 'today'}
        icon={todayIcon}
        onPress={() => router.navigate('/today' as Href)}
      />
      <TabItem
        label="Plan"
        focused={current === 'talk'}
        icon={planIcon}
        accent
        onPress={() => router.navigate('/talk' as Href)}
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
  accent,
  onPress,
}: {
  label: string;
  focused: boolean;
  icon: typeof todayIcon;
  accent?: boolean;
  onPress: () => void;
}) {
  const color = focused ? (accent ? PlanBlue.primary : PlanSurface.text) : PlanSurface.textMuted;
  const iconSize = accent ? 26 : 24;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      android_ripple={{ color: 'transparent' }}
      onPress={onPress}
      style={styles.item}>
      <SymbolView name={icon} size={iconSize} tintColor={color} />
      <ThemedText type="tabLabel" style={{ color }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PlanSurface.borderSoft,
    backgroundColor: PlanSurface.bgDeep,
    minHeight: 49,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingBottom: Spacing.one,
    minHeight: 44,
    justifyContent: 'center',
  },
});
