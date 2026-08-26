import AsyncStorage from '@react-native-async-storage/async-storage';

const WordsKey = 'day-words';
const ChecksKey = 'day-checks';

export type SavedTake = {
  id: string;
  transcript: string;
  at: string;
};

type WordsStore = Record<string, SavedTake[]>;
type ChecksStore = Record<string, Record<string, string>>;

export async function rememberWords(dayKey: string, transcript: string): Promise<void> {
  const text = transcript.trim();
  if (!text) {
    return;
  }

  const all = await readWords();
  const current = all[dayKey] ?? [];
  all[dayKey] = [
    ...current,
    { id: `${Date.now()}`, transcript: text, at: new Date().toISOString() },
  ];
  await AsyncStorage.setItem(WordsKey, JSON.stringify(all));
}

export async function loadWords(dayKey: string): Promise<SavedTake[]> {
  const all = await readWords();
  return all[dayKey] ?? [];
}

export async function loadChecks(dayId: string): Promise<Record<string, string>> {
  const all = await readChecks();
  return all[dayId] ?? {};
}

export async function saveCheck(dayId: string, taskId: string, status: string): Promise<void> {
  const all = await readChecks();
  all[dayId] = { ...(all[dayId] ?? {}), [taskId]: status };
  await AsyncStorage.setItem(ChecksKey, JSON.stringify(all));
}

async function readWords(): Promise<WordsStore> {
  const raw = await AsyncStorage.getItem(WordsKey);
  return raw ? (JSON.parse(raw) as WordsStore) : {};
}

async function readChecks(): Promise<ChecksStore> {
  const raw = await AsyncStorage.getItem(ChecksKey);
  return raw ? (JSON.parse(raw) as ChecksStore) : {};
}
