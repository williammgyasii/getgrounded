import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useAuthUser } from '@/components/auth/auth-session';
import { HomeTopBar } from '@/components/home/home-top-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function initialFrom(email: string | null | undefined): string {
  const local = email?.split('@')[0]?.trim();
  return local ? local[0].toUpperCase() : '';
}

export default function ReviewScreen() {
  const theme = useTheme();
  const user = useAuthUser();

  return (
    <ThemedView style={styles.screen}>
      <HomeTopBar
        title="Review"
        subtitle="Follow-through, once you have a week."
        initial={initialFrom(user?.email)}
        onAvatarPress={() => router.push('/you')}
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
          <ThemedText type="smallBold">This week</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.copy}>
            A week appears after you show up.
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
  copy: {
    fontSize: 16,
    lineHeight: 24,
  },
});
