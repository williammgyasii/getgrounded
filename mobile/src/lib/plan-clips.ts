import { type WordTake } from '@/components/talk/day-words';
import { type DayRecord } from '@/lib/api';
import { type SavedTake, loadWords } from '@/lib/day-notes';

export function clipsFromDay(day: DayRecord): WordTake[] {
  let morningIndex = 0;
  let middayIndex = 0;
  const fromApi = (day.clips ?? [])
    .filter((clip) => clip.transcript.trim().length > 0)
    .map((clip) => {
      const evening = clip.kind === 'EVENING_REFLECTION';
      const midday = clip.kind === 'MIDDAY_UPDATE';
      if (evening) {
        return {
          id: clip.id,
          transcript: clip.transcript,
          kind: clip.kind,
          label: 'Evening',
          playable: clip.playable === true,
          words: clip.words,
        };
      }
      if (midday) {
        middayIndex += 1;
        return {
          id: clip.id,
          transcript: clip.transcript,
          kind: clip.kind,
          label: `Midday ${middayIndex}`,
          playable: clip.playable === true,
          words: clip.words,
        };
      }
      morningIndex += 1;
      return {
        id: clip.id,
        transcript: clip.transcript,
        kind: clip.kind,
        label: morningIndex === 1 ? 'Morning plan' : `Morning ${morningIndex}`,
        playable: clip.playable === true,
        words: clip.words,
      };
    });

  return fromApi;
}

export async function transcriptsForDay(day: DayRecord): Promise<WordTake[]> {
  const clips = clipsFromDay(day);
  if (clips.length > 0) {
    return clips;
  }
  const saved = await loadWords(day.localDate);
  return saved.map((take: SavedTake, index) => ({
    id: take.id,
    transcript: take.transcript,
    label: index === 0 ? 'Morning plan' : `Take ${index + 1}`,
    playable: false,
  }));
}
