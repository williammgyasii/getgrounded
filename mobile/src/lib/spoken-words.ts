export type SpokenWord = {
  text: string;
  start: number;
  end: number;
};

export function clipClock(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const whole = Math.floor(safe);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

export function currentWordIndex(words: SpokenWord[], time: number): number {
  if (words.length === 0) {
    return -1;
  }

  let index = -1;
  for (let i = 0; i < words.length; i += 1) {
    if (words[i].start <= time) {
      index = i;
    } else {
      break;
    }
  }
  return index;
}
