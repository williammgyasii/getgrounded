import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
import { PlanSurface } from '@/constants/plan-surface';
import { PlanSheet } from '@/constants/plan-sheet';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { type DayRecord, deviceTimezone, type MiddayDraft, type SpokenWord } from '@/lib/api';
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
  const [updateMidday] = useUpdateMiddayMutation();

  const [typing, setTyping] = useState(false);
  const [words, setWords] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isRecording = rec.isRecording;
  const durationMillis = rec.durationMillis;
  const metering = rec.metering;

  useEffect(() => {
    if (!open) {
      setTyping(false);
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
      void stopRecordAndSave();
    }
  }, [durationMillis, isRecording]);

  async function start() {
    setError(null);
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function discard() {
    await recorder.stop();
  }

  async function saveFromTranscript(
    transcript: string,
    clipKey: string | null,
    clipWords: SpokenWord[] | null,
  ) {
    const trimmed = transcript.trim();
    if (!trimmed) {
      setError('Say or type what changed.');
      return;
    }

    setBusy('Updating your day…');
    setError(null);
    try {
      const draft = await extractMidday({ transcript: trimmed, dayId: day.id }).unwrap();
      await commitMidday(trimmed, draft, clipKey, clipWords);
      await rememberWords(day.localDate, trimmed);
      onSaved();
      onClose();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'data' in err
          ? String((err as { data?: { error?: string } }).data?.error ?? '')
          : '';
      setError(
        message
          ? `Could not save (${message}). Restart the API if you recently pulled changes.`
          : 'Could not save. Restart the API, then try again.',
      );
    } finally {
      setBusy(null);
    }
  }

  async function commitMidday(
    transcript: string,
    draft: MiddayDraft,
    clipKey: string | null,
    clipWords: SpokenWord[] | null,
  ) {
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
  }

  async function stopRecordAndSave() {
    const uri = (await recorder.stop(), recorder.uri);
    if (!uri) {
      setError('Nothing recorded — try again.');
      return;
    }

    setBusy('Listening…');
    setError(null);
    try {
      const heard = await hearClip({ uri }).unwrap();
      await saveFromTranscript(heard.transcript, heard.storageKey ?? null, heard.words ?? null);
    } catch {
      setError('Could not hear that. Type it instead.');
      setTyping(true);
      setBusy(null);
    }
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Dismiss" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.three }]}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={12} style={styles.iconBtn}>
              <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={16} tintColor={PlanSheet.ink} />
            </Pressable>
            <View style={styles.headerCopy}>
              <ThemedText style={styles.kicker}>{longDayLabel(day.localDate)}</ThemedText>
              <ThemedText style={styles.title}>Add an update</ThemedText>
            </View>
            <PlanAssistantAvatar assistant={assistant} size="md" minimal />
          </View>

          <ThemedText style={styles.sub}>
            Say what shifted — we only change what you mention. Existing tasks stay as they are.
          </ThemedText>

          {busy ? (
            <View style={styles.busyRow}>
              <ActivityIndicator color={PlanSurface.accent} />
              <ThemedText type="bodyMedium" style={{ color: PlanSheet.ink }}>
                {busy}
              </ThemedText>
            </View>
          ) : typing ? (
            <>
              <TextInput
                value={words}
                onChangeText={setWords}
                multiline
                autoFocus
                placeholder="e.g. I have an interview at 1"
                placeholderTextColor={PlanSheet.inkDim}
                style={styles.input}
              />
              {error ? (
                <ThemedText type="small" style={styles.error}>
                  {error}
                </ThemedText>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => void saveFromTranscript(words, null, null)}
                style={styles.primaryBtn}>
                <ThemedText type="bodyMedium" style={{ color: PlanSurface.bgDeep }}>
                  Save update
                </ThemedText>
              </Pressable>
            </>
          ) : (
            <>
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
                  onSend={() => void stopRecordAndSave()}
                  onDiscard={() => void discard()}
                />
              ) : (
                <Pressable accessibilityRole="button" onPress={() => setTyping(true)} style={styles.textLink}>
                  <ThemedText type="caption" style={{ color: PlanSurface.accent }}>
                    Type instead
                  </ThemedText>
                </Pressable>
              )}
              {error ? (
                <ThemedText type="small" style={styles.error}>
                  {error}
                </ThemedText>
              ) : null}
            </>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: PlanSheet.scrim },
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
    backgroundColor: PlanSheet.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PlanSheet.border,
  },
  headerCopy: { flex: 1, gap: 2 },
  kicker: { ...Typography.caption, color: PlanSheet.inkMuted },
  title: { ...Typography.title, color: PlanSheet.ink },
  sub: { ...Typography.bodySmall, color: PlanSheet.inkMuted, lineHeight: 22 },
  captureStage: { minHeight: 160, alignItems: 'center', justifyContent: 'center' },
  textLink: { alignSelf: 'center', paddingVertical: Spacing.one },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: Radius.card,
    borderColor: PlanSheet.border,
    padding: Spacing.three,
    backgroundColor: PlanSurface.bgDeep,
    ...Typography.body,
    color: PlanSurface.text,
    textAlignVertical: 'top',
  },
  busyRow: { minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  error: { color: '#E88A8A' },
  primaryBtn: {
    minHeight: 52,
    borderRadius: Radius.button,
    backgroundColor: PlanSurface.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
