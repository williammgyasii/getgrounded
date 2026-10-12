import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { AuthActionsIn, AuthTitleIn } from '@/components/auth/auth-motion';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AuthScreenProps = {
  title: string;
  subtitle: string;
  onBack?: () => void;
  children: ReactNode;
};

export function AuthScreen({ title, subtitle, onBack, children }: AuthScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + Spacing.three,
              paddingBottom: Math.max(insets.bottom, Spacing.four),
            },
          ]}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={12}
              onPress={onBack}
              style={styles.back}>
              <SymbolView
                name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
                size={20}
                tintColor={theme.text}
              />
            </Pressable>
          ) : (
            <View style={styles.back} />
          )}

          <AuthTitleIn>
            <ThemedText style={styles.title}>{title}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              {subtitle}
            </ThemedText>
          </AuthTitleIn>
          <AuthActionsIn style={styles.body}>{children}</AuthActionsIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    flexGrow: 1,
  },
  back: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    ...Typography.headline,
  },
  subtitle: {
    ...Typography.bodySmall,
    marginTop: Spacing.two,
  },
  body: {
    marginTop: Spacing.five,
    gap: Spacing.three,
    flexGrow: 1,
  },
});
