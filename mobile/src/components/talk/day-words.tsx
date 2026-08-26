import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLazyGetClipQuery } from '@/store/api';

export type WordTake = {
  id: string;
  transcript: string;
  label?: string;
  playable?: boolean;
};

export function DayWords({
  open,
  takes,
  onClose,
}: {
  open: boolean;
  takes: WordTake[];
  onClose: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [fetchClip] = useLazyGetClipQuery();
  const playerRef = useRef<AudioPlayer | null>(null);
  const loadedIdRef = useRef<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      stopPlayer();
    }
    return () => {
      stopPlayer();
    };
  }, [open]);

  function stopPlayer() {
    const player = playerRef.current;
    if (player) {
      player.pause();
      player.remove();
    }
    playerRef.current = null;
    loadedIdRef.current = null;
    setPlayingId(null);
  }

  async function togglePlay(id: string) {
    if (loadingId) {
      return;
    }
    if (playingId === id && playerRef.current) {
      playerRef.current.pause();
      setPlayingId(null);
      return;
    }
    if (playerRef.current && loadedIdRef.current === id) {
      playerRef.current.play();
      setPlayingId(id);
      return;
    }

    stopPlayer();
    setLoadingId(id);
    try {
      const file = new File(Paths.cache, `clip-${id}.m4a`);
      if (!file.exists) {
        const bytes = await fetchClip(id).unwrap();
        file.create();
        file.write(new Uint8Array(bytes));
      }
      await setAudioModeAsync({ playsInSilentMode: true });
      const player = createAudioPlayer({ uri: file.uri });
      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          setPlayingId((current) => (current === id ? null : current));
        }
      });
      player.play();
      playerRef.current = player;
      loadedIdRef.current = id;
      setPlayingId(id);
    } catch {
      stopPlayer();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.page, { backgroundColor: theme.background, paddingTop: insets.top + Spacing.three }]}>
        <View style={styles.top}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
            onPress={onClose}
            style={styles.iconBtn}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
              size={20}
              tintColor={theme.text}
            />
          </Pressable>
          <ThemedText style={styles.title}>Recordings</ThemedText>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          {takes.length === 0 ? (
            <ThemedText themeColor="textSecondary">No recordings on this day yet.</ThemedText>
          ) : (
            takes.map((take, index) => (
              <View
                key={take.id}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {take.playable ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={playingId === take.id ? 'Pause' : 'Play'}
                    disabled={loadingId === take.id}
                    hitSlop={8}
                    onPress={() => void togglePlay(take.id)}
                    style={styles.play}>
                    <SymbolView
                      name={
                        playingId === take.id
                          ? { ios: 'pause.fill', android: 'pause', web: 'pause' }
                          : { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
                      }
                      size={22}
                      tintColor={theme.accent}
                    />
                  </Pressable>
                ) : null}
                <ThemedText type="small" themeColor="textSecondary">
                  {take.label ?? `Take ${index + 1}`}
                </ThemedText>
                <ThemedText style={styles.words}>{take.transcript}</ThemedText>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Spacing.three,
    gap: Spacing.one,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FontFamily.semibold,
    fontSize: 22,
    lineHeight: 28,
    flex: 1,
  },
  body: {
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  play: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  words: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
  },
});
