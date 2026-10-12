import { useEffect, useRef, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

import type { TalkTake } from '@/components/talk/talk-take-types';

function speechReady() {
  try {
    return ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch {
    return false;
  }
}

export function useSpeechTalkTake(): TalkTake {
  const [recording, setRecording] = useState(false);
  const [words, setWords] = useState('');
  const [metering, setMetering] = useState<number | undefined>();
  const [durationMillis, setDurationMillis] = useState(0);
  const startedAt = useRef<number | null>(null);
  const fileUri = useRef<string | null>(null);
  const waitEnd = useRef<((uri: string | null) => void) | null>(null);

  useSpeechRecognitionEvent('result', (event) => {
    const next = event.results[0]?.transcript?.trim() ?? '';
    if (next.length > 0) {
      setWords(next);
    }
  });

  useSpeechRecognitionEvent('audioend', (event) => {
    fileUri.current = event.uri ?? null;
    waitEnd.current?.(fileUri.current);
    waitEnd.current = null;
  });

  useSpeechRecognitionEvent('volumechange', (event) => {
    setMetering(((event.value + 2) / 12) * 50 - 50);
  });

  useSpeechRecognitionEvent('error', () => {
    setRecording(false);
    startedAt.current = null;
  });

  useEffect(() => {
    if (!recording) {
      return;
    }

    const tick = setInterval(() => {
      if (startedAt.current != null) {
        setDurationMillis(Date.now() - startedAt.current);
      }
    }, 200);
    return () => clearInterval(tick);
  }, [recording]);

  async function start() {
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error('mic');
    }

    fileUri.current = null;
    setWords('');
    setDurationMillis(0);
    startedAt.current = Date.now();
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: true,
      recordingOptions: {
        persist: true,
        outputFileName: 'plan.wav',
      },
      volumeChangeEventOptions: {
        enabled: true,
        intervalMillis: 80,
      },
    });
    setRecording(true);
  }

  function stop() {
    setRecording(false);
    startedAt.current = null;
    return new Promise<string | null>((resolve) => {
      waitEnd.current = resolve;
      ExpoSpeechRecognitionModule.stop();
      setTimeout(() => {
        if (waitEnd.current) {
          waitEnd.current = null;
          resolve(fileUri.current);
        }
      }, 2500);
    });
  }

  function discard() {
    setRecording(false);
    startedAt.current = null;
    setWords('');
    fileUri.current = null;
    ExpoSpeechRecognitionModule.abort();
  }

  return {
    available: speechReady(),
    recording,
    words,
    metering,
    durationMillis,
    start,
    stop,
    discard,
  };
}
