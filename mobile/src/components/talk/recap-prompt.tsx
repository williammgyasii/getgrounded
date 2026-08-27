import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type CommitmentRecord } from '@/lib/api';
import { clockLabel } from '@/lib/clock';

export function RecapPrompt({
  tasks,
  heard,
  onSkip,
}: {
  tasks: CommitmentRecord[];
  heard: Set<string>;
  onSkip: (id: string) => void;
}) {
  const theme = useTheme();
  const open = tasks.filter((task) => !heard.has(task.id));
  const current = open[0];
  const next = open[1];
  const done = tasks.length - open.length;

  if (tasks.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <ThemedText type="small" themeColor="textSecondary">
        {open.length === 0
          ? 'You touched every plan. Anything else?'
          : `This morning · ${done + 1} of ${tasks.length}`}
      </ThemedText>
      {current ? (
        <Animated.View
          key={current.id}
          entering={FadeInRight.duration(220)}
          exiting={FadeOutLeft.duration(180)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Recap ${current.title}. Tap to skip.`}
            onPress={() => onSkip(current.id)}
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.rail, { backgroundColor: theme.primary }]} />
            <View style={styles.copy}>
              {current.plannedStartMinute != null ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {clockLabel(current.plannedStartMinute)}
                </ThemedText>
              ) : null}
              <ThemedText style={styles.title}>{current.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {next ? `Next · ${next.title}` : 'Last one. Then extras.'}
              </ThemedText>
            </View>
          </Pressable>
        </Animated.View>
      ) : (
        <View style={[styles.card, { backgroundColor: theme.primarySoft, borderColor: theme.border }]}>
          <View style={styles.copy}>
            <ThemedText type="small">Unplanned stuff still counts.</ThemedText>
          </View>
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dots}>
        {tasks.map((task) => {
          const seen = heard.has(task.id);
          const active = current?.id === task.id;
          return (
            <View
              key={task.id}
              style={[
                styles.dot,
                {
                  backgroundColor: seen ? theme.accent : active ? theme.primary : theme.backgroundElement,
                },
              ]}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 64,
  },
  rail: {
    width: 3,
  },
  copy: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    gap: 2,
  },
  title: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
