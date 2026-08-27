import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { clockLabel, dateFromMinute } from '@/lib/clock';
import { useReflectHours, useReflectOpen } from '@/lib/reflect-settings';
import { timezoneCaption } from '@/lib/reflect-window';
import { reflectTimezones } from '@/lib/time-zones';

type Field = 'start' | 'end';

export function ReflectHoursCard() {
  const theme = useTheme();
  const hours = useReflectHours();
  const inWindow = useReflectOpen();
  const [field, setField] = useState<Field | null>(null);
  const [zonesOpen, setZonesOpen] = useState(false);

  async function pick(next: Field, date: Date) {
    const minute = date.getHours() * 60 + date.getMinutes();
    setField(null);
    if (next === 'start') {
      await hours.save({ startMinute: minute });
      return;
    }
    await hours.save({ endMinute: minute });
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
      <ThemedText type="smallBold">Reflect window</ThemedText>
      <ThemedText themeColor="textSecondary">
        From–to in this timezone, plus one hour after the end. Changes save as you pick them.
      </ThemedText>
      {inWindow ? (
        <ThemedText type="smallBold" themeColor="accent">
          You're in that window now.
        </ThemedText>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change timezone"
        onPress={() => setZonesOpen(true)}
        style={[styles.zone, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <ThemedText type="small" themeColor="textSecondary">
          Timezone
        </ThemedText>
        <ThemedText type="smallBold">{timezoneCaption(hours.timezone)}</ThemedText>
      </Pressable>
      <View style={styles.times}>
        <TimeChip
          label="From"
          minute={hours.startMinute}
          onPress={() => setField('start')}
        />
        <TimeChip label="To" minute={hours.endMinute} onPress={() => setField('end')} />
      </View>
      {field ? (
        <DateTimePicker
          value={dateFromMinute(field === 'start' ? hours.startMinute : hours.endMinute)}
          mode="time"
          presentation="dialog"
          accentColor={theme.primary}
          onValueChange={(_, date) => {
            if (date) {
              void pick(field, date);
            }
          }}
          onDismiss={() => setField(null)}
        />
      ) : null}
      <Modal visible={zonesOpen} transparent animationType="fade" onRequestClose={() => setZonesOpen(false)}>
        <View style={styles.scrim}>
          <Pressable style={styles.dismiss} onPress={() => setZonesOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: theme.background }]}>
            <ThemedText type="smallBold">Timezone</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              The window uses this clock, not the phone’s if they differ.
            </ThemedText>
            <ScrollView style={styles.zoneList}>
              {reflectTimezones(hours.timezone).map((zone) => {
                const selected = zone === hours.timezone;
                return (
                  <Pressable
                    key={zone}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      void hours.save({ timezone: zone });
                      setZonesOpen(false);
                    }}
                    style={[
                      styles.zoneRow,
                      {
                        backgroundColor: selected ? theme.backgroundSelected : theme.card,
                        borderColor: theme.border,
                      },
                    ]}>
                    <ThemedText type="smallBold">{timezoneCaption(zone)}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {zone.replace(/_/g, ' ')}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TimeChip({ label, minute, onPress }: { label: string; minute: number; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} ${clockLabel(minute)}`}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText style={styles.chipTime}>{clockLabel(minute)}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  zone: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    gap: 2,
  },
  times: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    gap: 2,
  },
  chipTime: {
    fontSize: 20,
    lineHeight: 26,
  },
  scrim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(36, 48, 86, 0.35)',
  },
  dismiss: {
    flex: 1,
  },
  sheet: {
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  zoneList: {
    maxHeight: 360,
  },
  zoneRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    marginBottom: Spacing.two,
    gap: 2,
  },
});
