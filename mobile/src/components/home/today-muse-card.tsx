import { Pressable, StyleSheet, View } from 'react-native';
import { type Href, router } from 'expo-router';

import { PlanAssistantAvatar } from '@/components/talk/plan-assistant-avatar';
import { ThemedText } from '@/components/themed-text';
import { PlanBlue } from '@/constants/plan-theme';
import { Spacing, Typography } from '@/constants/theme';
import { humanAiText } from '@/lib/human-text';
import { type PlanAssistant } from '@/lib/plan-assistant';

export function TodayMuseCard({
  assistant,
  coachNote,
  dayTitle,
}: {
  assistant: PlanAssistant;
  coachNote: string;
  dayTitle?: string | null;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.navigate('/talk' as Href)}
      style={styles.card}>
      <PlanAssistantAvatar assistant={assistant} size="md" />
      <View style={styles.copy}>
        <ThemedText type="caption" style={styles.kicker}>
          {assistant.name}
          {dayTitle?.trim() ? ` · ${humanAiText(dayTitle)}` : ''}
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.note}>
          {humanAiText(coachNote)}
        </ThemedText>
        <ThemedText type="caption" style={styles.link}>
          Open Plan
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PlanBlue.border,
    backgroundColor: PlanBlue.wash,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  kicker: {
    color: PlanBlue.mid,
    letterSpacing: 0.3,
  },
  note: {
    ...Typography.bodySmall,
    color: PlanBlue.deep,
    lineHeight: 22,
  },
  link: {
    color: PlanBlue.primary,
    marginTop: 2,
  },
});
