import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Typography, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { clockLabel } from '@/lib/clock';
import { statusLabel } from '@/lib/day-tasks';
import { areaLabel, areaTint } from '@/lib/life-areas';
import { statusLook } from '@/lib/status-look';

export type TruthRow = {
  id: string;
  title: string;
  status: string;
  plannedStartMinute?: number | null;
  lifeArea?: string | null;
};

const Main = ['COMPLETED', 'PARTIAL', 'MISSED'] as const;
const Extra = ['RESCHEDULED', 'CANCELLED', 'BLOCKED'] as const;

function isExtra(status: string) {
  return Extra.some((item) => item === status);
}

export function TruthCard({
  row,
  onChange,
}: {
  row: TruthRow;
  onChange: (status: string) => void;
}) {
  const theme = useTheme();
  const [more, setMore] = useState(isExtra(row.status));
  const look = statusLook(row.status);

  return (
    <View style={[styles.card, { backgroundColor: look.wash, borderColor: look.rail }]}>
      <View style={[styles.callout, { backgroundColor: look.rail }]} />
      <View style={styles.body}>
        <View style={styles.top}>
          {row.plannedStartMinute != null ? (
            <View style={[styles.time, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.chipText}>{clockLabel(row.plannedStartMinute)}</ThemedText>
            </View>
          ) : null}
          <View style={[styles.area, { backgroundColor: areaTint(row.lifeArea) }]}>
            <ThemedText style={[styles.chipText, { color: '#FFFFFF' }]}>{areaLabel(row.lifeArea)}</ThemedText>
          </View>
        </View>
        <ThemedText style={styles.title}>{row.title}</ThemedText>
        <View style={styles.chips}>
          {Main.map((status) => (
            <StatusChip
              key={status}
              label={statusLabel(status)}
              selected={row.status === status}
              fill={statusLook(status).chip}
              onPress={() => {
                setMore(false);
                onChange(status);
              }}
            />
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More statuses"
            onPress={() => setMore((open) => !open)}
            style={[
              styles.chip,
              { backgroundColor: isExtra(row.status) ? theme.textSecondary : theme.backgroundElement },
            ]}>
            <ThemedText style={[styles.chipText, { color: isExtra(row.status) ? '#FFFFFF' : theme.text }]}>
              More
            </ThemedText>
          </Pressable>
        </View>
        {more ? (
          <View style={styles.chips}>
            {Extra.map((status) => (
              <StatusChip
                key={status}
                label={statusLabel(status)}
                selected={row.status === status}
                fill={theme.textSecondary}
                onPress={() => onChange(status)}
              />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function StatusChip({
  label,
  selected,
  fill,
  onPress,
}: {
  label: string;
  selected: boolean;
  fill: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? fill : theme.backgroundElement }]}>
      <ThemedText style={[styles.chipText, { color: selected ? '#FFFFFF' : theme.text }]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  callout: {
    width: 3,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    gap: 8,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  title: {
    ...Typography.bodyMedium,
    lineHeight: 22,
  },
  time: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  area: {
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: Typography.bodyMedium.fontFamily,
  },
});
