import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { clockLabel, minutesLabel, minutesPhrase } from '@/lib/clock';
import { areaLabel, areaTint } from '@/lib/life-areas';

export type AgendaItem = {
  key: string;
  title: string;
  plannedStartMinute?: number | null;
  plannedDurationMinutes?: number | null;
  lifeArea?: string | null;
  status?: string | null;
  fresh?: boolean;
};

export function agendaSummary(items: AgendaItem[]): string {
  const remaining = items.filter((item) => {
    const status = item.status?.toUpperCase();
    return status == null || status === 'PLANNED' || status === 'PARTIAL';
  }).length;
  const total = items.reduce((sum, item) => sum + (item.plannedDurationMinutes ?? 0), 0);
  const time = minutesPhrase(total);
  const count = `${items.length} ${items.length === 1 ? 'task' : 'tasks'}`;
  return time ? `${count} · ${time} to finish` : count;
}

export function DayAgenda({
  items,
  onPressItem,
}: {
  items: AgendaItem[];
  onPressItem?: (item: AgendaItem) => void;
}) {
  const theme = useTheme();
  if (items.length === 0) {
    return <ThemedText themeColor="textSecondary">No tasks on this day yet.</ThemedText>;
  }

  return (
    <View style={styles.list}>
      {items.map((item, index) => {
        const status = item.status?.toUpperCase();
        const done = status === 'COMPLETED';
        const missed = status === 'MISSED';
        const Card = onPressItem ? Pressable : View;
        const next = items[index + 1];
        return (
          <View key={item.key}>
            <Card
              accessibilityRole={onPressItem ? 'button' : undefined}
              onPress={onPressItem ? () => onPressItem(item) : undefined}
              style={[
                styles.card,
                {
                  backgroundColor: theme.card,
                  borderColor: item.fresh ? theme.accent : theme.border,
                  opacity: missed ? 0.7 : 1,
                },
              ]}>
              <View style={[styles.callout, { backgroundColor: areaTint(item.lifeArea) }]} />
              <View style={styles.body}>
                <View style={styles.meta}>
                  <View style={[styles.timePill, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText type="small" style={{ color: theme.text }}>
                      {clockLabel(item.plannedStartMinute) || 'Flexible'}
                    </ThemedText>
                  </View>
                  {item.lifeArea ? (
                    <View style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
                      <ThemedText type="small" style={{ color: theme.text }}>
                        {areaLabel(item.lifeArea)}
                      </ThemedText>
                    </View>
                  ) : null}
                  {item.fresh ? (
                    <View style={[styles.chip, { backgroundColor: theme.accent }]}>
                      <ThemedText type="small" style={{ color: '#FFFFFF' }}>
                        New
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
                <ThemedText style={[styles.title, done ? styles.done : null]}>{item.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {minutesLabel(item.plannedDurationMinutes)}
                </ThemedText>
              </View>
            </Card>
            {next ? <Transition from={item} to={next} /> : null}
          </View>
        );
      })}
    </View>
  );
}

function Transition({ from, to }: { from: AgendaItem; to: AgendaItem }) {
  const theme = useTheme();
  const start = from.plannedStartMinute ?? 0;
  const duration = from.plannedDurationMinutes ?? 30;
  const next = to.plannedStartMinute;
  const gap = next == null ? 0 : next - (start + duration);
  const length = minutesLabel(duration);
  const wait = gap > 0 ? minutesLabel(gap) : null;

  return (
    <View style={styles.transition} accessibilityElementsHidden>
      <View style={[styles.rail, { backgroundColor: theme.border }]} />
      <ThemedText type="small" themeColor="textSecondary">
        {wait ? `${length} · ${wait} later` : `${length} · then ${clockLabel(next) || 'next'}`}
      </ThemedText>
      <View style={[styles.rail, { backgroundColor: theme.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 0,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  callout: {
    width: 3,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    gap: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  timePill: {
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
  },
  chip: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  title: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
  },
  done: {
    textDecorationLine: 'line-through',
  },
  transition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 8,
    paddingHorizontal: Spacing.five,
  },
  rail: {
    flex: 1,
    height: 1,
  },
});
