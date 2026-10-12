import { type ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { SymbolView } from 'expo-symbols';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Typography, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { clockLabel, clockToMinute, dateFromMinute, minuteToClock } from '@/lib/clock';
import { areaLabel, areaTint } from '@/lib/life-areas';

import { PlanBlue } from '@/constants/plan-theme';

const ChipRadius = 8;
const RestingFill = PlanBlue.mist;
const ApprovedFill = PlanBlue.approvedSoft;
const ApprovedLine = PlanBlue.approved;
const ApprovedInk = PlanBlue.approvedInk;

export type PlanLine = {
  key: string;
  title: string;
  minutes: string;
  start: string;
  area: string;
  source: 'spoken' | 'inferred' | 'manual';
  approved: boolean;
};

export function PlanTaskCard({
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
  const theme = useTheme();
  const [editing, setEditing] = useState(false);
  const [pickingTime, setPickingTime] = useState(false);
  const startMinute = clockToMinute(line.start) ?? 9 * 60;
  const tint = areaTint(line.area);
  const progress = useSharedValue(line.approved ? 1 : 0);
  const pop = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(line.approved ? 1 : 0, { duration: 280 });
    if (line.approved) {
      pop.value = withSequence(withSpring(1.12, { damping: 12 }), withSpring(1));
    }
  }, [line.approved, pop, progress]);

  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [RestingFill, ApprovedFill]),
    borderColor: interpolateColor(progress.value, [0, 1], [PlanBlue.border, ApprovedLine]),
  }));

  const checkStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [RestingFill, ApprovedLine]),
    borderColor: interpolateColor(progress.value, [0, 1], [PlanBlue.border, ApprovedLine]),
    transform: [{ scale: pop.value }],
  }));

  function bumpStart(delta: number) {
    const next = Math.max(0, Math.min(23 * 60 + 45, startMinute + delta));
    onChange({ ...line, start: minuteToClock(next), source: 'manual' });
  }

  return (
    <Animated.View style={[styles.card, cardStyle]}>
      <View style={[styles.callout, { backgroundColor: line.approved ? ApprovedLine : tint }]} />
      <View style={styles.body}>
        <View style={styles.top}>
          {handle}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change start time"
            onPress={() => setPickingTime(true)}
            style={[styles.timePill, { backgroundColor: PlanBlue.soft, borderColor: PlanBlue.border }]}>
            <SymbolView
              name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
              size={13}
              tintColor={theme.text}
            />
            <ThemedText type="small" style={{ color: theme.text }}>
              {clockLabel(startMinute)}
            </ThemedText>
          </Pressable>
          <View style={[styles.chip, { backgroundColor: PlanBlue.soft, borderColor: PlanBlue.border }]}>
            <ThemedText style={[styles.chipText, { color: theme.text }]}>
              {areaLabel(line.area)}
            </ThemedText>
          </View>
          <SourceMark source={line.source} />
        </View>

        <View style={styles.titleRow}>
          {editing ? (
            <TextInput
              value={line.title}
              onChangeText={(title) => onChange({ ...line, title })}
              placeholder="A commitment"
              placeholderTextColor={theme.textSecondary}
              style={[styles.titleInput, { color: theme.text, borderColor: theme.border }]}
            />
          ) : (
            <ThemedText style={[styles.title, line.approved ? { color: ApprovedInk } : null]}>
              {line.title || 'Untitled'}
            </ThemedText>
          )}
        </View>

        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fifteen minutes earlier"
            onPress={() => bumpStart(-15)}
            style={[styles.step, { backgroundColor: PlanBlue.soft, borderColor: PlanBlue.border }]}>
            <ThemedText type="small" style={{ color: PlanBlue.deep }}>−15</ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fifteen minutes later"
            onPress={() => bumpStart(15)}
            style={[styles.step, { backgroundColor: PlanBlue.soft, borderColor: PlanBlue.border }]}>
            <ThemedText type="small" style={{ color: PlanBlue.deep }}>+15</ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={editing ? 'Done editing' : 'Edit this task'}
          onPress={() => setEditing((open) => !open)}
          style={styles.iconBtn}>
          <SymbolView
            name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
            size={16}
            tintColor={editing ? ApprovedInk : theme.textSecondary}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove this task"
          onPress={onRemove}
          style={styles.iconBtn}>
          <SymbolView
            name={{ ios: 'trash', android: 'delete', web: 'delete' }}
            size={16}
            tintColor={theme.textSecondary}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={line.approved ? 'Unapprove this task' : 'Approve this task'}
          onPress={() => onChange({ ...line, approved: !line.approved })}
          style={styles.checkHit}>
          <Animated.View style={[styles.check, checkStyle]}>
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              size={15}
              tintColor={line.approved ? '#FFFFFF' : theme.textSecondary}
            />
          </Animated.View>
        </Pressable>
      </View>

      {pickingTime ? (
        <DateTimePicker
          value={dateFromMinute(startMinute)}
          mode="time"
          presentation="dialog"
          accentColor={theme.primary}
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
    </Animated.View>
  );
}

function SourceMark({ source }: { source: PlanLine['source'] }) {
  if (source === 'spoken') {
    return null;
  }

  const label = source === 'manual' ? 'Edited' : 'Suggested';
  return (
    <View accessibilityLabel={label} style={[styles.mark, { borderColor: PlanBlue.border, backgroundColor: PlanBlue.wash }]}>
      <ThemedText type="small" style={styles.markText}>
        {label}
      </ThemedText>
    </View>
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
  actions: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingRight: 6,
    gap: 2,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: ChipRadius,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chip: {
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  chipText: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: Typography.bodyMedium.fontFamily,
  },
  mark: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  markText: {
    fontSize: 10,
    lineHeight: 12,
    color: PlanBlue.mid,
    fontFamily: Typography.bodyMedium.fontFamily,
  },
  iconBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkHit: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: ChipRadius,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    ...Typography.bodyMedium,
    lineHeight: 22,
  },
  titleInput: {
    flex: 1,
    ...Typography.body,
    lineHeight: 22,
    borderWidth: 1,
    borderRadius: ChipRadius,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  step: {
    borderRadius: ChipRadius,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});
