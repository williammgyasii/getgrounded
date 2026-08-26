import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useAuthUser } from '@/components/auth/auth-session';
import { HomeTopBar } from '@/components/home/home-top-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deviceTimezone } from '@/lib/api';
import { useGetHistoryQuery } from '@/store/api';

function initialFrom(email: string | null | undefined): string {
  const local = email?.split('@')[0]?.trim();
  return local ? local[0].toUpperCase() : '';
}

export default function HistoryScreen() {
  const theme = useTheme();
  const user = useAuthUser();
  const signedIn = user != null;
  const { data: days = [], refetch } = useGetHistoryQuery(deviceTimezone(), { skip: !signedIn });

  useFocusEffect(
    useCallback(() => {
      if (signedIn) {
        void refetch();
      }
    }, [signedIn, refetch]),
  );

  return (
    <ThemedView style={styles.screen}>
      <HomeTopBar
        title="Work"
        subtitle="What you said vs what you did."
        initial={initialFrom(user?.email)}
        onAvatarPress={() => router.push('/you')}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {days.length === 0 ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
              },
            ]}>
            <ThemedText type="smallBold">Ledger</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.copy}>
              No days spoken yet.
            </ThemedText>
          </View>
        ) : (
          days.map((day) => (
            <View
              key={day.id}
              style={[
                styles.card,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                },
              ]}>
              <ThemedText type="smallBold">{day.title ?? day.localDate}</ThemedText>
              {day.commitments.map((item) => (
                <ThemedText key={item.id} themeColor="textSecondary" style={styles.copy}>
                  {item.title} · {item.status.toLowerCase()}
                </ThemedText>
              ))}
              {day.wins.map((item) => (
                <ThemedText key={item.id} themeColor="textSecondary" style={styles.copy}>
                  win · {item.title}
                </ThemedText>
              ))}
            </View>
          ))
        )}
      </ScrollView>
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
    paddingBottom: Spacing.four,
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
