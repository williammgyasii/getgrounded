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
import { firebaseAuthMessage, signUpWithEmail, validateSignUp } from '@/lib/auth';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    const invalid = validateSignUp(email, password);
    if (invalid) {
      Alert.alert('Check the form', invalid);
      return;
    }

    setBusy(true);
    try {
      await signUpWithEmail(email, password);
      router.replace('/home' as Href);
    } catch (error) {
      const message =
        error instanceof FirebaseError
          ? firebaseAuthMessage(error.code)
          : error instanceof Error
            ? error.message
            : 'Could not create the account.';
      Alert.alert('Sign up failed', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Talk your day. We’ll keep the bookkeeping."
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
        placeholder="At least 8 characters"
        secureTextEntry
        textContentType="newPassword"
        autoComplete="password-new"
        value={password}
        onChangeText={setPassword}
      />
      <PillButton
        label={busy ? 'Creating account…' : 'Create account'}
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
          Already have an account?
        </ThemedText>
        <Link href="/sign-in" asChild>
          <Pressable>
            <ThemedText type="smallBold">Log in</ThemedText>
          </Pressable>
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 'auto',
    paddingTop: Spacing.four,
  },
});
