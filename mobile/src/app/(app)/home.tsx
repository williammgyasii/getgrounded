import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Alert, StyleSheet, View } from 'react-native';

import { useAuthUser } from '@/components/auth/auth-session';
import { HomeTopBar } from '@/components/home/home-top-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getFirebaseAuth } from '@/lib/firebase';

function dayPart(now = new Date()): 'morning' | 'evening' {
  return now.getHours() < 16 ? 'morning' : 'evening';
}

function weekdayDate(now = new Date()): string {
  return now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function initialFrom(email: string | null | undefined): string {
  const local = email?.split('@')[0]?.trim();
  return local ? local[0].toUpperCase() : '';
}

export default function HomeScreen() {
  const theme = useTheme();
  const user = useAuthUser();
  const part = dayPart();
  const title = part === 'morning' ? 'Good morning' : 'Good evening';
  const prompt =
    part === 'morning'
      ? 'Say the day out loud. The mic is waiting below.'
      : 'How did you actually show up today?';

  async function onSignOut() {
    await signOut(getFirebaseAuth());
    router.replace('/');
  }

  function onAvatar() {
    Alert.alert(user?.email ?? 'Account', undefined, [
      { text: 'You', onPress: () => router.push('/you') },
      { text: 'Sign out', style: 'destructive', onPress: onSignOut },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <ThemedView style={styles.screen}>
      <HomeTopBar
        title={title}
        subtitle={weekdayDate()}
        initial={initialFrom(user?.email)}
        onAvatarPress={onAvatar}
      />
      <View style={styles.content}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
            },
          ]}>
          <ThemedText style={styles.headline}>Ready when you are</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.prompt}>
            {prompt}
          </ThemedText>
        </View>

        <View
          style={[
            styles.streak,
            { backgroundColor: theme.primarySoft, borderColor: theme.primarySoft },
          ]}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            0 days shown up
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Streaks reward honesty, not a perfect list.
          </ThemedText>
        </View>

        <View
          style={[
            styles.card,
            styles.today,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
            },
          ]}>
          <ThemedText type="smallBold">Today</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.prompt}>
            Nothing spoken yet.
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  today: {
    flexGrow: 1,
  },
  headline: {
    fontFamily: FontFamily.semibold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  prompt: {
    fontSize: 16,
    lineHeight: 24,
  },
  streak: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.one,
  },
});
