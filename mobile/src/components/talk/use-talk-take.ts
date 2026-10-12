import * as Device from 'expo-device';

import { useEmulatorTalkTake } from '@/components/talk/use-emulator-talk-take';
import { useSpeechTalkTake } from '@/components/talk/use-speech-talk-take';
import type { TalkTake } from '@/components/talk/talk-take-types';

/**
 * Physical device → on-device speech + persisted wav for /voice/hear.
 * Emulator/simulator → stub only; callers must use expo-audio (never loads speech native hooks).
 */
export function useTalkTake(): TalkTake {
  if (!Device.isDevice) {
    return useEmulatorTalkTake();
  }

  return useSpeechTalkTake();
}
