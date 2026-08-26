import { ConversationProvider, useConversation } from '@elevenlabs/react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { PermissionsAndroid, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getFirebaseAuth } from '@/lib/firebase';
import { useStartVoiceSessionMutation } from '@/store/api';

async function requestMicrophonePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
    title: 'Microphone Permission',
    message: 'This app needs microphone access to enable voice conversations.',
    buttonNeutral: 'Ask Me Later',
    buttonNegative: 'Cancel',
    buttonPositive: 'OK',
  });

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export function TalkAgent() {
  return (
    <ConversationProvider>
      <TalkRoom />
    </ConversationProvider>
  );
}

function TalkRoom() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [startVoiceSession] = useStartVoiceSessionMutation();
  const [note, setNote] = useState(
    'Tap the mic. We mint a short-lived ticket, then start the ElevenLabs session.',
  );

  const conversation = useConversation({
    onConnect: () => {
      setNote('Connected. Talk naturally.');
    },
    onDisconnect: () => {
      setNote('Disconnected. Tap the mic to start again.');
    },
    onMessage: (message) => {
      if (typeof message === 'object' && message && 'message' in message) {
        const text = (message as { message?: string }).message;
        if (text) {
          setNote(text);
        }
      }
    },
    onError: (error) => {
      setNote(typeof error === 'string' ? error : 'Conversation error.');
    },
  });

  const connected = conversation.status === 'connected';

  async function startConversation() {
    const allowed = await requestMicrophonePermission();
    if (!allowed) {
      setNote('Microphone permission is required to talk.');
      return;
    }

    const user = getFirebaseAuth().currentUser;
    if (!user) {
      setNote('Sign in again, then come back to talk.');
      return;
    }

    try {
      const session = await startVoiceSession().unwrap();
      await conversation.startSession({
        conversationToken: session.conversationToken,
        userId: user.uid,
      });
    } catch (error) {
      setNote(typeof error === 'string' ? error : 'Failed to start conversation.');
    }
  }

  async function endConversation() {
    try {
      await conversation.endSession();
    } catch (error) {
      setNote(error instanceof Error ? error.message : 'Failed to end conversation.');
    }
  }

  return (
    <ThemedView style={styles.screen}>
      <View style={[styles.top, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Today"
          hitSlop={12}
          onPress={() => {
            if (connected) {
              void endConversation();
            }
            router.navigate('/today');
          }}
          style={styles.close}>
          <SymbolView
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            size={18}
            tintColor={theme.text}
          />
        </Pressable>
      </View>
      <View style={[styles.body, { paddingBottom: Spacing.five }]}>
        <ThemedText style={styles.title}>Talk</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.status}>
          Status: {conversation.status}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.speaking}>
          Agent is {conversation.isSpeaking ? 'speaking' : 'not speaking'}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {note}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={connected ? 'End conversation' : 'Start conversation'}
          onPress={connected ? endConversation : startConversation}
          style={[
            styles.mic,
            {
              backgroundColor: connected ? theme.accent : theme.primary,
              shadowColor: theme.text,
            },
          ]}>
          <SymbolView
            name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
            size={40}
            tintColor={theme.primaryOn}
          />
        </Pressable>
        <ThemedText type="small" themeColor="textSecondary">
          {connected ? 'End Conversation' : 'Start Conversation'}
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
  status: {
    fontSize: 16,
    lineHeight: 22,
  },
  speaking: {
    fontSize: 14,
    lineHeight: 20,
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
