import { Linking, Platform } from 'react-native';

import NevoBubble from 'nevo-bubble';

import { clockLabelCompact } from '@/lib/clock';
import { nevoPlanDeepLink, type NevoDaySnapshot, shouldShowBubbleWindow } from '@/lib/nevo-presence';
import { isBubbleOverlayDismissed } from '@/lib/nevo-settings';

function nativeModule() {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    return NevoBubble;
  } catch {
    return null;
  }
}

export async function canDrawOverlays(): Promise<boolean> {
  const mod = nativeModule();
  if (!mod) {
    return false;
  }

  return mod.canDrawOverlays();
}

export async function openOverlaySettings(): Promise<void> {
  const mod = nativeModule();
  if (mod) {
    await mod.openOverlaySettings();
    return;
  }

  await Linking.openSettings();
}

function bubbleConfig(snapshot: NevoDaySnapshot) {
  const title = snapshot.nextTaskTitle?.trim();
  const time =
    snapshot.nextTaskStartMinute != null
      ? clockLabelCompact(snapshot.nextTaskStartMinute)
      : null;

  return {
    label: title ?? 'Open your plan',
    hint: title ? (time ? `Next · ${time}` : 'Next up') : 'Tap for today’s tasks',
    deepLink: nevoPlanDeepLink(snapshot.nextTaskId),
    streakDays: snapshot.streakDays,
    layoutRevision: 2,
  };
}

export async function syncNevoBubble(snapshot: NevoDaySnapshot): Promise<void> {
  const mod = nativeModule();
  if (!mod) {
    return;
  }

  const show = shouldShowBubbleWindow(snapshot);
  if (!show) {
    await mod.stop();
    return;
  }

  const allowed = await mod.canDrawOverlays();
  if (!allowed) {
    return;
  }

  if (await isBubbleOverlayDismissed(snapshot.localDate)) {
    await mod.stop();
    return;
  }

  await mod.update(bubbleConfig(snapshot));
}

export async function hideNevoBubbleOverlay(): Promise<void> {
  await stopNevoBubble();
}

export async function stopNevoBubble(): Promise<void> {
  const mod = nativeModule();
  if (!mod) {
    return;
  }

  await mod.stop();
}
