import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { areaLabel, areaTint } from '@/lib/life-areas';

export type HappenedWin = {
  title: string;
  lifeArea?: string | null;
};

export function HappenedCard({
  win,
  onChange,
  onRemove,
}: {
  win: HappenedWin;
  onChange?: (next: HappenedWin) => void;
  onRemove?: () => void;
}) {
  const theme = useTheme();
  const rail = areaTint(win.lifeArea);

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.callout, { backgroundColor: rail }]} />
      <View style={styles.body}>
        <View style={[styles.area, { backgroundColor: rail }]}>
          <ThemedText style={styles.areaLabel}>{areaLabel(win.lifeArea)}</ThemedText>
        </View>
        {onChange ? (
          <TextInput
            value={win.title}
            onChangeText={(title) => onChange({ ...win, title })}
            placeholder="Something extra"
            placeholderTextColor={theme.textSecondary}
            style={[styles.title, { color: theme.text }]}
          />
        ) : (
          <ThemedText style={styles.title}>{win.title}</ThemedText>
        )}
      </View>
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove this extra"
          hitSlop={8}
          onPress={onRemove}
          style={styles.remove}>
          <SymbolView
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            size={14}
            tintColor={theme.textSecondary}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  callout: {
    width: 3,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    gap: 6,
  },
  area: {
    alignSelf: 'flex-start',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  areaLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 13,
    fontFamily: FontFamily.medium,
  },
  title: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
    padding: 0,
  },
  remove: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
