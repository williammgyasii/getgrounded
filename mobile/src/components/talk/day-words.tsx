import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type WordTake = {
  id: string;
  transcript: string;
  label?: string;
};

export function DayWords({
  open,
  takes,
  onClose,
}: {
  open: boolean;
  takes: WordTake[];
  onClose: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.page, { backgroundColor: theme.background, paddingTop: insets.top + Spacing.three }]}>
        <View style={styles.top}>
          <ThemedText style={styles.title}>Your transcript</ThemedText>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={12}>
            <SymbolView
              name={{ ios: 'xmark', android: 'close', web: 'close' }}
              size={20}
              tintColor={theme.text}
            />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          {takes.length === 0 ? (
            <ThemedText themeColor="textSecondary">
              No words saved for this day on this phone yet.
            </ThemedText>
          ) : (
            takes.map((take, index) => (
              <View
                key={take.id}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <ThemedText type="small" themeColor="textSecondary">
                  {take.label ?? `Take ${index + 1}`}
                </ThemedText>
                <ThemedText style={styles.words}>{take.transcript}</ThemedText>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.three,
  },
  title: {
    fontFamily: FontFamily.semibold,
    fontSize: 22,
    lineHeight: 28,
  },
  body: {
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  words: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
  },
});
