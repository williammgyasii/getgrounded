import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiddayWizard } from '@/components/talk/midday-wizard';
import { useTheme } from '@/hooks/use-theme';
import { type DayRecord } from '@/lib/api';
import { Spacing } from '@/constants/theme';

export function MiddaySheet({
  day,
  onClose,
}: {
  day: DayRecord | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={day != null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" style={styles.dismiss} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.background,
              paddingBottom: Math.max(insets.bottom, Spacing.three) + Spacing.three,
            },
          ]}>
          {day ? (
            <MiddayWizard key={day.id} day={day} compact onDone={onClose} onClose={onClose} />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(36, 48, 86, 0.35)',
  },
  dismiss: {
    flex: 1,
  },
  sheet: {
    height: '88%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
});
