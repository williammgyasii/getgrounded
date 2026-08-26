import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
} from 'firebase/auth';

import { identifyMe } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';

export function validateEmail(email: string): string | null {
  if (!email.includes('@') || email.trim().length < 5) {
    return 'Enter a valid email.';
  }

  return null;
}

export function validateSignUp(email: string, password: string): string | null {
  return validateEmail(email) ?? (password.length < 8 ? 'Password must be at least 8 characters.' : null);
}

export function validateSignIn(email: string, password: string): string | null {
  return validateEmail(email) ?? (password.length === 0 ? 'Enter your password.' : null);
}

export function firebaseAuthMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email already has an account.';
    case 'auth/invalid-email':
      return 'Enter a valid email.';
    case 'auth/weak-password':
      return 'Password must be at least 8 characters.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Could not continue. Try again.';
  }
}

async function syncProfile(user: User) {
  const token = await user.getIdToken();
  try {
    await identifyMe(token);
  } catch {
    // Firebase already authenticated. Home should not wait on /me.
  }
}

export async function signUpWithEmail(email: string, password: string) {
  const invalid = validateSignUp(email, password);
  if (invalid) {
    throw new Error(invalid);
  }

  const credential = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );
  await syncProfile(credential.user);
  return credential.user;
}

export async function signInWithEmail(email: string, password: string) {
  const invalid = validateSignIn(email, password);
  if (invalid) {
    throw new Error(invalid);
  }

  const credential = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );
  await syncProfile(credential.user);
  return credential.user;
}
