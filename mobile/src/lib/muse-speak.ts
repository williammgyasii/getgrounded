import { useEffect, useState } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import * as Speech from 'expo-speech';

import { apiUrl } from '@/store/api';
import { getFirebaseAuth } from '@/lib/firebase';

let speaking = false;
let player: AudioPlayer | null = null;
let nevoFileCounter = 0;
const listeners = new Set<(active: boolean) => void>();

function setSpeaking(active: boolean) {
  speaking = active;
  listeners.forEach((notify) => notify(active));
}

export function useNevoSpeaking() {
  const [active, setActive] = useState(speaking);
  useEffect(() => {
    listeners.add(setActive);
    return () => {
      listeners.delete(setActive);
    };
  }, []);
  return active;
}

export function stopMuseSpeech() {
  stopNevoSpeech();
}

export function stopNevoSpeech() {
  Speech.stop();
  if (player) {
    try {
      player.pause();
      player.remove();
    } catch {
      // Player may already be disposed.
    }
    player = null;
  }
  setSpeaking(false);
}

/** Nevo speaks via ElevenLabs when configured; falls back to on-device TTS. */
export async function speakNevo(text: string) {
  await speakMuse(text);
}

export async function speakMuse(text: string) {
  const line = text.trim();
  if (!line) {
    return;
  }

  stopNevoSpeech();
  setSpeaking(true);

  const premium = await tryPremiumVoice(line);
  if (premium) {
    return;
  }

  setSpeaking(true);
  Speech.speak(line, {
    language: 'en-US',
    pitch: 1.02,
    rate: 0.92,
    onDone: () => setSpeaking(false),
    onStopped: () => setSpeaking(false),
  });
}

export function museIsSpeaking() {
  return speaking;
}

async function tryPremiumVoice(line: string): Promise<boolean> {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) {
      setSpeaking(false);
      return false;
    }

    const token = await user.getIdToken();
    const response = await fetch(`${apiUrl}/voice/speak`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: line }),
    });

    if (response.status === 503 || !response.ok) {
      setSpeaking(false);
      return false;
    }

    const bytes = await response.arrayBuffer();
    if (bytes.byteLength === 0) {
      setSpeaking(false);
      return false;
    }

    nevoFileCounter += 1;
    const file = new File(Paths.cache, `nevo-${nevoFileCounter}.mp3`);
    if (file.exists) {
      file.delete();
    }
    file.create();
    file.write(new Uint8Array(bytes));

    await setAudioModeAsync({ playsInSilentMode: true });
    player = createAudioPlayer({ uri: file.uri });
    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        setSpeaking(false);
      }
    });
    player.play();
    return true;
  } catch {
    setSpeaking(false);
    return false;
  }
}
