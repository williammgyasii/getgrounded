import { type ReactNode } from 'react';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

type AuthMotionProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AuthHeroIn({ children, style }: AuthMotionProps) {
  return (
    <Animated.View entering={FadeIn.duration(700)} style={style}>
      {children}
    </Animated.View>
  );
}

export function AuthTitleIn({ children, style }: AuthMotionProps) {
  return (
    <Animated.View entering={FadeInDown.duration(500).delay(120)} style={style}>
      {children}
    </Animated.View>
  );
}

export function AuthActionsIn({ children, style }: AuthMotionProps) {
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(240)} style={[styles.stretch, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stretch: {
    width: '100%',
  },
});
