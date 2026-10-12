import type { TalkTake } from '@/components/talk/talk-take-types';

/** No native speech on emulators — MorningWizard uses expo-audio instead. */
export function useEmulatorTalkTake(): TalkTake {
  return {
    available: false,
    recording: false,
    words: '',
    metering: undefined,
    durationMillis: 0,
    async start() {
      throw new Error('mic');
    },
    async stop() {
      return null;
    },
    discard() {},
  };
}
