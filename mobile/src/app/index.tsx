import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthActionsIn, AuthTitleIn } from '@/components/auth/auth-motion';
import { PillButton } from '@/components/auth/pill-button';
import { SocialButton } from '@/components/auth/social-button';
import { GoogleMark } from '@/components/auth/social-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <ThemedView style={styles.screen}>
      <Image
        source={require('@/assets/images/auth/login-illustration.png')}
        style={styles.wash}
        contentFit="cover"
        contentPosition={{ top: '78%', left: '55%' }}
      />
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.six,
            paddingBottom: Math.max(insets.bottom, Spacing.four),
          },
        ]}>
        <AuthTitleIn>
          <ThemedText style={[styles.mark, { color: theme.accent }]}>GetGrounded</ThemedText>
          <ThemedText style={styles.title}>
            Stop tracking.{'\n'}Start talking.
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Plan the morning out loud. Reflect at night. We keep the bookkeeping.
          </ThemedText>
        </AuthTitleIn>

        <AuthActionsIn style={styles.actions}>
          <Link href="/sign-up" asChild>
            <PillButton label="Create account" />
          </Link>
          <Link href="/sign-in" asChild>
            <PillButton label="Log in" variant="secondary" />
          </Link>
          <SocialButton
            label="Continue with Google"
            icon={<GoogleMark />}
            onPress={() => Alert.alert('Google is next', 'Email is the first path.')}
          />
        </AuthActionsIn>

        <View style={styles.footer}>
          <Pressable onPress={() => Alert.alert('Privacy Policy', 'Coming with the legal pages.')}>
            <ThemedText themeColor="textSecondary" style={styles.legal}>
              Privacy
            </ThemedText>
          </Pressable>
          <ThemedText themeColor="textSecondary" style={styles.legal}>
            ·
          </ThemedText>
          <Pressable onPress={() => Alert.alert('Terms of Service', 'Coming with the legal pages.')}>
            <ThemedText themeColor="textSecondary" style={styles.legal}>
              Terms
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  wash: {
    ...StyleSheet.absoluteFill,
    opacity: 0.18,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
  },
  mark: {
    ...Typography.overline,
    marginBottom: Spacing.four,
  },
  title: {
    ...Typography.displayHero,
  },
  subtitle: {
    ...Typography.body,
    marginTop: Spacing.three,
    maxWidth: 320,
  },
  actions: {
    gap: Spacing.two,
    marginTop: 'auto',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.four,
  },
  legal: {
    ...Typography.caption,
  },
});
