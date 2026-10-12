import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SymbolView } from 'expo-symbols';
import Animated, {
  FadeInDown,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { PlanCheckTaskRow } from '@/components/talk/plan-check-task-row';
import { type PlanLine, PlanTaskCard } from '@/components/talk/plan-task-card';
import { ThemedText } from '@/components/themed-text';
import { PlanBlue } from '@/constants/plan-theme';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { clockLabel, clockToMinute, minutesLabel } from '@/lib/clock';
import { moveItem, reflowStarts } from '@/lib/plan-order';

const RowStride = 148;
const CompactRowStride = 64;

export function PlanSortList({
  lines,
  onChange,
  onRemove,
  onReorder,
  onDragChange,
  compact = false,
}: {
  lines: PlanLine[];
  onChange: (next: PlanLine) => void;
  onRemove: (key: string) => void;
  onReorder: (next: PlanLine[]) => void;
  onDragChange: (active: boolean) => void;
  compact?: boolean;
}) {
  function move(from: number, to: number) {
    onReorder(reflowStarts(moveItem(lines, from, to)));
  }

  return (
    <View style={styles.list}>
      {lines.map((line, index) => (
        <View key={line.key}>
          <SortableRow
            compact={compact}
            index={index}
            count={lines.length}
            line={line}
            onChange={onChange}
            onRemove={() => onRemove(line.key)}
            onMove={move}
            onDragChange={onDragChange}
          />
          {!compact && index < lines.length - 1 ? (
            <Transition from={line} to={lines[index + 1]} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

function Transition({ from, to }: { from: PlanLine; to: PlanLine }) {
  const start = clockToMinute(from.start) ?? 0;
  const duration = Number.parseInt(from.minutes, 10);
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 30;
  const next = clockToMinute(to.start);
  const end = start + safeDuration;
  const gap = next == null ? 0 : next - end;
  const length = minutesLabel(safeDuration);
  const wait = gap > 0 ? minutesLabel(gap) : null;

  return (
    <View style={styles.transition} accessibilityElementsHidden>
      <View style={[styles.rail, { backgroundColor: PlanBlue.border }]} />
      <ThemedText type="small" style={[styles.transitionLabel, { color: PlanBlue.mid }]}>
        {wait ? `${length} · ${wait} later` : `${length} · then ${clockLabel(next) || 'next'}`}
      </ThemedText>
      <View style={[styles.rail, { backgroundColor: PlanBlue.border }]} />
    </View>
  );
}

function SortableRow({
  compact,
  index,
  count,
  line,
  onChange,
  onRemove,
  onMove,
  onDragChange,
}: {
  compact: boolean;
  index: number;
  count: number;
  line: PlanLine;
  onChange: (next: PlanLine) => void;
  onRemove: () => void;
  onMove: (from: number, to: number) => void;
  onDragChange: (active: boolean) => void;
}) {
  const theme = useTheme();
  const translateY = useSharedValue(0);
  const lifted = useSharedValue(0);

  const pan = Gesture.Pan()
    .activateAfterLongPress(140)
    .onStart(() => {
      lifted.value = withSpring(1);
      runOnJS(onDragChange)(true);
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const stride = compact ? CompactRowStride : RowStride;
      const shift = Math.round(event.translationY / stride);
      const to = Math.max(0, Math.min(count - 1, index + shift));
      translateY.value = withSpring(0);
      lifted.value = withSpring(0);
      runOnJS(onDragChange)(false);
      if (to !== index) {
        runOnJS(onMove)(index, to);
      }
    })
    .onFinalize(() => {
      translateY.value = withSpring(0);
      lifted.value = withSpring(0);
      runOnJS(onDragChange)(false);
    });

  const style = useAnimatedStyle(() => ({
    zIndex: lifted.value > 0 ? 4 : 0,
    transform: [{ translateY: translateY.value }, { scale: 1 + lifted.value * 0.03 }],
    shadowColor: theme.text,
    shadowOpacity: lifted.value * 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: lifted.value > 0 ? 6 : 0,
  }));

  return (
    <Animated.View
      entering={compact ? undefined : FadeInDown.duration(280).delay(index * 40)}
      layout={compact ? undefined : LinearTransition.springify().damping(18)}
      style={[styles.row, style]}>
      {compact ? (
        <PlanCheckTaskRow
          line={line}
          onChange={onChange}
          onRemove={onRemove}
          handle={
            <GestureDetector gesture={pan}>
              <View accessibilityRole="adjustable" accessibilityLabel="Drag to reorder" hitSlop={8} style={styles.grip}>
                <SymbolView
                  name={{ ios: 'line.3.horizontal', android: 'drag_handle', web: 'drag_handle' }}
                  size={16}
                  tintColor={theme.textSecondary}
                />
              </View>
            </GestureDetector>
          }
        />
      ) : (
        <PlanTaskCard
          line={line}
          onChange={onChange}
          onRemove={onRemove}
          handle={
            <GestureDetector gesture={pan}>
              <View
                accessibilityRole="adjustable"
                accessibilityLabel="Drag to reorder"
                hitSlop={8}
                style={styles.grip}>
                <SymbolView
                  name={{
                    ios: 'line.3.horizontal',
                    android: 'drag_handle',
                    web: 'drag_handle',
                  }}
                  size={16}
                  tintColor={theme.textSecondary}
                />
              </View>
            </GestureDetector>
          }
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  row: {
    borderRadius: 10,
  },
  grip: {
    width: 22,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
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
  transitionLabel: {
    textAlign: 'center',
  },
});
