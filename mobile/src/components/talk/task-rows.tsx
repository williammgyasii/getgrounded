import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { DangerConfirm } from '@/components/talk/danger-confirm';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { clockLabel, minutesLabel } from '@/lib/clock';
import { statusLabel, type AgendaTask } from '@/lib/day-tasks';
import { areaLabel, areaTint } from '@/lib/life-areas';
import { statusIcon, statusLook } from '@/lib/status-look';

export function TaskRows({
  items,
  onToggle,
  onRemove,
}: {
  items: AgendaTask[];
  onToggle?: (item: AgendaTask) => void;
  onRemove?: (item: AgendaTask) => void;
}) {
  const theme = useTheme();
  const [pending, setPending] = useState<AgendaTask | null>(null);
  if (items.length === 0) {
    return <ThemedText themeColor="textSecondary">No tasks on this day yet.</ThemedText>;
  }

  return (
    <View style={[styles.list, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {items.map((item, index) => {
        const status = item.status?.toUpperCase();
        const done = status === 'COMPLETED';
        const look = statusLook(status);
        const icon = statusIcon(look.mark);
        const mark = statusLabel(status);
        return (
          <Animated.View
            key={item.key}
            entering={FadeIn.duration(220)}
            layout={LinearTransition.springify().damping(18)}
            style={[
              styles.row,
              { backgroundColor: look.wash },
              index < items.length - 1
                ? { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }
                : null,
            ]}>
            <View style={[styles.rail, { backgroundColor: look.rail }]} />
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              accessibilityLabel={done ? `Mark ${item.title} not done` : `Mark ${item.title} done`}
              disabled={onToggle == null}
              onPress={() => onToggle?.(item)}
              hitSlop={8}
              style={[
                styles.box,
                {
                  borderColor: look.mark ? look.rail : theme.border,
                  backgroundColor: look.mark ? look.rail : theme.card,
                },
              ]}>
              {icon ? <SymbolView name={icon} size={12} tintColor="#FFFFFF" /> : null}
            </Pressable>
            <View style={styles.copy}>
              <ThemedText
                style={[
                  styles.title,
                  done ? styles.done : null,
                  status === 'MISSED' || status === 'CANCELLED' ? { color: theme.textSecondary } : null,
                ]}>
                {item.title}
              </ThemedText>
              <View style={styles.meta}>
                {item.plannedDurationMinutes ? (
                  <View style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText style={styles.chipText}>{minutesLabel(item.plannedDurationMinutes)}</ThemedText>
                  </View>
                ) : null}
                <View style={[styles.chip, { backgroundColor: areaTint(item.lifeArea) }]}>
                  <ThemedText style={[styles.chipText, { color: '#FFFFFF' }]}>
                    {areaLabel(item.lifeArea)}
                  </ThemedText>
                </View>
                {item.fresh ? (
                  <View style={[styles.chip, { backgroundColor: theme.accent }]}>
                    <ThemedText style={[styles.chipText, { color: '#FFFFFF' }]}>New</ThemedText>
                  </View>
                ) : null}
                {mark ? (
                  <View style={[styles.chip, { backgroundColor: look.chip }]}>
                    <ThemedText style={[styles.chipText, { color: look.chipInk }]}>{mark}</ThemedText>
                  </View>
                ) : null}
              </View>
            </View>
            <ThemedText type="smallBold" style={styles.time}>
              {clockLabel(item.plannedStartMinute)}
            </ThemedText>
            {onRemove ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.title}`}
                onPress={() => setPending(item)}
                hitSlop={8}
                style={styles.trash}>
                <SymbolView
                  name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                  size={16}
                  tintColor={theme.textSecondary}
                />
              </Pressable>
            ) : null}
          </Animated.View>
        );
      })}
      <DangerConfirm
        open={pending != null}
        title="Delete this task?"
        body={pending ? `${pending.title} will come off this day.` : ''}
        confirmLabel="Delete task"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) {
            onRemove?.(pending);
          }
          setPending(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.three,
    paddingVertical: 10,
    gap: Spacing.two,
  },
  rail: {
    width: 3,
    alignSelf: 'stretch',
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
  },
  done: {
    textDecorationLine: 'line-through',
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  chipText: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: FontFamily.medium,
  },
  time: {
    minWidth: 52,
    textAlign: 'right',
  },
  trash: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
