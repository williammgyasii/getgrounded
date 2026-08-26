import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { clipClock, currentWordIndex, type SpokenWord } from '@/lib/spoken-words';
import { useLazyGetClipQuery } from '@/store/api';

export type WordTake = {
  id: string;
  transcript: string;
  label?: string;
  playable?: boolean;
  words?: SpokenWord[];
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
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) {
      stopPlayer();
    }
    return () => {
      stopPlayer();
    };
  }, [open]);

  useEffect(() => {
    if (!playingId) {
      return;
    }
    const tick = setInterval(() => {
      const player = playerRef.current;
      if (!player) {
        return;
      }
      setCurrent(player.currentTime ?? 0);
      setDuration(player.duration ?? 0);
    }, 100);
    return () => clearInterval(tick);
  }, [playingId]);

  function stopPlayer() {
    const player = playerRef.current;
    if (player) {
      player.pause();
      player.remove();
    }
    playerRef.current = null;
    loadedIdRef.current = null;
    setPlayingId(null);
    setCurrent(0);
    setDuration(0);
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
          setPlayingId((now) => (now === id ? null : now));
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
            takes.map((take, index) => {
              const playing = playingId === take.id;
              const expanded = openIds[take.id] === true || playing;
              const spoken = take.words ?? [];
              const active = playing ? currentWordIndex(spoken, current) : -1;
              const long = take.transcript.length > 90 || spoken.length > 12;
              const shown = loadedIdRef.current === take.id ? current : 0;
              const total = loadedIdRef.current === take.id ? duration : 0;
              const ratio = total > 0 ? Math.min(1, shown / total) : 0;
              return (
                <View
                  key={take.id}
                  style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  {take.playable ? (
                    <View style={styles.transport}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={playing ? 'Pause' : 'Play'}
                        disabled={loadingId === take.id}
                        hitSlop={8}
                        onPress={() => void togglePlay(take.id)}
                        style={styles.play}>
                        <SymbolView
                          name={
                            playing
                              ? { ios: 'pause.fill', android: 'pause', web: 'pause' }
                              : { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
                          }
                          size={22}
                          tintColor={theme.accent}
                        />
                      </Pressable>
                      <View style={styles.meter}>
                        <View style={[styles.track, { backgroundColor: theme.border }]}>
                          <View
                            style={[
                              styles.fill,
                              { width: `${ratio * 100}%`, backgroundColor: theme.accent },
                            ]}
                          />
                        </View>
                        <ThemedText type="small" themeColor="textSecondary" style={styles.clock}>
                          {clipClock(shown)} / {clipClock(total)}
                        </ThemedText>
                      </View>
                    </View>
                  ) : null}
                  <ThemedText type="small" themeColor="textSecondary">
                    {take.label ?? `Take ${index + 1}`}
                  </ThemedText>
                  {spoken.length > 0 ? (
                    <ThemedText style={styles.words} numberOfLines={expanded ? undefined : 2}>
                      {spoken.map((word, wordIndex) => (
                        <ThemedText
                          key={`${take.id}-${wordIndex}`}
                          style={[
                            styles.words,
                            wordIndex === active ? { color: theme.accent, fontFamily: FontFamily.semibold } : null,
                          ]}>
                          {wordIndex === 0 ? word.text : ` ${word.text}`}
                        </ThemedText>
                      ))}
                    </ThemedText>
                  ) : (
                    <ThemedText style={styles.words} numberOfLines={expanded ? undefined : 2}>
                      {take.transcript}
                    </ThemedText>
                  )}
                  {long ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        setOpenIds((currentOpen) => ({
                          ...currentOpen,
                          [take.id]: !expanded,
                        }))
                      }
                      hitSlop={8}>
                      <ThemedText type="smallBold" style={{ color: theme.accent }}>
                        {expanded ? 'Show less' : 'Show full transcript'}
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </View>
              );
            })
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
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  play: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meter: {
    flex: 1,
    gap: 6,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
  clock: {
    fontFamily: FontFamily.medium,
  },
  words: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
  },
});
