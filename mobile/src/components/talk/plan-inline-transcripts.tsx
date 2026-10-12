import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';

import { type WordTake } from '@/components/talk/day-words';
import { ThemedText } from '@/components/themed-text';
import { PlanBlue } from '@/constants/plan-theme';
import { PlanSheet } from '@/constants/plan-sheet';
import { PlanSurface } from '@/constants/plan-surface';
import { Spacing, Typography } from '@/constants/theme';
import { useLazyGetClipQuery } from '@/store/api';

export function PlanInlineTranscripts({ takes, light }: { takes: WordTake[]; light?: boolean }) {
  if (takes.length === 0) {
    return (
      <ThemedText style={styles.empty}>No recordings yet — your morning plan will show up here.</ThemedText>
    );
  }

  return (
    <View style={styles.list}>
      {takes.map((take) => (
        <TranscriptRow key={take.id} take={take} light={light} />
      ))}
    </View>
  );
}

function TranscriptRow({ take, light }: { take: WordTake; light?: boolean }) {
  const ink = light ? PlanSheet.ink : PlanSurface.text;
  const muted = light ? PlanSheet.inkMuted : PlanSurface.textMuted;
  const line = light ? PlanBlue.soft : PlanSurface.sheetLine;
  const playBg = light ? PlanBlue.soft : PlanSurface.accentSoft;
  const accent = light ? PlanBlue.primary : PlanSurface.accent;
  const [fetchClip] = useLazyGetClipQuery();
  const playerRef = useRef<AudioPlayer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);

  useEffect(() => () => {
    playerRef.current?.pause();
    playerRef.current?.remove();
  }, []);

  async function togglePlay() {
    if (!take.playable) {
      return;
    }
    if (playing && playerRef.current) {
      playerRef.current.pause();
      setPlaying(false);
      return;
    }
    setLoading(true);
    setPlayError(null);
    try {
      if (!playerRef.current) {
        const file = new File(Paths.cache, `clip-${take.id}.m4a`);
        if (file.exists) {
          file.delete();
        }
        const bytes = await fetchClip(take.id).unwrap();
        if (!bytes || bytes.byteLength < 64) {
          throw new Error('empty');
        }
        file.create();
        file.write(new Uint8Array(bytes));
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
        const player = createAudioPlayer({ uri: file.uri });
        player.addListener('playbackStatusUpdate', (status) => {
          if (status.didJustFinish) {
            setPlaying(false);
          }
        });
        playerRef.current = player;
      }
      playerRef.current.play();
      setPlaying(true);
    } catch {
      playerRef.current?.pause();
      playerRef.current?.remove();
      playerRef.current = null;
      setPlaying(false);
      setPlayError('Could not play this recording.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.row, { borderBottomColor: line }]}>
      {take.playable ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause' : 'Play'}
          onPress={() => void togglePlay()}
          style={[styles.play, { backgroundColor: playBg }]}>
          {loading ? (
            <ActivityIndicator size="small" color={accent} />
          ) : (
            <SymbolView
              name={
                playing
                  ? { ios: 'pause.fill', android: 'pause', web: 'pause' }
                  : { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
              }
              size={18}
              tintColor={accent}
            />
          )}
        </Pressable>
      ) : (
        <View style={styles.playPlaceholder} />
      )}
      <View style={styles.copy}>
        <ThemedText style={[styles.label, { color: muted }]}>{take.label ?? 'Recording'}</ThemedText>
        <ThemedText style={[styles.transcript, { color: ink }]} numberOfLines={3}>
          {take.transcript}
        </ThemedText>
        {playError ? (
          <ThemedText style={[styles.playError, { color: '#C23B3B' }]}>{playError}</ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 0,
  },
  empty: {
    ...Typography.bodySmall,
    color: PlanSheet.inkMuted,
    paddingVertical: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  play: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPlaceholder: {
    width: 36,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  label: {
    ...Typography.caption,
  },
  transcript: {
    ...Typography.bodySmall,
    lineHeight: 20,
  },
  playError: {
    ...Typography.caption,
    marginTop: 2,
  },
});
