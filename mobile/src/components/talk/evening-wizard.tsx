import { type Href, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { HappenedCard, type HappenedWin } from '@/components/talk/happened-card';
import { PlanMic } from '@/components/talk/plan-mic';
import { RecapPrompt } from '@/components/talk/recap-prompt';
import { TruthCard, type TruthRow } from '@/components/talk/truth-card';
import { useTalkTake } from '@/components/talk/use-talk-take';
import { ThemedText } from '@/components/themed-text';
import { Typography, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deviceTimezone, type DayRecord, type SpokenWord } from '@/lib/api';
import { ClipRecord } from '@/lib/clip-record';
import { rememberWords } from '@/lib/day-notes';
import { longDayLabel } from '@/lib/day-tasks';
import { heardIds } from '@/lib/spoken-match';
import {
  apiUrl,
  useExtractEveningMutation,
  useHearClipMutation,
  useReflectEveningMutation,
} from '@/store/api';

const MaxMs = 60_000;

type Step = 'speak' | 'words' | 'check';

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

export function EveningWizard({
  day,
  compact,
  onDone,
  onClose,
}: {
  day: DayRecord;
  compact?: boolean;
  onDone?: () => void;
  onClose?: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const timezone = deviceTimezone();
  const recorder = useAudioRecorder(ClipRecord);
  const rec = useAudioRecorderState(recorder, 80);
  const talk = useTalkTake();
  const [hearClip] = useHearClipMutation();
  const [extractEvening] = useExtractEveningMutation();
  const [reflectEvening, saveState] = useReflectEveningMutation();
  const isRecording = talk.available ? talk.recording : rec.isRecording;
  const durationMillis = talk.available ? talk.durationMillis : rec.durationMillis;
  const metering = talk.available ? talk.metering : rec.metering;

  const [step, setStep] = useState<Step>('speak');
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState('Tap the mic and speak the night.');
  const [words, setWords] = useState('');
  const [micBlocked, setMicBlocked] = useState(false);
  const [rows, setRows] = useState<TruthRow[]>([]);
  const [wins, setWins] = useState<HappenedWin[]>([]);
  const [mirror, setMirror] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [clipKey, setClipKey] = useState<string | null>(null);
  const [clipWords, setClipWords] = useState<SpokenWord[] | null>(null);
  const keptWords = useRef('');
  const extractedFor = useRef('');
  const [heard, setHeard] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (talk.words.length > 0) {
      setWords(joinWords(keptWords.current, talk.words));
    }
  }, [talk.words]);

  useEffect(() => {
    const spoken = words.trim();
    if (!spoken) {
      return;
    }
    const next = heardIds(
      day.commitments.map((item) => ({ id: item.id, title: item.title })),
      spoken,
    );
    if (next.length === 0) {
      return;
    }
    setHeard((current) => {
      const merged = new Set(current);
      next.forEach((id) => merged.add(id));
      return merged.size === current.size ? current : merged;
    });
  }, [day.commitments, words]);

  useEffect(() => {
    void (async () => {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setMicBlocked(true);
        setNote('Mic is blocked. Type the night.');
        setStep('words');
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
        setNote('Fix anything we misheard, then continue.');
        setStep('words');
        return;
      }

      setNote('Nothing was recorded. Tap the mic and speak.');
      return;
    }

    setBusy('Sending your voice…');
    try {
      const heardClip = await hearClip({ uri }).unwrap();
      if (heardClip.transcript.trim().length > 0) {
        setWords((current) => joinWords(current, heardClip.transcript));
      }
      if (heardClip.storageKey) {
        setClipKey(heardClip.storageKey);
      }
      if (heardClip.words && heardClip.words.length > 0) {
        setClipWords(heardClip.words);
      }
      setNote('Fix anything we misheard, then continue.');
      setStep('words');
    } catch (error) {
      const status =
        error && typeof error === 'object' && 'status' in error
          ? String((error as { status: unknown }).status)
          : 'failed';
      if (status === '422') {
        setNote('We got the clip, but no words came back. Try again closer to the phone — or type them.');
        setStep('words');
        return;
      }

      const detail =
        error && typeof error === 'object' && 'error' in error
          ? String((error as { error: unknown }).error)
          : '';
      setNote(
        `Could not hear that clip (${status}${detail ? ` ${detail}` : ''} → ${apiUrl}). Keep your words, or type them.`,
      );
      setStep('words');
    } finally {
      setBusy(null);
    }
  }

  async function extract() {
    const transcript = words.trim();
    if (!transcript) {
      setNote('Say or type the night first.');
      return;
    }

    if (extractedFor.current === transcript && rows.length > 0) {
      setCheckError(null);
      setStep('check');
      return;
    }

    setBusy('Finding the truth in your words…');
    try {
      const draft = await extractEvening({ transcript, dayId: day.id }).unwrap();
      const byId = new Map(draft.outcomes.map((item) => [item.id, item.status]));
      setRows(
        day.commitments.map((item) => ({
          id: item.id,
          title: item.title,
          status: byId.get(item.id) ?? 'MISSED',
          plannedStartMinute: item.plannedStartMinute,
          lifeArea: item.lifeArea,
        })),
      );
      setWins(
        draft.wins
          .map((item) => ({ title: item.title.trim(), lifeArea: item.lifeArea ?? null }))
          .filter((item) => item.title.length > 0),
      );
      setMirror(draft.mirror?.trim() || null);
      extractedFor.current = transcript;
      setCheckError(null);
      setStep('check');
    } catch {
      setRows(
        day.commitments.map((item) => ({
          id: item.id,
          title: item.title,
          status: 'MISSED',
          plannedStartMinute: item.plannedStartMinute,
          lifeArea: item.lifeArea,
        })),
      );
      setWins([]);
      setMirror(null);
      extractedFor.current = transcript;
      setCheckError('We could not read that night. Set the statuses yourself.');
      setStep('check');
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    const transcript = words.trim();
    if (!transcript) {
      setCheckError('Say or type the night first.');
      return;
    }

    try {
      const saved = await reflectEvening({
        timezone,
        transcript,
        dayId: day.id,
        storageKey: clipKey,
        words: clipWords,
        outcomes: rows.map((row) => ({ id: row.id, status: row.status })),
        wins: wins
          .map((win) => ({ title: win.title.trim(), lifeArea: win.lifeArea ?? null }))
          .filter((win) => win.title.length > 0),
      }).unwrap();
      await rememberWords(saved.localDate, transcript);
      setClipKey(null);
      setClipWords(null);
      onDone?.();
      if (!compact) {
        router.replace(`/day/${saved.id}` as Href);
      }
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { error?: string } }).data?.error ?? '')
          : '';
      setCheckError(message || 'Could not save the night.');
    }
  }

  function goBack() {
    if (step === 'check') {
      setStep('words');
      return;
    }
    if (step === 'words') {
      setStep('speak');
      return;
    }
    onClose?.();
  }

  const title =
    step === 'check' ? 'Check the truth' : step === 'words' ? 'Your words' : 'Tell me about your day';
  const showBack = step !== 'speak' || onClose != null;
  const header = (
    <View style={styles.header}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={step === 'speak' ? 'Close' : 'Back'}
          hitSlop={12}
          onPress={goBack}
          style={styles.back}>
          <SymbolView
            name={
              step === 'speak'
                ? { ios: 'xmark', android: 'close', web: 'close' }
                : { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }
            }
            size={step === 'speak' ? 18 : 20}
            tintColor={theme.text}
          />
        </Pressable>
      ) : null}
      <ThemedText style={styles.screenTitle}>{title}</ThemedText>
    </View>
  );

  const bodyPad = compact ? Spacing.one : insets.top + Spacing.three;
  const sheetBusy = (
    <SheetBusy message={busy} background={theme.background} color={theme.primary} />
  );

  if (step === 'check') {
    return (
      <View style={[styles.page, compact && styles.compact, { paddingTop: bodyPad }]}>
        {sheetBusy}
        {header}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.checkBody}
          showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.duration(240)} style={styles.dayNameRow}>
            <ThemedText type="small" themeColor="textSecondary">
              {longDayLabel(day.localDate)}
            </ThemedText>
            {day.title ? <ThemedText style={styles.dayTitle}>{day.title}</ThemedText> : null}
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              A mirror, not a score. Tap if we heard it wrong.
            </ThemedText>
          </Animated.View>
          {mirror ? (
            <Animated.View
              entering={FadeIn.duration(240)}
              style={[styles.mirror, { backgroundColor: theme.primary }]}>
              <ThemedText type="smallBold" style={styles.mirrorTitle}>
                What we heard
              </ThemedText>
              <ThemedText type="small" style={styles.mirrorBody}>
                {mirror}
              </ThemedText>
            </Animated.View>
          ) : null}
          {rows.map((row, index) => (
            <Animated.View key={row.id} entering={FadeInDown.duration(260).delay(index * 40)}>
              <TruthCard
                row={row}
                onChange={(status) =>
                  setRows((current) =>
                    current.map((item) => (item.id === row.id ? { ...item, status } : item)),
                  )
                }
              />
            </Animated.View>
          ))}
          <ThemedText style={styles.sectionTitle}>Also happened</ThemedText>
          {wins.map((win, index) => (
            <Animated.View key={`win-${index}`} entering={FadeInDown.duration(220).delay(40)}>
              <HappenedCard
                win={win}
                onChange={(next) =>
                  setWins((current) => current.map((item, i) => (i === index ? next : item)))
                }
                onRemove={() => setWins((current) => current.filter((_, i) => i !== index))}
              />
            </Animated.View>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add something that also happened"
            onPress={() => setWins((current) => [...current, { title: '', lifeArea: 'PERSONAL' }])}
            style={[styles.addWin, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              size={20}
              tintColor="#FFFFFF"
            />
          </Pressable>
          <Animated.View entering={FadeInUp.duration(240).delay(80)} style={styles.footer}>
            {checkError ? (
              <ThemedText type="small" themeColor="textSecondary">
                {checkError}
              </ThemedText>
            ) : null}
            <PillButton
              label="Save the night"
              loading={saveState.isLoading}
              onPress={() => void save()}
            />
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  if (step === 'words') {
    return (
      <KeyboardAvoidingView
        style={[
          styles.page,
          compact && styles.compact,
          { paddingTop: bodyPad, paddingBottom: Math.max(insets.bottom, Spacing.four) },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {sheetBusy}
        {header}
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Read it through. Fix anything we misheard, then continue.
        </ThemedText>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={styles.wordsScroll}
          contentContainerStyle={styles.wordsBody}
          showsVerticalScrollIndicator={false}>
          <TextInput
            value={words}
            onChangeText={setWords}
            multiline
            placeholder="Type the night."
            placeholderTextColor={theme.textSecondary}
            style={[styles.fullWords, { color: theme.text }]}
          />
        </ScrollView>
        <PillButton
          label="Continue"
          disabled={words.trim().length === 0}
          onPress={() => void extract()}
        />
      </KeyboardAvoidingView>
    );
  }

  return (
    <View
      style={[
        styles.page,
        compact && styles.compact,
        { paddingTop: bodyPad, paddingBottom: Math.max(insets.bottom, Spacing.four) + Spacing.three },
      ]}>
      {sheetBusy}
      {header}
      <ThemedText themeColor="textSecondary" style={styles.subtitle}>
        What happened? We'll hold up this morning as you talk.
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {longDayLabel(day.localDate)}
        {day.title ? ` · ${day.title}` : ''}
      </ThemedText>
      <View style={styles.ticker}>
        <View style={[styles.tickerFade, { backgroundColor: theme.background }]} pointerEvents="none" />
        <ThemedText style={[styles.tickerText, { color: theme.text }]}>
          {words.trim().length > 0 ? words : isRecording ? 'Listening…' : 'Your words will rise here.'}
        </ThemedText>
      </View>
      <View style={styles.speak}>
        <PlanMic
          centered
          recording={isRecording}
          durationMillis={durationMillis}
          metering={metering}
          onStart={() => void start()}
          onSend={() => void stopAndHear()}
          onDiscard={() => void discard()}
        />
        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          {isRecording ? 'Listening. Check sends it. X tosses it.' : note}
        </ThemedText>
        {micBlocked ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Type instead"
            hitSlop={8}
            onPress={() => setStep('words')}>
            <ThemedText type="smallBold" style={{ color: theme.accent, textAlign: 'center' }}>
              Type instead
            </ThemedText>
          </Pressable>
        )}
      </View>
      <RecapPrompt
        tasks={day.commitments}
        heard={heard}
        onSkip={(id) => setHeard((current) => new Set(current).add(id))}
      />
    </View>
  );
}

function SheetBusy({
  message,
  background,
  color,
}: {
  message: string | null;
  background: string;
  color: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.busy} pointerEvents="auto">
      <View style={[styles.busyCard, { backgroundColor: background }]}>
        <ActivityIndicator size="large" color={color} />
        <ThemedText style={styles.busyMessage}>{message}</ThemedText>
      </View>
    </View>
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
  compact: {
    maxWidth: '100%',
    paddingHorizontal: 0,
    paddingBottom: 0,
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
    ...Typography.titleMedium,
    flex: 1,
  },
  subtitle: {
    ...Typography.body,
  },
  ticker: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    minHeight: 96,
  },
  tickerFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 28,
    opacity: 0.86,
    zIndex: 1,
  },
  tickerText: {
    ...Typography.bodyLarge,
    textAlign: 'left',
  },
  speak: {
    gap: Spacing.two,
  },
  wordsScroll: {
    flex: 1,
  },
  wordsBody: {
    flexGrow: 1,
  },
  fullWords: {
    flexGrow: 1,
    minHeight: 220,
    ...Typography.bodyLarge,
    lineHeight: 30,
    textAlignVertical: 'top',
  },
  note: {
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  checkBody: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  dayNameRow: {
    gap: 4,
  },
  dayTitle: {
    ...Typography.title, fontSize: 20, lineHeight: 26,
  },
  sectionTitle: {
    ...Typography.title, fontSize: 18, lineHeight: 24,
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  mirror: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: 4,
  },
  mirrorTitle: {
    color: '#FFFFFF',
  },
  mirrorBody: {
    color: '#FFFFFF',
    ...Typography.bodySmall,
  },
  addWin: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  footer: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  busy: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28, 25, 21, 0.18)',
    zIndex: 8,
    paddingHorizontal: Spacing.five,
  },
  busyCard: {
    minWidth: 168,
    maxWidth: 240,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
  },
  busyMessage: {
    ...Typography.bodySmall, fontFamily: Typography.bodyMedium.fontFamily,
    textAlign: 'center',
  },
});
