import { type Href, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import {
  AudioModule,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import { PillButton } from '@/components/auth/pill-button';
import { BusyLock } from '@/components/talk/busy-lock';
import { PlanMic } from '@/components/talk/plan-mic';
import { useLiveWords } from '@/components/talk/use-live-words';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deviceTimezone } from '@/lib/api';
import {
  apiUrl,
  useExtractMorningMutation,
  useHearClipMutation,
  usePlanMorningMutation,
} from '@/store/api';

const MaxMs = 60_000;

type Step = 'record' | 'check';
type Line = { key: string; title: string };

function joinWords(current: string, next: string) {
  const left = current.trim();
  const right = next.trim();
  if (!right) {
    return current;
  }
  if (!left) {
    return right;
  }

  return `${left} ${right}`;
}

export function MorningWizard() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState('Tap the mic and speak.');
  const [words, setWords] = useState('');
  const [canType, setCanType] = useState(false);
  const [micBlocked, setMicBlocked] = useState(false);
  const [dayTitle, setDayTitle] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const keptWords = useRef('');

  useEffect(() => {
    if (live.words.length > 0) {
      setWords(joinWords(keptWords.current, live.words));
    }
  }, [live.words]);

  useEffect(() => {
    void (async () => {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setMicBlocked(true);
        setCanType(true);
        setNote('Mic is blocked. Type the day.');
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
    keptWords.current = words;
    setNote('Listening. Check sends it. X tosses it.');
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function discard() {
    await recorder.stop();
    setNote('Tossed. Tap the mic and speak.');
  }

  async function stopAndHear() {
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) {
      setNote('Nothing was recorded. Tap the mic and speak.');
      return;
    }

    setCanType(true);
    setBusy('Sending your voice…');
    try {
      const heard = await hearClip({ uri }).unwrap();
      if (heard.transcript.trim().length > 0) {
        setWords((current) => joinWords(current, heard.transcript));
      }
      setNote('Fix anything we misheard, then continue.');
    } catch (error) {
      const status =
        error && typeof error === 'object' && 'status' in error
          ? String((error as { status: unknown }).status)
          : 'failed';
      if (status === '422') {
        setNote('We got the clip, but no words came back. Try again closer to the phone — or type them.');
        return;
      }

      const detail =
        error && typeof error === 'object' && 'error' in error
          ? String((error as { error: unknown }).error)
          : '';
      setNote(
        `Could not hear that clip (${status}${detail ? ` ${detail}` : ''} → ${apiUrl}). Keep your words, or type them.`,
      );
    } finally {
      setBusy(null);
    }
  }

  async function extract() {
    const transcript = words.trim();
    if (!transcript) {
      setNote('Say or type the day first.');
      return;
    }

    setBusy('Finding the plan in your words…');
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
      setCanType(true);
      setNote('Could not extract a plan. Edit the words and try again.');
    } finally {
      setBusy(null);
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

  const showBack = step !== 'record';
  const header = (
    <View style={styles.header}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Today"
          hitSlop={12}
          onPress={() => router.navigate('/today' as Href)}
          style={styles.back}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            size={20}
            tintColor={theme.text}
          />
        </Pressable>
      ) : null}
      <ThemedText style={styles.screenTitle}>
        {step === 'check' ? 'Check the plan' : 'Plan your day'}
      </ThemedText>
    </View>
  );

  if (step === 'check') {
    return (
      <View style={[styles.page, { paddingTop: insets.top + Spacing.three }]}>
        <BusyLock message={busy} />
        {header}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.checkBody}
          showsVerticalScrollIndicator={false}>
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
        </ScrollView>
      </View>
    );
  }

  const allowType = canType || micBlocked;

  return (
    <KeyboardAvoidingView
      style={[styles.page, { paddingTop: insets.top + Spacing.three }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <BusyLock message={busy} />
      {header}
      <ThemedText themeColor="textSecondary" style={styles.subtitle}>
        Speak it. Then we book it.
      </ThemedText>
      <View
        style={[
          styles.words,
          {
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
          },
        ]}>
        {allowType ? (
          <TextInput
            value={words}
            onChangeText={setWords}
            multiline
            placeholder="Fix anything we misheard, or type here."
            placeholderTextColor={theme.textSecondary}
            style={[styles.wordsInput, { color: theme.text }]}
          />
        ) : (
          <ThemedText themeColor="textSecondary" style={styles.wordsInput}>
            {rec.isRecording
              ? live.liveAvailable
                ? live.words || 'Listening…'
                : 'Listening… words appear when you stop.'
              : 'Tap the mic and speak.'}
          </ThemedText>
        )}
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
        {rec.isRecording ? 'Listening. Check sends it. X tosses it.' : note}
      </ThemedText>
      <PlanMic
        recording={rec.isRecording}
        durationMillis={rec.durationMillis}
        metering={rec.metering}
        onStart={() => void start()}
        onSend={() => void stopAndHear()}
        onDiscard={() => void discard()}
      />
      <PillButton
        label="Continue"
        disabled={words.trim().length === 0}
        onPress={() => void extract()}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  back: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  screenTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 22,
    lineHeight: 28,
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  words: {
    flex: 1,
    width: '100%',
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.three,
  },
  wordsInput: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 18,
    lineHeight: 26,
    textAlignVertical: 'top',
  },
  note: {
    alignSelf: 'stretch',
  },
  checkBody: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
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
