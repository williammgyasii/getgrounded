import { type Href, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import {
  AudioModule,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import { PillButton } from '@/components/auth/pill-button';
import { PlanMic } from '@/components/talk/plan-mic';
import { useLiveWords } from '@/components/talk/use-live-words';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deviceTimezone } from '@/lib/api';
import {
  apiUrl,
  useExtractMorningMutation,
  useHearClipMutation,
  usePlanMorningMutation,
} from '@/store/api';

const MaxMs = 60_000;

type Step = 'record' | 'thinking' | 'check';
type Line = { key: string; title: string };

export function MorningWizard() {
  const theme = useTheme();
  const timezone = deviceTimezone();
  const recorder = useAudioRecorder({
    extension: '.m4a',
    sampleRate: 16_000,
    numberOfChannels: 1,
    bitRate: 64_000,
    isMeteringEnabled: true,
    android: {
      outputFormat: 'mpeg4',
      audioEncoder: 'aac',
    },
    ios: {
      outputFormat: 'aac ',
      audioQuality: 0x60,
    },
  });
  const rec = useAudioRecorderState(recorder, 80);
  const [hearClip] = useHearClipMutation();
  const [extractMorning] = useExtractMorningMutation();
  const [planMorning, saveState] = usePlanMorningMutation();
  const live = useLiveWords(rec.isRecording);

  const [step, setStep] = useState<Step>('record');
  const [note, setNote] = useState('Tap the forest mic. Speak the plan.');
  const [words, setWords] = useState('');
  const [dayTitle, setDayTitle] = useState('');
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    if (live.words.length > 0) {
      setWords(live.words);
    }
  }, [live.words]);

  useEffect(() => {
    void (async () => {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setNote('Mic is blocked. Type the day in the words box.');
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
    setNote('Listening. Tap the mic when you are done.');
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function stopAndHear() {
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) {
      setNote('Nothing was recorded. Tap the forest mic and speak.');
      return;
    }

    setNote('Hearing you.');
    try {
      const heard = await hearClip({ uri }).unwrap();
      if (heard.transcript.trim().length > 0) {
        setWords(heard.transcript);
      }
      setNote('Fix anything we misheard, then continue.');
    } catch (error) {
      const status =
        error && typeof error === 'object' && 'status' in error
          ? String((error as { status: unknown }).status)
          : 'failed';
      if (status === '422') {
        setNote('We did not catch any words. Speak a bit longer, then tap again — or type them.');
        return;
      }

      const detail =
        error && typeof error === 'object' && 'error' in error
          ? String((error as { error: unknown }).error)
          : '';
      setNote(
        `Could not hear that clip (${status}${detail ? ` ${detail}` : ''} → ${apiUrl}). Keep your words, or type them.`,
      );
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
      setStep('record');
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

  if (step === 'check') {
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
              setLines((current) =>
                current.map((item) => (item.key === line.key ? { ...item, title } : item)),
              )
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
        <Pressable onPress={() => setStep('record')} accessibilityRole="button">
          <ThemedText type="small" themeColor="textSecondary" style={styles.toggle}>
            Edit your words
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.words,
          {
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
          },
        ]}>
        <ThemedText type="smallBold">Your words</ThemedText>
        <TextInput
          value={words}
          onChangeText={setWords}
          multiline
          placeholder={
            rec.isRecording
              ? live.liveAvailable
                ? 'Listening…'
                : 'Listening… words appear when you stop.'
              : 'Tap the mic and speak. Or type here.'
          }
          placeholderTextColor={theme.textSecondary}
          style={[styles.wordsInput, { color: theme.text }]}
        />
      </View>
      <PlanMic
        recording={rec.isRecording}
        metering={rec.metering}
        onPress={() => {
          void (rec.isRecording ? stopAndHear() : start());
        }}
      />
      <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
        {note}
      </ThemedText>
      <PillButton label="Continue" disabled={words.trim().length === 0} onPress={() => void extract()} />
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
  words: {
    width: '100%',
    minHeight: 140,
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  wordsInput: {
    minHeight: 88,
    fontFamily: FontFamily.medium,
    fontSize: 18,
    lineHeight: 26,
    textAlignVertical: 'top',
  },
  note: {
    textAlign: 'center',
  },
  toggle: {
    textDecorationLine: 'underline',
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
