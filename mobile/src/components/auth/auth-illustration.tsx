import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

type AuthIllustrationProps = {
  height?: number;
};

export function AuthIllustration({ height = 360 }: AuthIllustrationProps) {
  return (
    <View style={[styles.wrap, { height }]}>
      <Image
        source={require('@/assets/images/auth/login-illustration.png')}
        style={styles.image}
        contentFit="cover"
        contentPosition={{ top: '72%', left: '55%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
