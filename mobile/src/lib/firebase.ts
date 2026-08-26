import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import { Platform } from 'react-native';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing. Add it to mobile/.env`);
  }

  return value;
}

export function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    apiKey: required('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: required('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: required('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  });
}

function alreadyInitialized(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'auth/already-initialized'
  );
}

function createNativeAuth(app: FirebaseApp): Auth {
  // RN helper lives on the React Native Auth bundle; TS types are the browser ones.
  const { getReactNativePersistence } = require('@firebase/auth') as {
    getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
  };

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (alreadyInitialized(error)) {
      return getAuth(app);
    }

    throw error;
  }
}

export function getFirebaseAuth(): Auth {
  const app = getFirebaseApp();
  if (Platform.OS === 'web') {
    return getAuth(app);
  }

  return createNativeAuth(app);
}
