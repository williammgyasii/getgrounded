import { type Href, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import { PillButton } from '@/components/auth/pill-button';
import { MicWaves } from '@/components/talk/mic-waves';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deviceTimezone } from '@/lib/api';
import {
  useExtractMorningMutation,
  useHearClipMutation,
  usePlanMorningMutation,
} from '@/store/api';

const MaxMs = 60_000;

type Step = 'record' | 'words' | 'thinking' | 'check';
type Line = { key: string; title: string };

export function MorningWizard() {
  const theme = useTheme();
  const timezone = deviceTimezone();
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const rec = useAudioRecorderState(recorder, 80);
  const [hearClip] = useHearClipMutation();
  const [extractMorning] = useExtractMorningMutation();
  const [planMorning, saveState] = usePlanMorningMutation();

  const [step, setStep] = useState<Step>('record');
  const [note, setNote] = useState('Tap the forest button. Speak the plan.');
  const [words, setWords] = useState('');
  const [dayTitle, setDayTitle] = useState('');
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    void (async () => {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setNote('Mic is blocked. Type the day instead.');
        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  useEffect(() => {
    if (rec.isRecording && rec.durationMillis >= MaxMs) {
      void stopAndHear();
    }
  }, [rec.durationMillis, rec.isRecording]);

  async function start() {
    setNote('Listening. Tap again when you are done.');
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function stopAndHear() {
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) {
      setNote('Nothing was recorded. Tap the forest button and speak.');
      return;
    }

    setStep('thinking');
    setNote('Hearing you.');
    try {
      const heard = await hearClip({ uri }).unwrap();
      setWords(heard.transcript);
      setStep('words');
      setNote('Fix anything we misheard, then continue.');
    } catch {
      setStep('record');
      setNote('Could not hear that clip. Try again, or type it.');
    }
  }

  async function extract() {
    const transcript = words.trim();
    if (!transcript) {
      setNote('Say or type the day first.');
      return;
    }

    setStep('thinking');
    setNote('Finding the plan in your words.');
    try {
      const draft = await extractMorning({ transcript }).unwrap();
      setDayTitle(draft.title ?? '');
      setLines(
        draft.commitments.map((item, index) => ({
          key: `${index}-${item.title}`,
          title: item.title,
        })),
      );
      if (draft.commitments.length === 0) {
        setLines([{ key: 'empty', title: '' }]);
      }
      setStep('check');
      setNote('Edit the plan, name the day, then save.');
    } catch {
      setStep('words');
      setNote('Could not extract a plan. Edit the words and try again.');
    }
  }

  async function save() {
    const transcript = words.trim();
    const commitments = lines
      .map((line) => ({ title: line.title.trim() }))
      .filter((item) => item.title.length > 0);
    if (!transcript || commitments.length === 0) {
      setNote('Keep at least one commitment.');
      return;
    }

    try {
      await planMorning({
        timezone,
        transcript,
        title: dayTitle.trim() || null,
        commitments,
      }).unwrap();
      router.replace('/today' as Href);
    } catch {
      setNote('Could not save the morning plan.');
    }
  }

  const seconds = Math.min(60, Math.round(rec.durationMillis / 1000));

  if (step === 'record') {
    return (
      <View style={styles.wrap}>
        <MicWaves metering={rec.metering} active={rec.isRecording} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={rec.isRecording ? 'Stop recording' : 'Start recording'}
          onPress={() => {
            void (rec.isRecording ? stopAndHear() : start());
          }}
          style={({ pressed }) => [
            styles.mic,
            {
              backgroundColor: rec.isRecording ? theme.text : theme.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <ThemedText style={[styles.micLabel, { color: theme.primaryOn }]}>
            {rec.isRecording ? 'Stop' : 'Talk'}
          </ThemedText>
          <ThemedText style={[styles.timer, { color: theme.primaryOn }]}>
            {rec.isRecording ? `${seconds}s` : 'tap'}
          </ThemedText>
        </Pressable>
        <ThemedText type="small" themeColor="textSecondary">
          {note}
        </ThemedText>
        <Pressable
          onPress={() => {
            setStep('words');
            setNote('Type the plan. Then we will extract it.');
          }}
          accessibilityRole="button">
          <ThemedText type="small" themeColor="textSecondary" style={styles.toggle}>
            Type instead
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  if (step === 'thinking') {
    return (
      <View style={styles.wrap}>
        <ThemedText style={styles.stepTitle}>Thinking</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {note}
        </ThemedText>
      </View>
    );
  }

  if (step === 'words') {
    return (
      <View style={styles.wrap}>
        <ThemedText style={styles.stepTitle}>Your words</ThemedText>
        <TextInput
          value={words}
          onChangeText={setWords}
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
        <PillButton label="Continue" onPress={() => void extract()} />
        <Pressable onPress={() => setStep('record')} accessibilityRole="button">
          <ThemedText type="small" themeColor="textSecondary" style={styles.toggle}>
            Back to the mic
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.stepTitle}>Check the plan</ThemedText>
      <TextInput
        value={dayTitle}
        onChangeText={setDayTitle}
        placeholder="Name this day"
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.titleInput,
          {
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
      />
      {lines.map((line) => (
        <TextInput
          key={line.key}
          value={line.title}
          onChangeText={(title) =>
            setLines((current) => current.map((item) => (item.key === line.key ? { ...item, title } : item)))
          }
          placeholder="A commitment"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.line,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
        />
      ))}
      <Pressable
        onPress={() => setLines((current) => [...current, { key: String(Date.now()), title: '' }])}
        accessibilityRole="button">
        <ThemedText type="small" themeColor="textSecondary" style={styles.toggle}>
          Add another
        </ThemedText>
      </Pressable>
      <ThemedText type="small" themeColor="textSecondary">
        {note}
      </ThemedText>
      <PillButton label="Save" loading={saveState.isLoading} onPress={() => void save()} />
      <Pressable onPress={() => setStep('words')} accessibilityRole="button">
        <ThemedText type="small" themeColor="textSecondary" style={styles.toggle}>
          Edit your words
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: Spacing.three,
    alignItems: 'center',
  },
  stepTitle: {
    alignSelf: 'stretch',
    fontFamily: FontFamily.semibold,
    fontSize: 22,
    lineHeight: 28,
  },
  mic: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  micLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 28,
    lineHeight: 34,
  },
  timer: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
  },
  toggle: {
    textDecorationLine: 'underline',
  },
  input: {
    width: '100%',
    minHeight: 140,
    borderWidth: 1,
    borderRadius: Radius.field,
    padding: Spacing.three,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  titleInput: {
    width: '100%',
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Radius.field,
    paddingHorizontal: Spacing.three,
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  line: {
    width: '100%',
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.field,
    paddingHorizontal: Spacing.three,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
  },
});
