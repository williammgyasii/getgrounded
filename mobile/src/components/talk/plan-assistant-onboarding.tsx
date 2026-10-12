import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlanAssistantAvatar } from '@/components/talk/plan-assistant-avatar';
import { ThemedText } from '@/components/themed-text';
import { PlanBlue } from '@/constants/plan-theme';
import { PlanSheet } from '@/constants/plan-sheet';
import { Radius, Spacing, Typography } from '@/constants/theme';
import {
  type AssistantTone,
  type PlanAssistant,
  nevoTapLine,
  savePlanAssistant,
} from '@/lib/plan-assistant';
import { speakNevo } from '@/lib/muse-speak';

const Tones: { id: AssistantTone; label: string; hint: string }[] = [
  { id: 'warm', label: 'Warm friend', hint: 'Gentle, personal, one day at a time' },
  { id: 'coach', label: 'Coach', hint: 'Direct and encouraging' },
  { id: 'witty', label: 'Witty', hint: 'Light humor, still kind' },
];

export function PlanAssistantOnboarding({
  open,
  initial,
  onDone,
}: {
  open: boolean;
  initial: PlanAssistant;
  onDone: (profile: PlanAssistant) => void;
}) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initial.name);
  const [tone, setTone] = useState<AssistantTone>(initial.tone);

  async function finish() {
    const profile: PlanAssistant = {
      name: name.trim() || 'Nevo',
      tone,
      onboarded: true,
    };
    await savePlanAssistant(profile);
    onDone(profile);
  }

  const preview: PlanAssistant = { name: name.trim() || 'Nevo', tone, onboarded: true };

  return (
    <Modal visible={open} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.screen, { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + Spacing.four }]}>
        <PlanAssistantAvatar
          assistant={preview}
          size="lg"
          interactive
          onPress={() => void speakNevo(nevoTapLine(preview))}
        />
        <ThemedText style={styles.title}>Meet Nevo</ThemedText>
        <ThemedText style={styles.sub}>
          Your day coach — not a calendar boss. Keep the name or make it yours, pick a vibe, then plan out loud.
        </ThemedText>

        <ThemedText style={styles.label}>Name</ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nevo"
          placeholderTextColor={PlanBlue.light}
          style={styles.input}
        />

        <ThemedText style={styles.label}>Personality</ThemedText>
        {Tones.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => setTone(item.id)}
            style={[styles.toneRow, tone === item.id && styles.toneRowActive]}>
            <ThemedText type="bodyMedium" style={{ color: PlanSheet.ink }}>
              {item.label}
            </ThemedText>
            <ThemedText type="caption" style={{ color: PlanSheet.inkMuted }}>
              {item.hint}
            </ThemedText>
          </Pressable>
        ))}

        <Pressable accessibilityRole="button" onPress={() => void finish()} style={styles.cta}>
          <ThemedText type="bodyMedium" style={{ color: PlanBlue.on }}>
            Start planning
          </ThemedText>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PlanSheet.bgAlt,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    alignItems: 'stretch',
  },
  title: {
    ...Typography.headline,
    color: PlanSheet.ink,
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  sub: {
    ...Typography.bodySmall,
    color: PlanSheet.inkMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.two,
  },
  label: {
    ...Typography.caption,
    color: PlanBlue.mid,
    marginTop: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderColor: PlanSheet.border,
    borderRadius: Radius.field,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    ...Typography.body,
    color: PlanSheet.ink,
  },
  toneRow: {
    borderWidth: 1,
    borderColor: PlanSheet.border,
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: 4,
    backgroundColor: PlanBlue.mist,
  },
  toneRowActive: {
    borderColor: PlanBlue.primary,
    backgroundColor: PlanBlue.soft,
  },
  cta: {
    marginTop: 'auto',
    minHeight: 52,
    borderRadius: Radius.button,
    backgroundColor: PlanBlue.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
