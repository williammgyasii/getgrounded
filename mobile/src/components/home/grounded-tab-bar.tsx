import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type GroundedTabBarProps = {
  state: { index: number; routes: { name: string }[] };
  navigation: { navigate: (name: string) => void };
};

const homeIcon = { ios: 'house.fill', android: 'home', web: 'home' } as const;
const youIcon = { ios: 'person.fill', android: 'person', web: 'person' } as const;

export function GroundedTabBar({ state, navigation }: GroundedTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const current = state.routes[state.index]?.name;

  if (current === 'talk') {
    return null;
  }

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
        label="Home"
        focused={current === 'home'}
        icon={homeIcon}
        onPress={() => navigation.navigate('home')}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Talk"
        onPress={() => navigation.navigate('talk')}
        style={[styles.mic, { backgroundColor: theme.primary, shadowColor: theme.text }]}>
        <SymbolView
          name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
          size={30}
          tintColor={theme.primaryOn}
        />
      </Pressable>
      <TabItem
        label="You"
        focused={current === 'you'}
        icon={youIcon}
        onPress={() => navigation.navigate('you')}
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
  icon: typeof homeIcon | typeof youIcon;
  onPress: () => void;
}) {
  const theme = useTheme();
  const color = focused ? theme.accent : theme.textSecondary;

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.item}>
      <SymbolView name={icon} size={22} tintColor={color} />
      <ThemedText type="small" style={[styles.label, { color }]}>
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
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingBottom: Spacing.one,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
  },
  mic: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
