import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { AuthField } from '@/components/auth/auth-field';
import { AuthScreen } from '@/components/auth/auth-screen';
import { PillButton } from '@/components/auth/pill-button';
import { ThemedText } from '@/components/themed-text';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');

  return (
    <AuthScreen
      title="Reset password"
      subtitle="We’ll send a reset link to the email on your account."
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
      <PillButton
        label="Send reset link"
        onPress={() =>
          Alert.alert('UI only for now', 'Password reset wiring comes with Firebase.')
        }
      />
      <Pressable onPress={() => router.back()} style={styles.backLink}>
        <ThemedText type="smallBold">Back to log in</ThemedText>
      </Pressable>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  backLink: {
    alignItems: 'center',
    paddingTop: 8,
  },
});
