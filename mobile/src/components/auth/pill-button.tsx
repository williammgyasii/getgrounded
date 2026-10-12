import { forwardRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PillVariant = 'primary' | 'secondary' | 'outline';

export type PillButtonProps = PressableProps & {
  label: string;
  variant?: PillVariant;
  loading?: boolean;
};

export const PillButton = forwardRef<View, PillButtonProps>(function PillButton(
  { label, variant = 'primary', loading = false, disabled, style, ...props },
  ref,
) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const palette = {
    primary: {
      backgroundColor: theme.primary,
      color: theme.primaryOn,
      borderColor: theme.primary,
    },
    secondary: {
      backgroundColor: theme.background,
      color: theme.text,
      borderColor: theme.border,
    },
    outline: {
      backgroundColor: theme.background,
      color: theme.text,
      borderColor: theme.border,
    },
  }[variant];

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      style={(state) => [
        styles.button,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: state.pressed || isDisabled ? 0.7 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      <View style={styles.content}>
        {loading ? <ActivityIndicator color={palette.color} /> : null}
        <ThemedText type="bodyMedium" style={[styles.label, { color: palette.color }]}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: Radius.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  label: {},
});
