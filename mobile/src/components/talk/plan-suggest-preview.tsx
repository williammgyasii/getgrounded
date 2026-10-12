import { StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { PlanSheet } from '@/constants/plan-sheet';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { type PlanSuggestBlock } from '@/lib/api';
import { clockLabelCompact } from '@/lib/clock';
import { humanAiText } from '@/lib/human-text';

export function PlanSuggestPreview({
  intro,
  blocks,
}: {
  intro?: string;
  blocks: PlanSuggestBlock[];
}) {
  return (
    <View style={styles.wrap}>
      {intro?.trim() ? (
        <>
          <ThemedText type="bodyMedium" style={styles.intro} numberOfLines={2} ellipsizeMode="tail">
            {humanAiText(intro)}
          </ThemedText>
          <ThemedText type="caption" style={styles.introHint}>
            Tap the waves to hear the full plan
          </ThemedText>
        </>
      ) : null}
      <View style={styles.list}>
        {blocks.map((row, index) => (
          <View key={`${row.title}-${index}`} style={styles.row}>
            <View style={styles.timeCol}>
              <ThemedText type="smallBold" style={styles.time}>
                {clockLabelCompact(row.plannedStartMinute)}
              </ThemedText>
            </View>
            <View style={styles.main}>
              <ThemedText type="bodyMedium" style={styles.title}>
                {humanAiText(row.title)}
              </ThemedText>
              <ThemedText type="caption" style={styles.meta}>
                {row.plannedDurationMinutes != null ? `${row.plannedDurationMinutes} min` : 'Flexible'}
                {row.source === 'inferred' ? ' · Nevo added' : ''}
              </ThemedText>
            </View>
            {row.source === 'inferred' ? (
              <SymbolView
                name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                size={16}
                tintColor={PlanSheet.accent}
              />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.three,
  },
  intro: {
    color: PlanSheet.inkMuted,
    lineHeight: 22,
  },
  introHint: {
    color: PlanSheet.inkDim,
    marginTop: -4,
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.card,
    backgroundColor: PlanSheet.bgElevated,
    borderWidth: 1,
    borderColor: PlanSheet.border,
  },
  timeCol: {
    minWidth: 52,
  },
  time: {
    ...Typography.caption,
    fontWeight: '600',
    color: PlanSheet.accent,
  },
  main: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: PlanSheet.ink,
  },
  meta: {
    color: PlanSheet.inkDim,
  },
});
