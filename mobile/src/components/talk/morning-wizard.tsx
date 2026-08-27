import { type Href, router } from 'expo-router';
// live captions come from useTalkTake, not a second mic
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
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  AudioModule,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import { PillButton } from '@/components/auth/pill-button';
import { BusyLock } from '@/components/talk/busy-lock';
import { agendaSummary } from '@/components/talk/day-agenda';
import { PlanMic } from '@/components/talk/plan-mic';
import { type PlanLine } from '@/components/talk/plan-task-card';
import { PlanSortList } from '@/components/talk/plan-sort-list';
import { useTalkTake } from '@/components/talk/use-talk-take';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deviceTimezone, type SpokenWord } from '@/lib/api';
import { ClipRecord } from '@/lib/clip-record';
import { clockToMinute, minuteToClock, spokenMinuteNow } from '@/lib/clock';
import { rememberWords } from '@/lib/day-notes';
import { layOut } from '@/lib/lay-out';
import {
  apiUrl,
  useExtractMorningMutation,
  useHearClipMutation,
  usePlanMorningMutation,
} from '@/store/api';

const MaxMs = 60_000;

type Step = 'record' | 'check';
function emptyLine(after?: PlanLine): PlanLine {
  const previous = after ? clockToMinute(after.start) : null;
  const duration = after ? parseMinutes(after.minutes) ?? 30 : 0;
  const start = previous != null ? previous + duration : spokenMinuteNow();
  return {
    key: String(Date.now()),
    title: '',
    minutes: '30',
    start: minuteToClock(start),
    area: 'PERSONAL',
    source: 'manual',
    approved: false,
  };
}

function parseMinutes(raw: string) {
  const value = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

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
  const recorder = useAudioRecorder(ClipRecord);
  const rec = useAudioRecorderState(recorder, 80);
  const talk = useTalkTake();
  const [hearClip] = useHearClipMutation();
  const [extractMorning] = useExtractMorningMutation();
  const [planMorning, saveState] = usePlanMorningMutation();
  const isRecording = talk.available ? talk.recording : rec.isRecording;
  const durationMillis = talk.available ? talk.durationMillis : rec.durationMillis;
  const metering = talk.available ? talk.metering : rec.metering;

  const [step, setStep] = useState<Step>('record');
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState('Tap the mic and speak.');
  const [words, setWords] = useState('');
  const [canType, setCanType] = useState(false);
  const [micBlocked, setMicBlocked] = useState(false);
  const [dayTitle, setDayTitle] = useState('');
  const [lines, setLines] = useState<PlanLine[]>([]);
  const [dragging, setDragging] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [clipKey, setClipKey] = useState<string | null>(null);
  const [clipWords, setClipWords] = useState<SpokenWord[] | null>(null);
  const keptWords = useRef('');
  const extractedFor = useRef('');

  useEffect(() => {
    if (talk.words.length > 0) {
      setWords(joinWords(keptWords.current, talk.words));
    }
  }, [talk.words]);

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
    if (isRecording && durationMillis >= MaxMs) {
      void stopAndHear();
    }
  }, [durationMillis, isRecording]);

  async function start() {
    keptWords.current = words;
    setNote('Listening. Check sends it. X tosses it.');
    if (talk.available) {
      try {
        await talk.start();
        return;
      } catch {
        // Native speech is missing or the mic is busy — use the recorder.
      }
    }

    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function discard() {
    if (talk.available) {
      talk.discard();
    } else {
      await recorder.stop();
    }
    setNote('Tossed. Tap the mic and speak.');
  }

  async function stopAndHear() {
    const uri = talk.available ? await talk.stop() : (await recorder.stop(), recorder.uri);
    if (!uri) {
      if (talk.words.trim().length > 0) {
        setCanType(true);
        setNote('Fix anything we misheard, then continue.');
        return;
      }

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
      if (heard.storageKey) {
        setClipKey(heard.storageKey);
      }
      if (heard.words && heard.words.length > 0) {
        setClipWords(heard.words);
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

    if (extractedFor.current === transcript && lines.length > 0) {
      setCheckError(null);
      setStep('check');
      return;
    }

    setBusy('Finding the plan in your words…');
    try {
      const draft = await extractMorning({
        transcript,
        timezone,
        spokenAt: new Date().toISOString(),
      }).unwrap();
      const namedTimes = new Set(
        draft.commitments
          .filter((item) => item.plannedStartMinute != null)
          .map((item) => item.title.trim().toLowerCase()),
      );
      const scheduled = layOut(draft.commitments, spokenMinuteNow());
      setDayTitle(draft.title ?? '');
      setLines(
        scheduled.map((item, index) => ({
          key: `${index}-${item.title}`,
          title: item.title,
          minutes: item.plannedDurationMinutes ? String(item.plannedDurationMinutes) : '30',
          start: minuteToClock(item.plannedStartMinute),
          area: item.lifeArea ?? 'PERSONAL',
          source: namedTimes.has(item.title.trim().toLowerCase()) ? 'spoken' : 'inferred',
          approved: false,
        })),
      );
      if (scheduled.length === 0) {
        setLines([emptyLine()]);
      }
      extractedFor.current = transcript;
      setCheckError(null);
      setStep('check');
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
      .filter((line) => line.approved)
      .map((line) => ({
        title: line.title.trim(),
        plannedDurationMinutes: parseMinutes(line.minutes),
        plannedStartMinute: clockToMinute(line.start),
        lifeArea: line.area.trim() || null,
      }))
      .filter((item) => item.title.length > 0);
    if (!transcript || commitments.length === 0) {
      setCheckError('Approve at least one task, or tap the checkmark.');
      return;
    }

    try {
      const saved = await planMorning({
        timezone,
        transcript,
        title: dayTitle.trim() || null,
        storageKey: clipKey,
        words: clipWords,
        commitments,
      }).unwrap();
      await rememberWords(saved.localDate, transcript);
      setClipKey(null);
      setClipWords(null);
      setStep('record');
      router.navigate('/history' as Href);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { error?: string } }).data?.error ?? '')
          : '';
      setCheckError(message || 'Could not save the morning plan.');
    }
  }

  const showBack = step !== 'record';
  const header = (
    <View style={styles.header}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to your words"
          hitSlop={12}
          onPress={() => {
            setCanType(words.trim().length > 0);
            setStep('record');
          }}
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
          scrollEnabled={!dragging}
          contentContainerStyle={styles.checkBody}
          showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.duration(280)} style={styles.dayNameRow}>
            <ThemedText type="small" themeColor="textSecondary">
              Day name
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="How we built this day"
              hitSlop={10}
              onPress={() => setShowHint((open) => !open)}
              style={styles.hintBtn}>
              <SymbolView
                name={{
                  ios: 'questionmark.circle',
                  android: 'help_outline',
                  web: 'help_outline',
                }}
                size={16}
                tintColor={theme.textSecondary}
              />
            </Pressable>
          </Animated.View>
          {showHint ? (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={[styles.hint, { backgroundColor: theme.primary }]}>
              <ThemedText type="smallBold" style={styles.bannerTitle}>
                We turned your words into a day
              </ThemedText>
              <ThemedText type="small" style={styles.bannerBody}>
                {agendaSummary(
                  lines
                    .filter((line) => line.title.trim().length > 0)
                    .map((line) => ({
                      key: line.key,
                      title: line.title,
                      plannedStartMinute: clockToMinute(line.start),
                      plannedDurationMinutes: parseMinutes(line.minutes),
                      lifeArea: line.area,
                    })),
                )}
                {lines.some((line) => line.source === 'inferred')
                  ? ' · Things without a time start from when you spoke, in the open gaps.'
                  : ''}
              </ThemedText>
            </Animated.View>
          ) : null}
          <Animated.View entering={FadeInDown.duration(320).delay(40)}>
            <TextInput
              value={dayTitle}
              onChangeText={setDayTitle}
              placeholder="Name this day"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.titleInput,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
            />
          </Animated.View>
          <ThemedText type="small" themeColor="textSecondary">
            Tasks
          </ThemedText>
          <PlanSortList
            lines={lines}
            onChange={(next) =>
              setLines((current) => current.map((item) => (item.key === next.key ? next : item)))
            }
            onRemove={(key) => setLines((current) => current.filter((item) => item.key !== key))}
            onReorder={setLines}
            onDragChange={setDragging}
          />
          <Animated.View entering={FadeInUp.duration(280).delay(160)} style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add another task"
              onPress={() =>
                setLines((current) => [...current, emptyLine(current[current.length - 1])])
              }
              style={[styles.plus, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
              <SymbolView
                name={{ ios: 'plus', android: 'add', web: 'add' }}
                size={22}
                tintColor="#FFFFFF"
              />
            </Pressable>
            {checkError ? (
              <ThemedText type="small" themeColor="textSecondary">
                {checkError}
              </ThemedText>
            ) : null}
            <PillButton
              label={
                lines.every((line) => line.approved)
                  ? 'Save the day'
                  : `Save ${lines.filter((line) => line.approved).length} approved`
              }
              loading={saveState.isLoading}
              onPress={() => void save()}
            />
          </Animated.View>
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
        {isRecording ? (
          <ThemedText style={[styles.wordsInput, { color: theme.text }]}>
            {words || 'Listening…'}
          </ThemedText>
        ) : allowType ? (
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
            Tap the mic and speak.
          </ThemedText>
        )}
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
        {isRecording ? 'Listening. Check sends it. X tosses it.' : note}
      </ThemedText>
      <PlanMic
        recording={isRecording}
        durationMillis={durationMillis}
        metering={metering}
        onStart={() => void start()}
        onSend={() => void stopAndHear()}
        onDiscard={() => void discard()}
      />
      {canType && words.trim().length > 0 ? (
        <View style={styles.continueRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue to the plan"
            onPress={() => void extract()}
            style={[styles.continue, { backgroundColor: theme.primary }]}>
            <ThemedText type="small" style={styles.continueLabel}>
              Continue
            </ThemedText>
          </Pressable>
        </View>
      ) : null}
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
    fontFamily: FontFamily.medium,
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
    fontFamily: FontFamily.regular,
    fontSize: 17,
    lineHeight: 26,
    textAlignVertical: 'top',
  },
  continueRow: {
    alignItems: 'flex-end',
  },
  continue: {
    minHeight: 40,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueLabel: {
    color: '#FFFFFF',
    fontFamily: FontFamily.medium,
  },
  note: {
    alignSelf: 'stretch',
  },
  checkBody: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  dayNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    borderRadius: 10,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  footer: {
    gap: Spacing.three,
    alignItems: 'center',
  },
  plus: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    color: '#FFFFFF',
  },
  bannerBody: {
    color: '#FFFFFF',
  },
  titleInput: {
    width: '100%',
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 22,
  },
});
