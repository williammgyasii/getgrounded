import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { PlanSurface } from '@/constants/plan-surface';
import { Spacing } from '@/constants/theme';

export function YouSettingsRow({
  icon,
  label,
  hint,
  value,
  trailing,
  onPress,
  destructive,
  accessibilityLabel,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  hint?: string;
  value?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  accessibilityLabel?: string;
}) {
  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: PlanSurface.accentSoft }]}>
        <SymbolView
          name={icon}
          size={18}
          tintColor={destructive ? PlanSurface.danger : PlanSurface.accent}
        />
      </View>
      <View style={styles.copy}>
        <ThemedText type="bodyMedium" style={{ color: destructive ? PlanSurface.danger : PlanSurface.text }}>
          {label}
        </ThemedText>
        {hint ? (
          <ThemedText type="caption" style={{ color: PlanSurface.textMuted }}>
            {hint}
          </ThemedText>
        ) : null}
      </View>
      {trailing ?? (
        value ? (
          <ThemedText type="bodyMedium" style={{ color: PlanSurface.textMuted }}>
            {value}
          </ThemedText>
        ) : onPress ? (
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={16}
            tintColor={PlanSurface.textDim}
          />
        ) : null
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.row}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.72,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});
