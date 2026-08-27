import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import {
  AudioModule,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import { BusyLock } from '@/components/talk/busy-lock';
import { PlanMic } from '@/components/talk/plan-mic';
import { type PlanLine } from '@/components/talk/plan-task-card';
import { PlanSortList } from '@/components/talk/plan-sort-list';
import { PillButton } from '@/components/auth/pill-button';
import { useTalkTake } from '@/components/talk/use-talk-take';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deviceTimezone, type SpokenWord } from '@/lib/api';
import { ClipRecord } from '@/lib/clip-record';
import { clockToMinute, minuteToClock, spokenMinuteNow } from '@/lib/clock';
import { rememberWords } from '@/lib/day-notes';
import { layOut } from '@/lib/lay-out';
import { useExtractMorningMutation, useHearClipMutation, usePlanMorningMutation } from '@/store/api';

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

export function AddTakeSheet({
  open,
  dayDate,
  onClose,
}: {
  open: boolean;
  dayDate: string;
  onClose: () => void;
}) {
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
  const [step, setStep] = useState<'record' | 'check'>('record');
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState('Tap the mic and speak.');
  const [words, setWords] = useState('');
  const [lines, setLines] = useState<PlanLine[]>([]);
  const [dragging, setDragging] = useState(false);
  const [clipKey, setClipKey] = useState<string | null>(null);
  const [clipWords, setClipWords] = useState<SpokenWord[] | null>(null);
  const keptWords = useRef('');

  useEffect(() => {
    if (talk.words.length > 0) {
      setWords(joinWords(keptWords.current, talk.words));
    }
  }, [talk.words]);

  useEffect(() => {
    if (!open) {
      setClipKey(null);
      setClipWords(null);
      return;
    }
    void AudioModule.requestRecordingPermissionsAsync().then((permission) => {
      if (permission.granted) {
        void setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      }
    });
  }, [open]);

  async function start() {
    keptWords.current = words;
    if (talk.available) {
      try {
        await talk.start();
        return;
      } catch {
        // Fall through to the file recorder.
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
    if (!uri && talk.words.trim().length === 0) {
      setNote('Nothing was recorded.');
      return;
    }
    setBusy('Sending your voice…');
    try {
      if (uri) {
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
      }
      setNote('Fix anything we misheard, then continue.');
    } catch {
      setNote('Could not hear that clip. Type the words.');
    } finally {
      setBusy(null);
    }
  }

  async function extract() {
    const transcript = words.trim();
    if (!transcript) {
      setNote('Say or type something first.');
      return;
    }
    setBusy('Finding the plan in your words…');
    try {
      const draft = await extractMorning({
        transcript,
        timezone,
        spokenAt: new Date().toISOString(),
      }).unwrap();
      const scheduled = layOut(draft.commitments, spokenMinuteNow());
      setLines(
        scheduled.map((item, index) => ({
          key: `${index}-${item.title}`,
          title: item.title,
          minutes: item.plannedDurationMinutes ? String(item.plannedDurationMinutes) : '30',
          start: minuteToClock(item.plannedStartMinute),
          area: item.lifeArea ?? 'PERSONAL',
          source: item.plannedStartMinute != null ? 'spoken' : 'inferred',
          approved: true,
        })),
      );
      setStep('check');
    } catch {
      setNote('Could not extract a plan.');
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    const transcript = words.trim();
    const commitments = lines
      .filter((line) => line.approved && line.title.trim().length > 0)
      .map((line) => ({
        title: line.title.trim(),
        plannedDurationMinutes: parseMinutes(line.minutes),
        plannedStartMinute: clockToMinute(line.start),
        lifeArea: line.area.trim() || null,
      }));
    if (commitments.length === 0) {
      setNote('Approve at least one task.');
      return;
    }
    try {
      await planMorning({
        timezone,
        transcript,
        title: null,
        storageKey: clipKey,
        words: clipWords,
        commitments,
      }).unwrap();
      await rememberWords(dayDate, transcript);
      reset();
      onClose();
    } catch {
      setNote('Could not add those tasks.');
    }
  }

  function reset() {
    setStep('record');
    setWords('');
    setLines([]);
    setNote('Tap the mic and speak.');
    setBusy(null);
    setClipKey(null);
    setClipWords(null);
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.background, paddingBottom: insets.bottom + Spacing.three },
          ]}>
          <BusyLock message={busy} />
          <View style={styles.top}>
            <ThemedText style={styles.title}>
              {step === 'check' ? 'Add these?' : 'Add another take'}
            </ThemedText>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose}>
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={18}
                tintColor={theme.text}
              />
            </Pressable>
          </View>
          {step === 'record' ? (
            <>
              <View style={[styles.words, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <TextInput
                  value={words}
                  onChangeText={setWords}
                  multiline
                  placeholder="Speak or type what to add."
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.wordsInput, { color: theme.text }]}
                />
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {note}
              </ThemedText>
              <PlanMic
                recording={isRecording}
                durationMillis={durationMillis}
                metering={metering}
                onStart={() => void start()}
                onSend={() => void stopAndHear()}
                onDiscard={() => void discard()}
              />
              {words.trim().length > 0 ? (
                <PillButton label="Continue" onPress={() => void extract()} />
              ) : null}
            </>
          ) : (
            <>
              <ScrollView
                scrollEnabled={!dragging}
                contentContainerStyle={styles.check}
                keyboardShouldPersistTaps="handled">
                <PlanSortList
                  lines={lines}
                  onChange={(next) =>
                    setLines((current) => current.map((item) => (item.key === next.key ? next : item)))
                  }
                  onRemove={(key) => setLines((current) => current.filter((item) => item.key !== key))}
                  onReorder={setLines}
                  onDragChange={setDragging}
                />
              </ScrollView>
              <ThemedText type="small" themeColor="textSecondary">
                {note}
              </ThemedText>
              <PillButton
                label="Add to today"
                loading={saveState.isLoading}
                onPress={() => void save()}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(36, 48, 86, 0.35)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: FontFamily.semibold,
    fontSize: 20,
    lineHeight: 26,
  },
  words: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
  },
  wordsInput: {
    minHeight: 100,
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  check: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
});
