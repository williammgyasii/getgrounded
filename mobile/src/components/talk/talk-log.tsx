import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { PillButton } from '@/components/auth/pill-button';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deviceTimezone } from '@/lib/api';
import { useGetDeskQuery, usePlanMorningMutation, useReflectEveningMutation } from '@/store/api';

export function TalkLog() {
  const theme = useTheme();
  const timezone = deviceTimezone();
  const { data: desk, refetch: refetchDesk } = useGetDeskQuery(timezone);
  const [planMorning, planState] = usePlanMorningMutation();
  const [reflectEvening, reflectState] = useReflectEveningMutation();
  const [speech, setSpeech] = useState('');
  const [note, setNote] = useState('One line is one commitment. Wins start with "win:". Voice clips come next.');
  const busy = planState.isLoading || reflectState.isLoading;

  async function onPlan() {
    const transcript = speech.trim();
    if (!transcript) {
      setNote('Say or type the day first.');
      return;
    }

    const titles = transcript
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.toLowerCase().startsWith('win:'));

    try {
      await planMorning({ timezone, transcript, titles }).unwrap();
      setNote('Morning is in the book. Today will show the plan.');
      setSpeech('');
    } catch {
      setNote('Could not save the morning plan.');
    }
  }

  async function onReflect() {
    const transcript = speech.trim();
    if (!transcript) {
      setNote('Say or type what happened first.');
      return;
    }

    try {
      const latest = (await refetchDesk()).data;
      const outcomes = (latest?.today?.commitments ?? []).map((item) => ({
        id: item.id,
        status: item.status === 'PLANNED' ? 'MISSED' : item.status,
      }));
      const wins = transcript
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.toLowerCase().startsWith('win:'))
        .map((line) => line.slice(4).trim())
        .filter((line) => line.length > 0);
      await reflectEvening({ timezone, transcript, outcomes, wins }).unwrap();
      setNote('Evening is in the book. History and the streak will move.');
      setSpeech('');
    } catch {
      setNote('Could not save the evening.');
    }
  }

  return (
    <View style={styles.wrap}>
      <TextInput
        value={speech}
        onChangeText={setSpeech}
        multiline
        placeholder="Gym at 7&#10;Read 20 minutes&#10;win: Cleaned the kitchen"
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          {
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
      />
      <ThemedText type="small" themeColor="textSecondary">
        {note}
      </ThemedText>
      <PillButton label="Plan today" loading={busy} onPress={onPlan} />
      <PillButton label="Reflect" variant="secondary" loading={busy} onPress={onReflect} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: Spacing.three,
  },
  input: {
    minHeight: 140,
    borderWidth: 1,
    borderRadius: Radius.field,
    padding: Spacing.three,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
});
