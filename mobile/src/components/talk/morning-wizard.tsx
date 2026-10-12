import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AudioModule,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import { PlanAssistantAvatar, type NevoPresence } from '@/components/talk/plan-assistant-avatar';
import { PlanGradientBackdrop } from '@/components/talk/plan-gradient-backdrop';
import { PlanMorningSheet, type PlanMorningSheetPhase } from '@/components/talk/plan-morning-sheet';
import { PlanTabBarInset } from '@/components/talk/plan-screen-shell';
import { type PlanLine } from '@/components/talk/plan-task-card';
import { useTalkTake } from '@/components/talk/use-talk-take';
import { ThemedText } from '@/components/themed-text';
import { PlanSurface } from '@/constants/plan-surface';
import { Typography, MaxContentWidth, Spacing } from '@/constants/theme';
import { deviceTimezone, type SpokenWord } from '@/lib/api';
import { ClipRecord } from '@/lib/clip-record';
import { clockToMinute, minuteToClock, spokenMinuteNow } from '@/lib/clock';
import { rememberWords } from '@/lib/day-notes';
import { layOut } from '@/lib/lay-out';
import {
  planLayoutAnchorMinute,
  planSessionCopy,
  planTargetLocalDate,
} from '@/lib/plan-context';
import { assistantGreeting, nevoTapLine, type PlanAssistant } from '@/lib/plan-assistant';
import { formatDayClock, planDayVibe } from '@/lib/plan-day-vibe';
import { humanAiText } from '@/lib/human-text';
import { speakNevo, stopNevoSpeech, useNevoSpeaking } from '@/lib/muse-speak';
import { type ClarifyExchange, type ClarifyQuestion } from '@/lib/api';
import {
  apiUrl,
  useClarifyMorningMutation,
  useExtractMorningMutation,
  useHearClipMutation,
  usePlanMorningMutation,
} from '@/store/api';

const MaxMs = 60_000;
type Step = 'record' | 'thinking';

function emptyLine(after?: PlanLine, anchorMinute?: number): PlanLine {
  const previous = after ? clockToMinute(after.start) : null;
  const duration = after ? parseMinutes(after.minutes) ?? 30 : 0;
  const start = previous != null ? previous + duration : (anchorMinute ?? spokenMinuteNow());
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

export function MorningWizard({
  assistant,
  onSaved,
}: {
  assistant: PlanAssistant;
  onSaved?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const timezone = deviceTimezone();
  const planTarget = planTargetLocalDate(timezone);
  const planCopy = planSessionCopy(planTarget, timezone);
  const layoutAnchor = planLayoutAnchorMinute(planTarget, timezone);
  const recorder = useAudioRecorder(ClipRecord);
  const rec = useAudioRecorderState(recorder, 80);
  const talk = useTalkTake();
  const [hearClip] = useHearClipMutation();
  const [clarifyMorning] = useClarifyMorningMutation();
  const [extractMorning] = useExtractMorningMutation();
  const [planMorning, saveState] = usePlanMorningMutation();
  const isRecording = talk.available ? talk.recording : rec.isRecording;
  const durationMillis = talk.available ? talk.durationMillis : rec.durationMillis;
  const metering = talk.available ? talk.metering : rec.metering;

  const [step, setStep] = useState<Step>('record');
  const [note, setNote] = useState<string | null>(null);
  const [words, setWords] = useState('');
  const [canType, setCanType] = useState(false);
  const [micBlocked, setMicBlocked] = useState(false);
  const [dayTitle, setDayTitle] = useState('');
  const [lines, setLines] = useState<PlanLine[]>([]);
  const [dragging, setDragging] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [clipKey, setClipKey] = useState<string | null>(null);
  const [clipWords, setClipWords] = useState<SpokenWord[] | null>(null);
  const [sheetPhase, setSheetPhase] = useState<PlanMorningSheetPhase | null>(null);
  const [sheetBusy, setSheetBusy] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [museLine, setMuseLine] = useState('');
  const [clarifyQuestions, setClarifyQuestions] = useState<ClarifyQuestion[]>([]);
  const [clarifyAnswer, setClarifyAnswer] = useState('');
  const [coachNote, setCoachNote] = useState<string | null>(null);
  const [clarifyVoiceFor, setClarifyVoiceFor] = useState<string | null>(null);
  const [clarifyHistory, setClarifyHistory] = useState<ClarifyExchange[]>([]);
  const keptWords = useRef('');
  const extractedFor = useRef('');
  const clarifyTarget = useRef<string | null>(null);
  const clarifyQuestionsRef = useRef<ClarifyQuestion[]>([]);
  const clarifyHistoryRef = useRef<ClarifyExchange[]>([]);
  const [clarifyTyping, setClarifyTyping] = useState(false);

  useEffect(() => {
    void (async () => {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setMicBlocked(true);
        setCanType(true);
        setNote('Mic blocked — type instead.');
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

  useEffect(() => {
    clarifyQuestionsRef.current = clarifyQuestions;
  }, [clarifyQuestions]);

  useEffect(() => {
    clarifyHistoryRef.current = clarifyHistory;
  }, [clarifyHistory]);

  async function start() {
    keptWords.current = words;
    setNote(null);
    if (talk.available) {
      try {
        await talk.start();
        return;
      } catch {
        // Native speech is missing or the mic is busy — use the recorder.
      }
    }

    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      setMicBlocked(true);
      setCanType(true);
      setNote('Mic unavailable here — type instead.');
    }
  }

  async function discard() {
    if (talk.available) {
      talk.discard();
    } else {
      await recorder.stop();
    }
    setNote(null);
  }

  async function startClarifyRecord() {
    if (isRecording || sheetBusy) {
      return;
    }

    setSheetError(null);
    clarifyTarget.current = 'clarify-answer';
    setClarifyVoiceFor('clarify-answer');
    await start();
  }

  async function stopAndHear() {
    const clarifyId = clarifyTarget.current;
    const uri = talk.available ? await talk.stop() : (await recorder.stop(), recorder.uri);
    if (!uri) {
      const spoken = talk.words.trim();
      if (spoken.length > 0) {
        if (clarifyId === 'clarify-answer') {
          clarifyTarget.current = null;
          setClarifyVoiceFor(null);
          if (spoken.length > 0) {
            await submitClarifyAnswer(spoken);
          } else {
            setSheetError('Nothing recorded. Try again.');
          }
          return;
        }

        setCanType(true);
        setWords(joinWords(keptWords.current, spoken));
        setSheetError(null);
        setSheetBusy(null);
        setSheetPhase('transcript');
        return;
      }

      setNote('Nothing recorded.');
      clarifyTarget.current = null;
      setClarifyVoiceFor(null);
      return;
    }

    setCanType(true);
    setSheetError(null);
    setSheetBusy(clarifyId ? 'Transcribing your answer…' : 'Transcribing…');
    if (!clarifyId) {
      setSheetPhase('transcript');
    }

    try {
      const heard = await hearClip({ uri }).unwrap();
      const text =
        heard.transcript.trim().length > 0
          ? heard.transcript
          : talk.words.trim().length > 0
            ? talk.words.trim()
            : '';

      if (clarifyId === 'clarify-answer') {
        if (text.length > 0) {
          await submitClarifyAnswer(text);
        } else {
          setSheetError('No words came back. Try again.');
        }
      } else if (text.length > 0) {
        setWords((current) => joinWords(current, text));
      }
      if (heard.storageKey) {
        setClipKey(heard.storageKey);
      }
      if (heard.words && heard.words.length > 0) {
        setClipWords(heard.words);
      }
      setNote(null);
    } catch (error) {
      const status =
        error && typeof error === 'object' && 'status' in error
          ? String((error as { status: unknown }).status)
          : 'failed';
      if (status === '401') {
        setSheetError(`Not signed in (${apiUrl}). Check You tab, then reload.`);
        return;
      }
      if (status === '422') {
        setSheetError('No words came back. Try again or type them.');
        return;
      }
      if (status === '503') {
        setSheetError('Transcription unavailable. Add ELEVENLABS_API_KEY to api/.env.');
        return;
      }

      const detail =
        error && typeof error === 'object' && 'error' in error
          ? String((error as { error: unknown }).error)
          : '';
      setSheetError(`Could not transcribe (${status}${detail ? ` ${detail}` : ''}). Edit or re-record.`);
    } finally {
      setSheetBusy(null);
      clarifyTarget.current = null;
      setClarifyVoiceFor(null);
    }
  }

  function openCaptureSheet() {
    setSheetError(null);
    setSheetBusy(null);
    setSheetPhase('capture');
  }

  function openTranscriptSheet() {
    setCanType(true);
    setSheetError(null);
    setSheetBusy(null);
    setSheetPhase('transcript');
  }

  function closeSheet() {
    if (isRecording) {
      void discard();
    }
    setSheetPhase(null);
    setSheetError(null);
    setStep('record');
  }

  function continueFromTranscript() {
    stopNevoSpeech();
    setSheetError(null);
    setClarifyHistory([]);
    setClarifyTyping(false);
    void runClarify([]);
  }

  function continueFromClarify() {
    setSheetError(null);
    void advanceClarify();
  }

  function backToTranscript() {
    stopNevoSpeech();
    setSheetPhase('transcript');
    setCheckError(null);
    setClarifyQuestions([]);
    setClarifyAnswer('');
    setClarifyHistory([]);
    setClarifyTyping(false);
  }

  function enrichedTranscript(prior: ClarifyExchange[]) {
    const base = words.trim();
    if (prior.length === 0) {
      return base;
    }

    const lines = prior.map((row) => `${row.prompt}: ${row.answer}`);
    return `${base}\n\nClarifications:\n${lines.join('\n')}`;
  }

  function planTranscript() {
    return enrichedTranscript(clarifyHistory);
  }

  async function runClarify(prior: ClarifyExchange[] = []) {
    const base = words.trim();
    if (!base) {
      setSheetError('Say or type something first.');
      setSheetPhase('transcript');
      return;
    }

    const transcript = prior.length > 0 ? enrichedTranscript(prior) : base;

    setSheetPhase(prior.length > 0 ? 'clarify' : 'transcript');
    setSheetBusy(`${assistant.name} is reviewing your words…`);
    setStep('thinking');
    try {
      const result = await clarifyMorning({ transcript, timezone, clarifications: prior }).unwrap();
      setMuseLine(result.museLine?.trim() || '');
      const next = result.questions ?? [];
      setClarifyQuestions(next);
      setClarifyAnswer('');
      setClarifyTyping(false);
      setSheetBusy(null);
      setStep('record');
      if (prior.length === 0 && (next.length > 0 || (result.museLine?.trim()?.length ?? 0) > 0)) {
        setSheetPhase('clarify');
        return;
      }

      await buildPlanFromClarify(prior);
    } catch {
      setStep('record');
      setSheetBusy(null);
      await buildPlanFromClarify(prior);
    }
  }

  async function submitClarifyAnswer(answer: string) {
    const trimmed = answer.trim();
    const questions = clarifyQuestionsRef.current;
    const history = clarifyHistoryRef.current;
    if (questions.length === 0 || !trimmed) {
      setSheetError('Say your answer out loud, or type it.');
      return;
    }

    stopNevoSpeech();
    setSheetError(null);
    const batch: ClarifyExchange[] = [
      {
        questionId: `clarify-turn-${history.length + 1}`,
        prompt: questions.map((item) => item.prompt).join('\n'),
        answer: trimmed,
      },
    ];
    const prior = [...history, ...batch];
    setClarifyHistory(prior);
    setClarifyAnswer('');
    setClarifyTyping(false);
    await buildPlanFromClarify(prior);
  }

  async function buildPlanFromClarify(prior: ClarifyExchange[]) {
    const proposal = museLine.trim();
    let transcript = enrichedTranscript(prior);
    if (proposal && !transcript.includes(proposal)) {
      transcript = `${transcript}\n\nAssistant proposal:\n${proposal}`;
    }

    setClarifyQuestions([]);
    await extract(transcript);
  }

  function skipClarifyAndBuild() {
    stopNevoSpeech();
    setSheetError(null);
    void buildPlanFromClarify(clarifyHistory);
  }

  function advanceClarify() {
    setSheetError(null);
    void submitClarifyAnswer(clarifyAnswer);
  }

  async function extract(transcript: string) {
    if (!transcript) {
      setSheetError('Say or type something first.');
      setSheetPhase('transcript');
      return;
    }

    if (extractedFor.current === transcript && lines.length > 0) {
      setCheckError(null);
      setSheetPhase('tasks');
      setStep('record');
      return;
    }

    setSheetPhase(clarifyQuestions.length > 0 ? 'clarify' : 'transcript');
    setSheetBusy(`${assistant.name} is building your plan…`);
    setStep('thinking');
    try {
      const draft = await extractMorning({
        transcript,
        timezone,
        spokenAt: new Date().toISOString(),
      }).unwrap();
      setCoachNote(draft.coachNote?.trim() ? humanAiText(draft.coachNote) : null);
      const namedTimes = new Set(
        draft.commitments
          .filter((item) => item.plannedStartMinute != null)
          .map((item) => item.title.trim().toLowerCase()),
      );
      const scheduled = layOut(draft.commitments, layoutAnchor);
      setDayTitle(humanAiText(draft.title) || 'Today, on purpose');
      setLines(
        scheduled.map((item, index) => ({
          key: `${index}-${item.title}`,
          title: item.title,
          minutes: item.plannedDurationMinutes ? String(item.plannedDurationMinutes) : '30',
          start: minuteToClock(item.plannedStartMinute),
          area: item.lifeArea ?? 'PERSONAL',
          source: namedTimes.has(item.title.trim().toLowerCase()) ? 'spoken' : 'inferred',
          approved: true,
        })),
      );
      if (scheduled.length === 0) {
        setLines([{ ...emptyLine(undefined, layoutAnchor), approved: true }]);
      }
      extractedFor.current = transcript;
      setCheckError(null);
      setSheetBusy(null);
      setSheetPhase('tasks');
      setStep('record');
    } catch (error) {
      const status =
        error && typeof error === 'object' && 'status' in error
          ? String((error as { status: unknown }).status)
          : 'failed';
      setStep('record');
      setCanType(true);
      if (status === '503') {
        setSheetError('Task breakdown needs OPENAI_API_KEY in api/.env. Restart the API, or add tasks manually on the next screen.');
      } else {
        setSheetError('Could not build tasks. Edit and try again.');
      }
      setSheetPhase('transcript');
      setSheetBusy(null);
    }
  }

  function approveAllTasks() {
    setLines((current) => current.map((line) => ({ ...line, approved: true })));
  }

  async function save() {
    const transcript = words.trim();
    const toSave =
      lines.some((line) => line.approved) ? lines : lines.map((line) => ({ ...line, approved: true }));
    const commitments = toSave
      .filter((line) => line.approved)
      .map((line) => ({
        title: line.title.trim(),
        plannedDurationMinutes: parseMinutes(line.minutes),
        plannedStartMinute: clockToMinute(line.start),
        lifeArea: line.area.trim() || null,
      }))
      .filter((item) => item.title.length > 0);
    if (!transcript || commitments.length === 0) {
      setCheckError('Add at least one task with a title, then save.');
      return;
    }

    try {
      const saved = await planMorning({
        timezone,
        localDate: planTarget,
        transcript: planTranscript(),
        title: dayTitle.trim() || null,
        storageKey: clipKey,
        words: clipWords,
        coachNote,
        commitments,
      }).unwrap();
      await rememberWords(saved.localDate, transcript);
      setClipKey(null);
      setClipWords(null);
      setSheetPhase(null);
      setStep('record');
      setWords('');
      setLines([]);
      setDayTitle('');
      setCoachNote(null);
      setClarifyQuestions([]);
      setClarifyAnswer('');
      setClarifyHistory([]);
      setMuseLine('');
      setClarifyTyping(false);
      extractedFor.current = '';
      stopNevoSpeech();
      onSaved?.();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { error?: string } }).data?.error ?? '')
          : '';
      setCheckError(message || 'Could not save the morning plan.');
    }
  }

  const hasWords = words.trim().length > 0;
  const nevoSpeaking = useNevoSpeaking();
  const sheetOpen = sheetPhase !== null;
  const thinking = step === 'thinking';
  const nevoPresence: NevoPresence = isRecording
    ? 'listening'
    : nevoSpeaking
      ? 'speaking'
      : thinking || sheetBusy
        ? 'thinking'
        : 'idle';
  const captureSubtitle =
    note ??
    (micBlocked ? 'Microphone off. Use the keyboard icon to type.' : planCopy.subtitle);
  const [clock, setClock] = useState(formatDayClock());
  const vibe = planDayVibe();

  useEffect(() => {
    const tick = setInterval(() => setClock(formatDayClock()), 30_000);
    return () => clearInterval(tick);
  }, []);

  return (
    <View style={styles.recordShell}>
      <PlanGradientBackdrop rich={false} active={sheetOpen} />
      <View
        style={[
          styles.page,
          { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + PlanTabBarInset },
        ]}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.timeRow}>
          <SymbolView name={{ ios: 'clock', android: 'schedule', web: 'schedule' }} size={14} tintColor={PlanSurface.accent} />
          <ThemedText style={styles.timeText}>{clock}</ThemedText>
          <ThemedText style={styles.timeDot}>·</ThemedText>
          <ThemedText style={styles.timeToday}>Today only</ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(420)} style={styles.heroBlock}>
          <PlanAssistantAvatar
            assistant={assistant}
            size="lg"
            presence={nevoPresence}
            interactive
            onPress={() => void speakNevo(nevoTapLine(assistant))}
          />
          <ThemedText style={styles.greeting}>{planCopy.greeting}</ThemedText>
          <ThemedText style={styles.heroTitle}>{planCopy.title}</ThemedText>
          <ThemedText style={styles.assistantLine}>{assistantGreeting(assistant)}</ThemedText>
          <ThemedText style={styles.heroSubtitle}>{humanAiText(planCopy.subtitle)}</ThemedText>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.flowRow}>
          <ThemedText style={styles.flowLabelActive}>Speak</ThemedText>
          <ThemedText style={styles.flowSep}>→</ThemedText>
          <ThemedText style={styles.flowLabel}>Review</ThemedText>
          <ThemedText style={styles.flowSep}>→</ThemedText>
          <ThemedText style={styles.flowLabel}>Save</ThemedText>
        </Animated.View>

        <ThemedText style={styles.vibeLine}>{vibe.sub}</ThemedText>

        <Animated.View entering={FadeInDown.delay(280).duration(400)} style={styles.landingActions}>
          <Pressable
            accessibilityRole="button"
            onPress={openCaptureSheet}
            style={[styles.startCta, { backgroundColor: PlanSurface.accent }]}>
            <ThemedText type="bodyMedium" style={{ color: PlanSurface.bgDeep }}>
              Ready to start
            </ThemedText>
          </Pressable>
          {hasWords ? (
            <Pressable accessibilityRole="button" hitSlop={8} onPress={openTranscriptSheet}>
              <ThemedText type="caption" style={{ color: PlanSurface.textMuted, textAlign: 'center' }}>
                Resume from transcript
              </ThemedText>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>

      <PlanMorningSheet
        open={sheetOpen}
        phase={sheetPhase ?? 'capture'}
        capture={
          sheetPhase === 'capture'
            ? {
                subtitle: captureSubtitle,
                isRecording,
                thinking,
                metering,
                durationMillis,
                onStart: () => void start(),
                onSend: () => void stopAndHear(),
                onDiscard: () => void discard(),
              }
            : null
        }
        onOpenTranscript={openTranscriptSheet}
        words={words}
        busy={sheetBusy}
        error={sheetError}
        onChangeWords={setWords}
        onClose={closeSheet}
        onContinueFromTranscript={continueFromTranscript}
        onContinueFromClarify={continueFromClarify}
        onSkipClarify={skipClarifyAndBuild}
        onBackToTranscript={backToTranscript}
        assistant={assistant}
        museLine={museLine}
        clarifyQuestions={clarifyQuestions}
        clarifyAnswer={clarifyAnswer}
        onClarifyAnswerChange={setClarifyAnswer}
        onStopNevoVoice={() => stopNevoSpeech()}
        coachNote={coachNote}
        clarifyCapture={
          sheetPhase === 'clarify'
            ? {
                isRecording: clarifyVoiceFor != null && isRecording,
                durationMillis,
                typing: clarifyTyping,
                onToggleTyping: () => setClarifyTyping((open) => !open),
                onStart: () => void startClarifyRecord(),
                onSend: () => void stopAndHear(),
                onDiscard: () => void discard(),
              }
            : null
        }
        nevoSpeaking={nevoSpeaking}
        dayTitle={dayTitle}
        onDayTitleChange={setDayTitle}
        lines={lines}
        onLineChange={(next) =>
          setLines((current) => current.map((item) => (item.key === next.key ? next : item)))
        }
        onLineRemove={(key) => setLines((current) => current.filter((item) => item.key !== key))}
        onReorder={setLines}
        onDragChange={setDragging}
        onAddLine={() =>
          setLines((current) => [
            ...current,
            { ...emptyLine(current[current.length - 1], layoutAnchor), approved: true },
          ])
        }
        onApproveAll={approveAllTasks}
        checkError={checkError}
        saveLoading={saveState.isLoading}
        onSave={() => void save()}
        scrollLocked={dragging}
        saveLabel={planCopy.saveLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  recordShell: {
    flex: 1,
  },
  page: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: PlanSurface.card,
    borderWidth: 1,
    borderColor: PlanSurface.borderSoft,
  },
  timeText: {
    ...Typography.caption,
    color: PlanSurface.text,
  },
  timeDot: {
    color: PlanSurface.textDim,
  },
  timeToday: {
    ...Typography.micro,
    color: PlanSurface.textMuted,
  },
  heroBlock: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingTop: Spacing.two,
  },
  assistantLine: {
    ...Typography.bodySmall,
    color: PlanSurface.accent,
    textAlign: 'center',
    paddingHorizontal: Spacing.two,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    gap: 10,
  },
  flowLabel: {
    ...Typography.caption,
    color: PlanSurface.textDim,
  },
  flowLabelActive: {
    ...Typography.caption,
    color: PlanSurface.accent,
  },
  flowSep: {
    ...Typography.caption,
    color: PlanSurface.textDim,
  },
  vibeLine: {
    ...Typography.bodySmall,
    color: PlanSurface.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.two,
    flex: 1,
  },
  greeting: {
    ...Typography.overline,
    color: PlanSurface.accent,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    ...Typography.displayHero,
    color: PlanSurface.text,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...Typography.body,
    maxWidth: 320,
    lineHeight: 24,
    color: PlanSurface.textMuted,
  },
  landingActions: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  startCta: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
});
