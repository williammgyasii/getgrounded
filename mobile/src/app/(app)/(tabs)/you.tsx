import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { StyleSheet, View } from 'react-native';

import { useAuthUser } from '@/components/auth/auth-session';
import { HomeTopBar } from '@/components/home/home-top-bar';
import { PillButton } from '@/components/auth/pill-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getFirebaseAuth } from '@/lib/firebase';

function initialFrom(email: string | null | undefined): string {
  const local = email?.split('@')[0]?.trim();
  return local ? local[0].toUpperCase() : '';
}

export default function YouScreen() {
  const theme = useTheme();
  const user = useAuthUser();

  async function onSignOut() {
    await signOut(getFirebaseAuth());
    router.replace('/');
  }

  return (
    <ThemedView style={styles.screen}>
      <HomeTopBar
        title="You"
        subtitle="Account and streak live here."
        initial={initialFrom(user?.email)}
        onAvatarPress={onSignOut}
      />
      <View style={styles.content}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.inputBackground, borderColor: theme.border },
          ]}>
          <ThemedText type="smallBold">Signed in</ThemedText>
          <ThemedText themeColor="textSecondary">{user?.email ?? 'your account'}</ThemedText>
        </View>
        <PillButton label="Sign out" variant="secondary" onPress={onSignOut} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: Spacing.four,
    gap: Spacing.two,
  },
});
