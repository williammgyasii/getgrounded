import AsyncStorage from '@react-native-async-storage/async-storage';

const BUBBLE_KEY = 'nevo.bubbleEnabled';
const LEAD_KEY = 'nevo.leadMinutes';
const OPT_IN_SEEN_KEY = 'nevo.optInSeen';
const BUBBLE_OVERLAY_HIDDEN_DATE_KEY = 'nevo.bubbleOverlayHiddenDate';

export const DEFAULT_LEAD_MINUTES = 15;
export const DEFAULT_BUBBLE_LEAD_MINUTES = 30;

export async function loadBubbleEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(BUBBLE_KEY);
  return raw === '1';
}

export async function saveBubbleEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BUBBLE_KEY, enabled ? '1' : '0');
}

export async function loadLeadMinutes(): Promise<number> {
  const raw = await AsyncStorage.getItem(LEAD_KEY);
  const value = raw ? Number.parseInt(raw, 10) : DEFAULT_LEAD_MINUTES;
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_LEAD_MINUTES;
}

export async function saveLeadMinutes(minutes: number): Promise<void> {
  await AsyncStorage.setItem(LEAD_KEY, String(Math.max(5, Math.min(120, minutes))));
}

export async function loadOptInSeen(): Promise<boolean> {
  return (await AsyncStorage.getItem(OPT_IN_SEEN_KEY)) === '1';
}

export async function markOptInSeen(): Promise<void> {
  await AsyncStorage.setItem(OPT_IN_SEEN_KEY, '1');
}

/** On-screen chip hidden for this plan day; heads-up notifications still run. */
export async function isBubbleOverlayDismissed(localDate: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(BUBBLE_OVERLAY_HIDDEN_DATE_KEY);
  return raw === localDate;
}

export async function dismissBubbleOverlayForDay(localDate: string): Promise<void> {
  await AsyncStorage.setItem(BUBBLE_OVERLAY_HIDDEN_DATE_KEY, localDate);
}

export async function clearBubbleOverlayDismissed(): Promise<void> {
  await AsyncStorage.removeItem(BUBBLE_OVERLAY_HIDDEN_DATE_KEY);
}
