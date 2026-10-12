import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { PlanGradientBackdrop } from '@/components/talk/plan-gradient-backdrop';

export const PlanTabBarInset = 96;

export function PlanScreenShell({
  children,
  active,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <View style={styles.shell}>
      <PlanGradientBackdrop active={active ?? false} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
});
