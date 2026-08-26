import { type ComponentType } from 'react';
import { NativeModules, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TalkLog } from '@/components/talk/talk-log';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';

function hasWebRtcNative(): boolean {
  return NativeModules.WebRTCModule != null;
}

export default function TalkScreen() {
  if (hasWebRtcNative()) {
    const { TalkAgent } = require('@/components/talk/talk-agent') as {
      TalkAgent: ComponentType;
    };
    return <TalkAgent />;
  }

  return <TalkStandIn />;
}

function TalkStandIn() {
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
          Agents wait on the LiveKit APK. Until then, type the day. Each line is a commitment.
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
