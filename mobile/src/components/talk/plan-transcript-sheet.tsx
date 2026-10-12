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

import { PlanGradientBackdrop } from '@/components/talk/plan-gradient-backdrop';
import { ThemedText } from '@/components/themed-text';
import { PlanBlue } from '@/constants/plan-theme';
import { Radius, Spacing, Typography } from '@/constants/theme';

export function PlanTranscriptSheet({
  open,
  words,
  busy,
  error,
  onChangeWords,
  onClose,
  onContinue,
}: {
  open: boolean;
  words: string;
  busy?: string | null;
  error?: string | null;
  onChangeWords: (next: string) => void;
  onClose: () => void;
  onContinue: () => void;
}) {
  const insets = useSafeAreaInsets();
  const canContinue = words.trim().length > 0 && !busy;

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={styles.shell}>
        <PlanGradientBackdrop active={Boolean(busy)} />
        <KeyboardAvoidingView
          style={[styles.page, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.three }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.top}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={12}
              onPress={onClose}
              style={[styles.back, { backgroundColor: PlanBlue.mist, borderColor: PlanBlue.border }]}>
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={16}
                tintColor={PlanBlue.deep}
              />
            </Pressable>
            <View style={styles.topCopy}>
              <ThemedText style={styles.kicker}>Review</ThemedText>
              <ThemedText style={styles.title}>Your transcript</ThemedText>
            </View>
          </View>

          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Fix anything we missed, then continue to your schedule.
          </ThemedText>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}>
            {busy ? (
              <View style={styles.busyRow}>
                <ActivityIndicator color={PlanBlue.primary} />
                <ThemedText type="bodyMedium" style={{ color: PlanBlue.deep }}>
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
                placeholderTextColor={PlanBlue.light}
                style={[
                  styles.input,
                  {
                    color: PlanBlue.deep,
                    backgroundColor: PlanBlue.mist,
                    borderColor: PlanBlue.border,
                  },
                ]}
              />
            )}
            {error ? (
              <ThemedText type="small" style={{ color: PlanBlue.deep }}>
                {error}
              </ThemedText>
            ) : null}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            disabled={!canContinue}
            onPress={onContinue}
            style={({ pressed }) => [
              styles.continue,
              { backgroundColor: PlanBlue.primary, opacity: pressed || !canContinue ? 0.75 : 1 },
            ]}>
            <ThemedText type="bodyMedium" style={{ color: PlanBlue.on }}>
              Continue
            </ThemedText>
          </Pressable>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCopy: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    ...Typography.caption,
    color: PlanBlue.mid,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    ...Typography.title,
    color: PlanBlue.deep,
  },
  subtitle: {
    ...Typography.body,
    marginTop: -Spacing.one,
  },
  body: {
    flexGrow: 1,
    gap: Spacing.two,
  },
  busyRow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    minHeight: 200,
  },
  input: {
    flex: 1,
    minHeight: 220,
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.three,
    fontFamily: Typography.body.fontFamily,
    fontSize: 17,
    lineHeight: 26,
    textAlignVertical: 'top',
  },
  continue: {
    minHeight: 52,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
});
