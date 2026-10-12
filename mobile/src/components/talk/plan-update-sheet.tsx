import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
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

import { PlanAssistantAvatar } from '@/components/talk/plan-assistant-avatar';
import { PlanRecordButton, PlanRecordDock } from '@/components/talk/plan-record-controls';
import { PlanWaveHero } from '@/components/talk/plan-wave-hero';
import { ThemedText } from '@/components/themed-text';
import { PlanBlue } from '@/constants/plan-theme';
import { PlanSheet } from '@/constants/plan-sheet';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { type DayRecord, deviceTimezone, type SpokenWord } from '@/lib/api';
import { ClipRecord } from '@/lib/clip-record';
import { rememberWords } from '@/lib/day-notes';
import { longDayLabel } from '@/lib/day-tasks';
import { type PlanAssistant } from '@/lib/plan-assistant';
import {
  useExtractMiddayMutation,
  useHearClipMutation,
  useUpdateMiddayMutation,
} from '@/store/api';

const MaxMs = 60_000;

type Phase = 'capture' | 'transcript';

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

export function PlanUpdateSheet({
  open,
  day,
  assistant,
  onClose,
  onSaved,
}: {
  open: boolean;
  day: DayRecord;
  assistant: PlanAssistant;
  onClose: () => void;
  onSaved: () => void;
}) {
  const insets = useSafeAreaInsets();
  const timezone = deviceTimezone();
  const recorder = useAudioRecorder(ClipRecord);
  const rec = useAudioRecorderState(recorder, 80);
  const [hearClip] = useHearClipMutation();
  const [extractMidday] = useExtractMiddayMutation();
  const [updateMidday, saveState] = useUpdateMiddayMutation();

  const [phase, setPhase] = useState<Phase>('capture');
  const [words, setWords] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clipKey, setClipKey] = useState<string | null>(null);
  const [clipWords, setClipWords] = useState<SpokenWord[] | null>(null);
  const isRecording = rec.isRecording;
  const durationMillis = rec.durationMillis;
  const metering = rec.metering;
  const keptWords = useRef('');

  useEffect(() => {
    if (!open) {
      setPhase('capture');
      setWords('');
      setBusy(null);
      setError(null);
      return;
    }
    void AudioModule.requestRecordingPermissionsAsync().then(async (permission) => {
      if (permission.granted) {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      }
    });
  }, [open]);

  useEffect(() => {
    if (isRecording && durationMillis >= MaxMs) {
      void stopAndHear();
    }
  }, [durationMillis, isRecording]);

  async function start() {
    keptWords.current = words;
    setError(null);
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function discard() {
    await recorder.stop();
  }

  async function stopAndHear() {
    const uri = (await recorder.stop(), recorder.uri);
    if (!uri) {
      setError('Nothing recorded — try again.');
      return;
    }
    setBusy('Transcribing…');
    setPhase('transcript');
    try {
      const heard = await hearClip({ uri }).unwrap();
      if (heard.transcript.trim()) {
        setWords((c) => joinWords(c, heard.transcript));
      }
      setClipKey(heard.storageKey ?? null);
      setClipWords(heard.words ?? null);
      setError(null);
    } catch {
      setError('Could not transcribe. Edit or re-record.');
    } finally {
      setBusy(null);
    }
  }

  async function applyUpdate() {
    const transcript = words.trim();
    if (!transcript) {
      setError('Say or type what changed.');
      return;
    }
    setBusy('Updating your day…');
    setError(null);
    try {
      const draft = await extractMidday({ transcript, dayId: day.id }).unwrap();
      const byId = new Map(draft.outcomes.map((item) => [item.id, item.status]));
      await updateMidday({
        timezone,
        transcript,
        dayId: day.id,
        storageKey: clipKey,
        words: clipWords,
        add: draft.add
          .map((item) => ({
            title: item.title.trim(),
            plannedStartMinute: item.plannedStartMinute ?? null,
            plannedDurationMinutes: item.plannedDurationMinutes ?? null,
            lifeArea: item.lifeArea ?? null,
          }))
          .filter((item) => item.title.length > 0),
        outcomes: day.commitments.map((item) => ({
          id: item.id,
          status: byId.get(item.id) ?? item.status,
        })),
        extras: draft.extras
          .map((item) => ({ title: item.title.trim(), lifeArea: item.lifeArea ?? null }))
          .filter((item) => item.title.length > 0),
      }).unwrap();
      await rememberWords(day.localDate, transcript);
      onSaved();
      onClose();
    } catch {
      setError('Could not save the update. Try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Dismiss" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.three, maxHeight: '88%' }]}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={12} style={styles.iconBtn}>
              <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={16} tintColor={PlanSheet.ink} />
            </Pressable>
            <View style={styles.headerCopy}>
              <ThemedText style={styles.kicker}>{longDayLabel(day.localDate)}</ThemedText>
              <ThemedText style={styles.title}>Add an update</ThemedText>
            </View>
            <PlanAssistantAvatar assistant={assistant} size="md" />
          </View>

          {phase === 'capture' ? (
            <>
              <ThemedText style={styles.sub}>
                {assistant.name} is listening — say what shifted (finished, moved, new task).
              </ThemedText>
              <View style={styles.captureStage}>
                {isRecording ? (
                  <PlanWaveHero active metering={metering} />
                ) : (
                  <PlanRecordButton onStart={() => void start()} />
                )}
              </View>
              {isRecording ? (
                <PlanRecordDock
                  durationMillis={durationMillis}
                  onSend={() => void stopAndHear()}
                  onDiscard={() => void discard()}
                />
              ) : (
                <Pressable accessibilityRole="button" onPress={() => setPhase('transcript')} style={styles.textLink}>
                  <ThemedText type="caption" style={{ color: PlanBlue.primary }}>
                    Type instead
                  </ThemedText>
                </Pressable>
              )}
            </>
          ) : (
            <>
              {busy ? (
                <View style={styles.busyRow}>
                  <ActivityIndicator color={PlanBlue.primary} />
                  <ThemedText type="bodyMedium" style={{ color: PlanSheet.ink }}>
                    {busy}
                  </ThemedText>
                </View>
              ) : (
                <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
                  <TextInput
                    value={words}
                    onChangeText={setWords}
                    multiline
                    placeholder="What changed?"
                    placeholderTextColor={PlanBlue.light}
                    style={styles.input}
                  />
                  {error ? (
                    <ThemedText type="small" style={{ color: PlanBlue.deep }}>
                      {error}
                    </ThemedText>
                  ) : null}
                </ScrollView>
              )}
              <Pressable
                accessibilityRole="button"
                disabled={!!busy || saveState.isLoading}
                onPress={() => void applyUpdate()}
                style={styles.primaryBtn}>
                {saveState.isLoading ? (
                  <ActivityIndicator color={PlanBlue.on} />
                ) : (
                  <ThemedText type="bodyMedium" style={{ color: PlanBlue.on }}>
                    Save update
                  </ThemedText>
                )}
              </Pressable>
            </>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: PlanSheet.scrim },
  sheet: {
    backgroundColor: PlanSheet.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: PlanSheet.border,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: PlanSheet.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PlanBlue.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: 2 },
  kicker: { ...Typography.caption, color: PlanBlue.mid },
  title: { ...Typography.title, color: PlanSheet.ink },
  sub: { ...Typography.bodySmall, color: PlanSheet.inkMuted, lineHeight: 22 },
  captureStage: { minHeight: 180, alignItems: 'center', justifyContent: 'center' },
  textLink: { alignSelf: 'center', paddingVertical: Spacing.one },
  body: { gap: Spacing.two, paddingBottom: Spacing.two },
  input: {
    minHeight: 140,
    borderWidth: 1,
    borderRadius: Radius.card,
    borderColor: PlanSheet.border,
    padding: Spacing.three,
    backgroundColor: '#FFFFFF',
    ...Typography.body,
    color: PlanSheet.ink,
    textAlignVertical: 'top',
  },
  busyRow: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  primaryBtn: {
    minHeight: 52,
    borderRadius: Radius.button,
    backgroundColor: PlanBlue.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
