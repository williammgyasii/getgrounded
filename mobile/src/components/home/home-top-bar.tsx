import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type HomeTopBarProps = {
  title: string;
  subtitle: string;
  initial: string;
  onAvatarPress: () => void;
  onBack?: () => void;
};

export function HomeTopBar({ title, subtitle, initial, onAvatarPress, onBack }: HomeTopBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.bar,
        {
          paddingTop: insets.top + Spacing.two,
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
        },
      ]}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Plan"
          hitSlop={12}
          onPress={onBack}
          style={styles.back}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            size={20}
            tintColor={theme.text}
          />
        </Pressable>
      ) : null}
      <View style={styles.copy}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Account"
        onPress={onAvatarPress}
        style={[styles.avatar, { backgroundColor: theme.accent }]}>
        {initial ? (
          <ThemedText type="caption" style={{ color: theme.primaryOn }}>
            {initial}
          </ThemedText>
        ) : (
          <SymbolView
            name={{ ios: 'person.fill', android: 'person', web: 'person' }}
            size={18}
            tintColor={theme.primaryOn}
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {
    width: 36,
    height: 36,
    marginRight: Spacing.one,
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
    paddingRight: Spacing.three,
  },
  title: {
    ...Typography.headline,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
