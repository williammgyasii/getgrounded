import { SymbolView } from 'expo-symbols';
import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AuthChromeProps = {
  title: string;
  subtitle: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthChrome({ title, subtitle, onBack, children, footer }: AuthChromeProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.screen}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: Math.max(insets.bottom, Spacing.three),
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
              size={22}
              weight="medium"
              tintColor={theme.text}
            />
          </Pressable>
        ) : null}

        <View style={styles.header}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        </View>

        <KeyboardAvoidingView
          style={styles.body}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bodyContent}>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  header: {
    gap: Spacing.two,
    marginBottom: Spacing.five,
  },
  title: {
    ...Typography.headline,
  },
  subtitle: {
    ...Typography.bodySmall,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  footer: {
    paddingTop: Spacing.three,
  },
});
