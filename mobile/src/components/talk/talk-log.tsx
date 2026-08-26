import { type Href, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { PillButton } from '@/components/auth/pill-button';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deviceTimezone } from '@/lib/api';
import { usePlanMorningMutation } from '@/store/api';

export function TalkLog() {
  const theme = useTheme();
  const timezone = deviceTimezone();
  const [planMorning, planState] = usePlanMorningMutation();
  const [speech, setSpeech] = useState('');
  const [note, setNote] = useState('Type the plan. One line is one commitment.');
  const busy = planState.isLoading;

  async function onPlan() {
    const transcript = speech.trim();
    if (!transcript) {
      setNote('Say or type the day first.');
      return;
    }

    const titles = transcript
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    try {
      await planMorning({
        timezone,
        transcript,
        commitments: titles.map((title) => ({ title })),
      }).unwrap();
      router.replace('/today' as Href);
    } catch {
      setNote('Could not save the morning plan.');
    }
  }

  return (
    <View style={styles.wrap}>
      <TextInput
        value={speech}
        onChangeText={setSpeech}
        multiline
        placeholder={'Gym at 7\nRead 20 minutes'}
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
