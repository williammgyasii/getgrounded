import { StyleSheet } from 'react-native';

import { MorningWizard } from '@/components/talk/morning-wizard';
import { ThemedView } from '@/components/themed-view';

export default function TalkScreen() {
  return (
    <ThemedView style={styles.screen}>
      <MorningWizard />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
