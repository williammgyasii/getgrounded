import { type Href, router, useSegments } from 'expo-router';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { getFirebaseAuth } from '@/lib/firebase';

const HOME = '/home' as Href;
const WELCOME = '/' as Href;
const APP_ROUTES = new Set(['home', 'you', 'talk']);

function isAppRoute(segments: string[]): boolean {
  const route = segments.find((segment) => !segment.startsWith('('));
  return route != null && APP_ROUTES.has(route);
}

export function useAuthUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), setUser);
  }, []);

  return user;
}

export function AuthSessionRedirect() {
  const user = useAuthUser();
  const segments = useSegments();
  const inApp = isAppRoute(segments);

  useEffect(() => {
    if (user === undefined) {
      return;
    }

    if (user && !inApp) {
      router.replace(HOME);
      return;
    }

    if (!user && inApp) {
      router.replace(WELCOME);
    }
  }, [user, inApp]);

  return null;
}
