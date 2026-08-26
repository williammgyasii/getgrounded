import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TalkLog } from '@/components/talk/talk-log';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';

export default function TalkScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingTop: insets.top + Spacing.five, paddingBottom: Spacing.five },
        ]}>
        <ThemedText style={styles.title}>Talk</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Type the day for now. Each line is a commitment. Wins start with win:.
        </ThemedText>
        <TalkLog />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontFamily: FontFamily.semibold,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
});
