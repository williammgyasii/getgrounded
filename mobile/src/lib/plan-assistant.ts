import AsyncStorage from '@react-native-async-storage/async-storage';

const Key = 'plan-assistant-v1';

export type AssistantTone = 'warm' | 'coach' | 'witty';

export type PlanAssistant = {
  name: string;
  tone: AssistantTone;
  onboarded: boolean;
};

const Default: PlanAssistant = {
  name: 'Nevo',
  tone: 'coach',
  onboarded: false,
};

export async function loadPlanAssistant(): Promise<PlanAssistant> {
  const raw = await AsyncStorage.getItem(Key);
  if (!raw) {
    return { ...Default };
  }
  try {
    const parsed = JSON.parse(raw) as PlanAssistant;
    const rawName = parsed.name?.trim() || Default.name;
    const name = rawName === 'Muse' ? 'Nevo' : rawName;
    return {
      name,
      tone: parsed.tone ?? Default.tone,
      onboarded: parsed.onboarded === true,
    };
  } catch {
    return { ...Default };
  }
}

export async function savePlanAssistant(profile: PlanAssistant): Promise<void> {
  await AsyncStorage.setItem(Key, JSON.stringify(profile));
}

export function assistantGreeting(profile: PlanAssistant): string {
  const who = profile.name.trim() || 'Nevo';
  switch (profile.tone) {
    case 'coach':
      return `${who} is ready when you are.`;
    case 'witty':
      return `${who} is here to make today oddly achievable.`;
    default:
      return `${who} is here for today, not the whole year.`;
  }
}

export function nevoTapLine(profile: PlanAssistant): string {
  const who = profile.name.trim() || 'Nevo';
  const lines = [
    `${who} here. Tell me what today looks like.`,
    `${who} is listening whenever you are.`,
    `One day, one plan. ${who} has your back.`,
    `Say it out loud. ${who} will help you shape it.`,
  ];
  return lines[Math.floor(Math.random() * lines.length)] ?? lines[0];
}
