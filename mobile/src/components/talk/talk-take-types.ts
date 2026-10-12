export type TalkTake = {
  available: boolean;
  recording: boolean;
  words: string;
  metering: number | undefined;
  durationMillis: number;
  start: () => Promise<void>;
  stop: () => Promise<string | null>;
  discard: () => void;
};
