import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { SymbolView } from 'expo-symbols';

import { type PlanLine } from '@/components/talk/plan-task-card';
import { ThemedText } from '@/components/themed-text';
import { PlanBlue } from '@/constants/plan-theme';
import { Spacing, Typography } from '@/constants/theme';
import { clockLabelCompact, clockToMinute, dateFromMinute, minuteToClock } from '@/lib/clock';
import { areaLabel } from '@/lib/life-areas';

export function PlanCheckTaskRow({
  line,
  onChange,
  onRemove,
  handle,
}: {
  line: PlanLine;
  onChange: (next: PlanLine) => void;
  onRemove: () => void;
  handle?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pickingTime, setPickingTime] = useState(false);
  const startMinute = clockToMinute(line.start) ?? 9 * 60;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: line.approved ? '#FAF7F1' : '#F3EFE8',
          borderColor: line.approved ? '#D6DEE8' : '#E8EEF6',
        },
      ]}>
      {handle}
      <Pressable
        accessibilityRole="button"
        onPress={() => setExpanded((open) => !open)}
        style={styles.main}>
        <View style={styles.titleLine}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change start time"
            onPress={() => setPickingTime(true)}
            hitSlop={6}>
            <ThemedText style={styles.timeText} numberOfLines={1}>
              {line.start.trim() ? clockLabelCompact(startMinute) : '—'}
            </ThemedText>
          </Pressable>
          <TextInput
            value={line.title}
            onChangeText={(title) => onChange({ ...line, title, source: 'manual' })}
            placeholder="Task title"
            placeholderTextColor={PlanBlue.light}
            style={[styles.title, { color: PlanBlue.deep }]}
          />
        </View>
        {expanded ? (
          <View style={styles.meta}>
            <ThemedText type="small" style={{ color: PlanBlue.mid }}>
              {areaLabel(line.area)} · {line.minutes.trim() || '30'} min
            </ThemedText>
            <Pressable accessibilityRole="button" onPress={onRemove} hitSlop={8}>
              <ThemedText type="small" style={{ color: PlanBlue.mid }}>
                Remove
              </ThemedText>
            </Pressable>
          </View>
        ) : null}
      </Pressable>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: line.approved }}
        onPress={() => onChange({ ...line, approved: !line.approved })}
        style={[
          styles.check,
          {
            backgroundColor: line.approved ? PlanBlue.primary : 'transparent',
            borderColor: line.approved ? PlanBlue.primary : PlanBlue.mid,
          },
        ]}>
        {line.approved ? (
          <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={14} tintColor={PlanBlue.on} />
        ) : null}
      </Pressable>

      {pickingTime ? (
        <DateTimePicker
          value={dateFromMinute(startMinute)}
          mode="time"
          presentation="dialog"
          accentColor={PlanBlue.primary}
          onValueChange={(_, date) => {
            onChange({
              ...line,
              start: minuteToClock(date.getHours() * 60 + date.getMinutes()),
              source: 'manual',
            });
            setPickingTime(false);
          }}
          onDismiss={() => setPickingTime(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: Spacing.two,
  },
  timeText: {
    ...Typography.micro,
    color: PlanBlue.mid,
    width: 38,
    letterSpacing: -0.2,
  },
  main: {
    flex: 1,
    gap: 4,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...Typography.bodyMedium,
    flex: 1,
    padding: 0,
    lineHeight: 22,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
