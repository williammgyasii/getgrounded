import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SocialButtonProps = PressableProps & {
  label: string;
  icon?: ReactNode;
};

export function SocialButton({ label, icon, style, ...props }: SocialButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      style={(state) => [
        styles.button,
        {
          backgroundColor: theme.background,
          borderColor: theme.border,
          opacity: state.pressed || props.disabled ? 0.7 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      <View style={styles.icon}>{icon}</View>
      <ThemedText type="smallBold" style={styles.label}>
        {label}
      </ThemedText>
      <View style={styles.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: Radius.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
  },
  icon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
  },
});
