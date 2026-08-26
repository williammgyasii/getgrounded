import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AuthFieldProps = TextInputProps & {
  label: string;
};

export function AuthField({ label, secureTextEntry, style, ...props }: AuthFieldProps) {
  const theme = useTheme();
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const [focused, setFocused] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View style={styles.wrap}>
      <ThemedText type="smallBold" style={styles.label}>
        {label}
      </ThemedText>
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.inputBackground,
            borderColor: focused ? theme.text : theme.border,
          },
        ]}>
        <TextInput
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={isPassword ? hidden : false}
          autoCorrect={false}
          showSoftInputOnFocus
          {...props}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          style={[styles.input, { color: theme.text, fontFamily: FontFamily.medium }, style]}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={8}
            onPress={() => setHidden((value) => !value)}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {hidden ? 'Show' : 'Hide'}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
  field: {
    minHeight: 52,
    borderRadius: Radius.field,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: Spacing.two,
  },
});
