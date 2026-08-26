import { FirebaseError } from 'firebase/app';
import { type Href, Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AuthField } from '@/components/auth/auth-field';
import { AuthScreen } from '@/components/auth/auth-screen';
import { PillButton } from '@/components/auth/pill-button';
import { SocialButton } from '@/components/auth/social-button';
import { GoogleMark } from '@/components/auth/social-icons';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { firebaseAuthMessage, signInWithEmail, validateSignIn } from '@/lib/auth';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    const invalid = validateSignIn(email, password);
    if (invalid) {
      Alert.alert('Check the form', invalid);
      return;
    }

    setBusy(true);
    try {
      await signInWithEmail(email, password);
      router.replace('/talk' as Href);
    } catch (error) {
      const message =
        error instanceof FirebaseError
          ? firebaseAuthMessage(error.code)
          : error instanceof Error
            ? error.message
            : 'Could not log in.';
      Alert.alert('Log in failed', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Log in to pick up your morning plan."
      onBack={() => router.back()}>
      <AuthField
        label="Email"
        placeholder="you@email.com"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoCapitalize="none"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <AuthField
        label="Password"
        placeholder="Password"
        secureTextEntry
        textContentType="password"
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />
      <Link href="/forgot-password" asChild>
        <Pressable>
          <ThemedText type="smallBold" style={styles.forgot}>
            Forgot password?
          </ThemedText>
        </Pressable>
      </Link>
      <PillButton
        label={busy ? 'Logging in…' : 'Log in'}
        loading={busy}
        onPress={onSubmit}
      />
      <SocialButton
        label="Continue with Google"
        icon={<GoogleMark />}
        disabled={busy}
        onPress={() => Alert.alert('Google is next', 'Email is the first path.')}
      />
      <View style={styles.footer}>
        <ThemedText themeColor="textSecondary" type="small">
          Don’t have an account?
        </ThemedText>
        <Link href="/sign-up" asChild>
          <Pressable>
            <ThemedText type="smallBold">Sign up</ThemedText>
          </Pressable>
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  forgot: {
    alignSelf: 'flex-end',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 'auto',
    paddingTop: Spacing.four,
  },
});
