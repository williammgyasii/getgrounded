import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

export function GoogleMark() {
  return (
    <Image
      source={require('@/assets/images/auth/google-icon.png')}
      style={styles.google}
      contentFit="contain"
    />
  );
}

const styles = StyleSheet.create({
  google: {
    width: 23,
    height: 23,
  },
});
