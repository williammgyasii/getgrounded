import { useEffect, useState } from 'react';
import { NativeModules } from 'react-native';

type SpeechStart = {
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (options: {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
  }) => Promise<void> | void;
  stop: () => Promise<void> | void;
  addListener?: (
    event: string,
    listener: (event: { results?: { transcript?: string }[] }) => void,
  ) => { remove: () => void };
};

function speechNative(): SpeechStart | null {
  const native = NativeModules.ExpoSpeechRecognitionModule as SpeechStart | undefined;
  return native ?? null;
}

export function useLiveWords(active: boolean) {
  const [words, setWords] = useState('');
  const available = speechNative() != null;

  useEffect(() => {
    if (!active) {
      return;
    }

    const speech = speechNative();
    if (speech == null) {
      return;
    }

    let stopped = false;
    const sub = speech.addListener?.('result', (event) => {
      const next = (event.results ?? [])
        .map((item) => item.transcript ?? '')
        .join(' ')
        .trim();
      if (next.length > 0) {
        setWords(next);
      }
    });

    void (async () => {
      const permission = await speech.requestPermissionsAsync();
      if (!permission.granted || stopped) {
        return;
      }

      await speech.start({
        lang: 'en-US',
        interimResults: true,
        continuous: true,
      });
    })();

    return () => {
      stopped = true;
      sub?.remove();
      void speech.stop();
    };
  }, [active]);

  return { words, setWords, liveAvailable: available };
}
