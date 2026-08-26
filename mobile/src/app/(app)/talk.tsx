import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { startVoiceSession } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';

export default function TalkScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(
    'Tap the mic. We ask our API for a short-lived ElevenLabs ticket — the key never leaves the server.',
  );

  async function onTalk() {
    if (busy) {
      return;
    }

    setBusy(true);
    try {
      const user = getFirebaseAuth().currentUser;
      if (!user) {
        throw new Error('Sign in again, then come back to talk.');
      }

      const token = await user.getIdToken();
      const session = await startVoiceSession(token);
      setStatus(
        `Ticket minted for ${session.agentId}. Live audio needs the GetGrounded dev build — Expo Go cannot open ElevenLabs WebRTC.`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not start a voice session.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView style={styles.screen}>
      <View style={[styles.top, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.close}>
          <SymbolView
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            size={18}
            tintColor={theme.text}
          />
        </Pressable>
      </View>
      <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, Spacing.five) }]}>
        <ThemedText style={styles.title}>Talk</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {status}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start talking"
          disabled={busy}
          onPress={onTalk}
          style={[
            styles.mic,
            {
              backgroundColor: theme.primary,
              shadowColor: theme.text,
              opacity: busy ? 0.7 : 1,
            },
          ]}>
          <SymbolView
            name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
            size={40}
            tintColor={theme.primaryOn}
          />
        </Pressable>
        <ThemedText type="small" themeColor="textSecondary">
          {busy ? 'Asking the API…' : 'GetGrounded · ElevenLabs'}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  top: {
    paddingHorizontal: Spacing.four,
  },
  close: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
    maxWidth: 320,
  },
  mic: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
