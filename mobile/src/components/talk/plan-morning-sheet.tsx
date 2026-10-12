import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { type PlanLine } from '@/components/talk/plan-task-card';
import { PlanRecordButton, PlanRecordDock } from '@/components/talk/plan-record-controls';
import { PlanSortList } from '@/components/talk/plan-sort-list';
import { PlanSuggestPreview } from '@/components/talk/plan-suggest-preview';
import { PlanWaveBadge } from '@/components/talk/plan-wave-badge';
import { PlanWaveHero } from '@/components/talk/plan-wave-hero';
import { ThemedText } from '@/components/themed-text';
import { PlanBlue } from '@/constants/plan-theme';
import { PlanSheet } from '@/constants/plan-sheet';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { type ClarifyQuestion, type PlanSuggestBlock } from '@/lib/api';
import { humanAiText } from '@/lib/human-text';
import { type PlanAssistant } from '@/lib/plan-assistant';

const ClarifyRecordPalette = {
  primary: '#5BD67A',
  primarySoft: 'rgba(91, 214, 122, 0.18)',
  primaryOn: '#0E1A12',
  record: '#5BD67A',
};

export type PlanMorningSheetPhase = 'capture' | 'transcript' | 'clarify' | 'tasks';

export type PlanCaptureState = {
  subtitle: string;
  isRecording: boolean;
  thinking: boolean;
  metering?: number;
  durationMillis: number;
  onStart: () => void;
  onSend: () => void;
  onDiscard: () => void;
};

export type PlanClarifyCaptureState = {
  isRecording: boolean;
  durationMillis: number;
  typing: boolean;
  onToggleTyping: () => void;
  onStart: () => void;
  onSend: () => void;
  onDiscard: () => void;
};

export function PlanMorningSheet({
  open,
  phase,
  words,
  busy,
  error,
  onChangeWords,
  onClose,
  onContinueFromTranscript,
  onBackToTranscript,
  dayTitle,
  onDayTitleChange: _onDayTitleChange,
  lines,
  onLineChange,
  onLineRemove,
  onReorder,
  onDragChange,
  onAddLine,
  onApproveAll,
  checkError,
  saveLoading,
  onSave,
  scrollLocked,
  saveLabel = 'Save the day',
  capture,
  onOpenTranscript,
  assistant,
  museLine,
  clarifyQuestions = [],
  clarifyAnswer = '',
  onClarifyAnswerChange,
  onContinueFromClarify,
  onSkipClarify,
  suggestBlocks = [],
  buildLoading = false,
  alternateLoading = false,
  onAlternatePath,
  onReplaySuggestVoice,
  onStartRevise,
  reviseLoading = false,
  coachNote,
  clarifyCapture,
  onStopNevoVoice,
  nevoSpeaking,
}: {
  open: boolean;
  phase: PlanMorningSheetPhase;
  capture?: PlanCaptureState | null;
  onOpenTranscript?: () => void;
  assistant?: PlanAssistant;
  museLine?: string;
  clarifyQuestions?: ClarifyQuestion[];
  clarifyAnswer?: string;
  onClarifyAnswerChange?: (value: string) => void;
  onContinueFromClarify?: () => void;
  onSkipClarify?: () => void;
  suggestBlocks?: PlanSuggestBlock[];
  buildLoading?: boolean;
  alternateLoading?: boolean;
  onAlternatePath?: () => void;
  onReplaySuggestVoice?: () => void;
  onStartRevise?: () => void;
  reviseLoading?: boolean;
  coachNote?: string | null;
  clarifyCapture?: PlanClarifyCaptureState | null;
  onStopNevoVoice?: () => void;
  nevoSpeaking?: boolean;
  words: string;
  busy?: string | null;
  error?: string | null;
  onChangeWords: (next: string) => void;
  onClose: () => void;
  onContinueFromTranscript: () => void;
  onBackToTranscript: () => void;
  dayTitle: string;
  onDayTitleChange: (next: string) => void;
  lines: PlanLine[];
  onLineChange: (next: PlanLine) => void;
  onLineRemove: (key: string) => void;
  onReorder: (next: PlanLine[]) => void;
  onDragChange: (active: boolean) => void;
  onAddLine: () => void;
  onApproveAll: () => void;
  checkError: string | null;
  saveLoading: boolean;
  onSave: () => void;
  scrollLocked?: boolean;
  saveLabel?: string;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const canContinue = words.trim().length > 0 && !busy;
  const canSendTypedClarify = (clarifyAnswer ?? '').trim().length > 0 && !busy;
  const allApproved = lines.length > 0 && lines.every((line) => line.approved);
  const tallSheet = phase === 'tasks';
  const standardSheet = phase === 'capture' || phase === 'transcript' || phase === 'clarify';
  const clarifyRecording = clarifyCapture?.isRecording === true;
  const stepKicker =
    phase === 'capture' ? 'Step 1' : phase === 'transcript' ? 'Step 2' : phase === 'clarify' ? 'Step 3' : 'Step 4';
  const stepTitle =
    phase === 'capture'
      ? 'Say your plan'
      : phase === 'transcript'
        ? 'Your words'
        : phase === 'clarify'
          ? `${assistant?.name ?? 'Nevo'}'s plan`
          : 'Save your plan';
  const sheetMaxHeight = tallSheet
    ? windowHeight - insets.top - 8
    : Math.min(windowHeight * 0.78, windowHeight - insets.top - 48);
  const sheetMinHeight = standardSheet
    ? sheetMaxHeight * 0.92
    : tallSheet
      ? sheetMaxHeight * 0.88
      : undefined;

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} accessibilityLabel="Dismiss" onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[
            styles.sheet,
            phase === 'clarify' && styles.sheetClarify,
            tallSheet && styles.sheetTall,
            {
              paddingBottom: insets.bottom + Spacing.three,
              maxHeight: sheetMaxHeight,
              minHeight: sheetMinHeight,
            },
          ]}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            {phase === 'tasks' || phase === 'clarify' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to transcript"
                hitSlop={12}
                onPress={onBackToTranscript}
                style={styles.iconBtn}>
                <SymbolView
                  name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
                  size={18}
                  tintColor={PlanSheet.ink}
                />
              </Pressable>
            ) : (
              <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} onPress={onClose} style={styles.iconBtn}>
                <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={16} tintColor={PlanSheet.ink} />
              </Pressable>
            )}
            <View style={styles.headerCopy}>
              <ThemedText style={styles.kicker}>{stepKicker}</ThemedText>
              <ThemedText style={styles.title}>{stepTitle}</ThemedText>
            </View>
            {phase === 'clarify' && onReplaySuggestVoice ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={nevoSpeaking ? 'Pause Nevo' : 'Listen to Nevo'}
                hitSlop={12}
                onPress={nevoSpeaking && onStopNevoVoice ? onStopNevoVoice : onReplaySuggestVoice}
                style={styles.voiceChip}>
                <PlanWaveBadge speaking={nevoSpeaking === true} alive />
              </Pressable>
            ) : nevoSpeaking && onStopNevoVoice ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Pause Nevo voice"
                hitSlop={12}
                onPress={onStopNevoVoice}
                style={styles.iconBtn}>
                <SymbolView
                  name={{ ios: 'pause.fill', android: 'pause', web: 'pause' }}
                  size={16}
                  tintColor={PlanSheet.ink}
                />
              </Pressable>
            ) : phase === 'capture' && onOpenTranscript ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Type your plan"
                hitSlop={12}
                onPress={onOpenTranscript}
                style={styles.iconBtn}>
                <SymbolView
                  name={{ ios: 'keyboard', android: 'keyboard', web: 'keyboard' }}
                  size={18}
                  tintColor={PlanSheet.ink}
                />
              </Pressable>
            ) : phase === 'clarify' && clarifyCapture ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={clarifyCapture.typing ? 'Use voice' : 'Type answer'}
                hitSlop={12}
                onPress={clarifyCapture.onToggleTyping}
                style={styles.iconBtn}>
                <SymbolView
                  name={
                    clarifyCapture.typing
                      ? { ios: 'mic.fill', android: 'mic', web: 'mic' }
                      : { ios: 'keyboard', android: 'keyboard', web: 'keyboard' }
                  }
                  size={18}
                  tintColor={PlanSheet.ink}
                />
              </Pressable>
            ) : (
              <View style={styles.iconSpacer} />
            )}
          </View>

          {phase === 'capture' && capture ? (
            <View style={styles.standardBody}>
              {assistant ? (
                <ThemedText style={styles.museHint}>
                  {capture.isRecording
                    ? `${assistant.name} is listening…`
                    : capture.thinking
                      ? 'Got it. One moment.'
                      : 'Tap record when you are ready.'}
                </ThemedText>
              ) : null}
              <ThemedText style={styles.subtitle}>{capture.subtitle}</ThemedText>
              <View style={styles.captureStage}>
                {capture.isRecording ? (
                  <PlanWaveHero active metering={capture.metering} />
                ) : capture.thinking ? (
                  <View style={styles.busyRow}>
                    <ActivityIndicator color={PlanSheet.accent} />
                    <ThemedText type="bodyMedium" style={{ color: PlanSheet.ink }}>
                      One moment…
                    </ThemedText>
                  </View>
                ) : (
                  <PlanRecordButton onStart={capture.onStart} />
                )}
              </View>
              {capture.isRecording ? (
                <PlanRecordDock
                  durationMillis={capture.durationMillis}
                  onSend={capture.onSend}
                  onDiscard={capture.onDiscard}
                />
              ) : null}
            </View>
          ) : phase === 'transcript' ? (
            <View style={styles.standardBody}>
              <ThemedText style={styles.subtitle}>
                Fix the transcript, then {assistant?.name ?? 'Nevo'} will review it with you.
              </ThemedText>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}>
                {busy ? (
                  <View style={styles.busyRow}>
                    <ActivityIndicator color={PlanSheet.accent} />
                    <ThemedText type="bodyMedium" style={{ color: PlanSheet.ink }}>
                      {busy}
                    </ThemedText>
                  </View>
                ) : (
                  <TextInput
                    value={words}
                    onChangeText={onChangeWords}
                    multiline
                    autoFocus={open && words.length === 0}
                    placeholder="What's on today?"
                    placeholderTextColor={PlanSheet.inkDim}
                    style={styles.input}
                  />
                )}
                {error ? (
                  <ThemedText type="small" style={{ color: '#E88A8A' }}>
                    {error}
                  </ThemedText>
                ) : null}
              </ScrollView>
              <Pressable
                accessibilityRole="button"
                disabled={!canContinue}
                onPress={onContinueFromTranscript}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { opacity: pressed || !canContinue ? 0.75 : 1 },
                ]}>
                <ThemedText type="bodyMedium" style={{ color: PlanBlue.on }}>
                  Continue with {assistant?.name ?? 'Nevo'}
                </ThemedText>
              </Pressable>
            </View>
          ) : phase === 'clarify' ? (
            <View style={styles.clarifyShell}>
              <ScrollView
                style={styles.clarifyScroll}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={[styles.body, styles.clarifyBody]}
                showsVerticalScrollIndicator={false}>
                {busy && !buildLoading && !alternateLoading && !reviseLoading ? (
                  <View style={styles.busyRow}>
                    <ActivityIndicator color={PlanBlue.primary} />
                    <ThemedText type="bodyMedium" style={{ color: PlanSheet.ink }}>
                      {busy}
                    </ThemedText>
                  </View>
                ) : (
                  <>
                    <PlanSuggestPreview intro={museLine} blocks={suggestBlocks} />
                    {clarifyQuestions.length > 0 ? (
                      <View style={styles.clarifyOptionalAsk}>
                        <ThemedText type="caption" style={{ color: PlanSheet.inkMuted }}>
                          Optional
                        </ThemedText>
                        <ThemedText type="bodyMedium" style={{ color: PlanSheet.ink, lineHeight: 22 }}>
                          {humanAiText(clarifyQuestions[0]?.prompt)}
                        </ThemedText>
                      </View>
                    ) : null}
                    {clarifyCapture?.typing ? (
                      <TextInput
                        value={clarifyAnswer}
                        onChangeText={(next) => onClarifyAnswerChange?.(next)}
                        placeholder="Type your answer"
                        placeholderTextColor={PlanSheet.inkDim}
                        multiline
                        style={[styles.clarifyInput, styles.clarifyInputTall]}
                      />
                    ) : null}
                  </>
                )}
                {error ? (
                  <ThemedText type="small" style={{ color: '#E88A8A' }}>
                    {error}
                  </ThemedText>
                ) : null}
              </ScrollView>
              {clarifyCapture && (!busy || buildLoading || alternateLoading || reviseLoading) ? (
                clarifyCapture.typing ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={!canSendTypedClarify}
                    onPress={onContinueFromClarify}
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      { opacity: pressed || !canSendTypedClarify ? 0.75 : 1 },
                    ]}>
                    <ThemedText type="bodyMedium" style={styles.primaryBtnLabel}>
                      Send typed answer
                    </ThemedText>
                  </Pressable>
                ) : clarifyCapture.isRecording ? (
                  <PlanRecordDock
                    palette={ClarifyRecordPalette}
                    durationMillis={clarifyCapture.durationMillis}
                    onSend={clarifyCapture.onSend}
                    onDiscard={clarifyCapture.onDiscard}
                  />
                ) : (
                  <View style={styles.clarifyFooterActions}>
                    {onSkipClarify ? (
                      <Pressable
                        accessibilityRole="button"
                        disabled={buildLoading || alternateLoading}
                        onPress={onSkipClarify}
                        style={({ pressed }) => [
                          styles.clarifyPrimaryBtn,
                          { opacity: pressed || buildLoading || alternateLoading ? 0.75 : 1 },
                        ]}>
                        {buildLoading ? (
                          <ActivityIndicator color={PlanBlue.on} />
                        ) : (
                          <>
                            <SymbolView
                              name={{ ios: 'calendar.badge.plus', android: 'event', web: 'event' }}
                              size={18}
                              tintColor={PlanBlue.on}
                            />
                            <ThemedText type="bodyMedium" style={styles.primaryBtnLabel}>
                              Build my day
                            </ThemedText>
                          </>
                        )}
                      </Pressable>
                    ) : null}
                    {onAlternatePath ? (
                      <Pressable
                        accessibilityRole="button"
                        disabled={buildLoading || alternateLoading}
                        onPress={onAlternatePath}
                        style={({ pressed }) => [
                          styles.clarifySecondaryBtn,
                          { opacity: pressed || buildLoading || alternateLoading ? 0.75 : 1 },
                        ]}>
                        {alternateLoading ? (
                          <ActivityIndicator color={PlanBlue.primary} />
                        ) : (
                          <>
                            <SymbolView
                              name={{ ios: 'arrow.triangle.2.circlepath', android: 'sync', web: 'sync' }}
                              size={18}
                              tintColor={PlanBlue.primary}
                            />
                            <ThemedText type="bodyMedium" style={styles.secondaryBtnLabel}>
                              Another path
                            </ThemedText>
                          </>
                        )}
                      </Pressable>
                    ) : null}
                    {onStartRevise ? (
                      <Pressable
                        accessibilityRole="button"
                        disabled={buildLoading || alternateLoading || reviseLoading}
                        onPress={onStartRevise}
                        style={({ pressed }) => [
                          styles.clarifyGhostBtn,
                          { opacity: pressed || buildLoading || alternateLoading || reviseLoading ? 0.75 : 1 },
                        ]}>
                        {reviseLoading ? (
                          <ActivityIndicator color={PlanSheet.ink} />
                        ) : (
                          <>
                            <SymbolView
                              name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
                              size={18}
                              tintColor={PlanSheet.ink}
                            />
                            <ThemedText type="bodyMedium" style={{ color: PlanSheet.ink }}>
                              Correct by voice
                            </ThemedText>
                          </>
                        )}
                      </Pressable>
                    ) : null}
                  </View>
                )
              ) : null}
            </View>
          ) : (
            <>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                scrollEnabled={!scrollLocked}
                style={styles.tasksScroll}
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}>
                {coachNote?.trim() ? (
                  <View style={styles.museBubble}>
                    <ThemedText type="bodySmall" style={{ color: PlanSheet.inkMuted, flex: 1, lineHeight: 22 }}>
                      {humanAiText(coachNote)}
                    </ThemedText>
                  </View>
                ) : null}
                {dayTitle.trim().length > 0 ? (
                  <View style={styles.dayNameBadge}>
                    <ThemedText type="caption" style={{ color: PlanSheet.inkMuted }}>
                      Your day
                    </ThemedText>
                    <ThemedText type="titleMedium" style={{ color: PlanSheet.ink }}>
                      {humanAiText(dayTitle)}
                    </ThemedText>
                  </View>
                ) : null}
                <View style={styles.taskHeader}>
                  <ThemedText type="overline" style={{ color: PlanSheet.inkMuted, flex: 1 }}>
                    Tasks
                  </ThemedText>
                  {!allApproved ? (
                    <Pressable accessibilityRole="button" onPress={onApproveAll} hitSlop={8}>
                      <ThemedText type="smallBold" style={{ color: PlanBlue.primary }}>
                        Approve all
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </View>
                <PlanSortList
                  compact
                  lines={lines}
                  onChange={onLineChange}
                  onRemove={onLineRemove}
                  onReorder={onReorder}
                  onDragChange={onDragChange}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={onAddLine}
                  style={[styles.addRow, { borderColor: PlanBlue.border }]}>
                  <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={18} tintColor={PlanBlue.primary} />
                  <ThemedText type="bodyMedium" style={{ color: PlanBlue.primary }}>
                    Add task
                  </ThemedText>
                </Pressable>
                {checkError ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {checkError}
                  </ThemedText>
                ) : null}
              </ScrollView>
              <Pressable
                accessibilityRole="button"
                disabled={saveLoading}
                onPress={onSave}
                style={({ pressed }) => [styles.primaryBtn, { opacity: pressed || saveLoading ? 0.75 : 1 }]}>
                {saveLoading ? (
                  <ActivityIndicator color={PlanBlue.on} />
                ) : (
                  <ThemedText type="bodyMedium" style={{ color: PlanBlue.on }}>
                    {saveLabel}
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
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: PlanSheet.scrim,
  },
  sheet: {
    width: '100%',
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
  sheetClarify: {
    flex: 1,
  },
  sheetTall: {
    flexGrow: 0,
  },
  tasksScroll: {
    flexGrow: 1,
    flexShrink: 1,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: PlanSheet.border,
    marginBottom: Spacing.one,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PlanSheet.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  iconSpacer: {
    width: 36,
  },
  standardBody: {
    flex: 1,
    gap: Spacing.two,
    minHeight: 0,
  },
  clarifyShell: {
    flex: 1,
    minHeight: 0,
    gap: Spacing.two,
  },
  clarifyScroll: {
    flex: 1,
    minHeight: 0,
  },
  clarifyRecordStage: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  captureStage: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
  },
  clarifyBody: {
    paddingBottom: Spacing.two,
    gap: Spacing.three,
  },
  clarifyKicker: {
    color: PlanSheet.inkMuted,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  clarifyAssistantCard: {
    backgroundColor: PlanSheet.bgElevated,
    borderWidth: 1,
    borderColor: PlanSheet.border,
    borderRadius: Radius.card,
    padding: Spacing.three,
  },
  clarifyAssistantText: {
    color: PlanSheet.ink,
    lineHeight: 24,
  },
  clarifyOptionalAsk: {
    gap: 6,
    paddingTop: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PlanSheet.border,
  },
  clarifyFooterActions: {
    gap: Spacing.two,
  },
  voiceChip: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.button,
    backgroundColor: PlanSheet.accentSoft,
    borderWidth: 1,
    borderColor: PlanSheet.border,
    overflow: 'hidden',
  },
  clarifyPrimaryBtn: {
    flexDirection: 'row',
    gap: Spacing.two,
    backgroundColor: PlanBlue.primary,
    borderRadius: Radius.button,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  clarifySecondaryBtn: {
    flexDirection: 'row',
    gap: Spacing.two,
    backgroundColor: PlanBlue.soft,
    borderRadius: Radius.button,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: PlanBlue.border,
  },
  clarifyGhostBtn: {
    flexDirection: 'row',
    gap: Spacing.two,
    borderRadius: Radius.button,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PlanSheet.border,
  },
  primaryBtnLabel: {
    ...Typography.bodyMedium,
    color: PlanBlue.on,
    fontWeight: '600',
  },
  secondaryBtnLabel: {
    ...Typography.bodyMedium,
    color: PlanBlue.deep,
    fontWeight: '600',
  },
  clarifyInputTall: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  kicker: {
    ...Typography.caption,
    color: PlanSheet.inkMuted,
    letterSpacing: 0.4,
  },
  title: {
    ...Typography.title,
    color: PlanSheet.ink,
  },
  subtitle: {
    ...Typography.bodySmall,
    marginTop: -Spacing.one,
    color: PlanSheet.inkMuted,
  },
  museRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  museHint: {
    ...Typography.bodySmall,
    color: PlanSheet.inkMuted,
    flex: 1,
  },
  museBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.card,
    backgroundColor: PlanSheet.museBubble,
    borderWidth: 1,
    borderColor: PlanSheet.border,
  },
  clarifyBlock: {
    gap: Spacing.two,
  },
  clarifyAnswerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  clarifyInput: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.button,
    borderColor: PlanSheet.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: PlanSheet.bgElevated,
    color: PlanSheet.ink,
    fontFamily: Typography.body.fontFamily,
    fontSize: 16,
  },
  clarifyMic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: PlanSheet.border,
    backgroundColor: PlanSheet.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clarifyMicActive: {
    borderColor: PlanSheet.accent,
    backgroundColor: PlanSheet.accentSoft,
  },
  body: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  busyRow: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  input: {
    minHeight: 160,
    borderWidth: 1,
    borderRadius: Radius.card,
    borderColor: PlanSheet.border,
    padding: Spacing.three,
    backgroundColor: PlanSheet.bgElevated,
    color: PlanSheet.ink,
    fontFamily: Typography.body.fontFamily,
    fontSize: 17,
    lineHeight: 26,
    textAlignVertical: 'top',
  },
  dayNameBadge: {
    gap: 4,
    paddingBottom: Spacing.one,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.button,
    paddingVertical: 12,
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: Radius.button,
    backgroundColor: PlanBlue.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
});
