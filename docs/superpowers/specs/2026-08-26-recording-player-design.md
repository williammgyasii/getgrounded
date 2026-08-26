# Recording player and sentence case

Play on Recordings should feel like a take, not a lone icon. New mornings keep Scribe word times so the current word can light up. Extracted task titles start with a capital.

## Done when

```text
new speak → hear returns words[]
  → morning save writes words on the session
  → Recordings: play bar + 0:12 / 1:04
  → playing word is accent
  → collapsed preview; Show full transcript expands
old take / typed take: bar if playable, no karaoke
Continue: "go to the gym" → "Go to the gym"
```

## Hear

`POST /voice/hear` already stores the file. Scribe already can return word times (`timestamps_granularity=word`). Parse `words` where `type` is `word` and keep `{ text, start, end }` seconds.

Response: `{ transcript, storageKey, words }`.

## Book

`voice_sessions.words JSONB NULL`. Morning body optional `words`. Load onto `ClipRecord.Words`. Do not invent times for old rows.

Phone holds `words` from hear (same as `storageKey`) and sends them on save.

## Phone

Playable card: play/pause, scrubber (display only), `m:ss / m:ss`.

Transcript: two lines. **Show full transcript** / **Show less**. While that take plays, expand so the highlight is visible.

Highlight only when `words` exist and that take is playing. Current word = last whose `start <= currentTime`.

## Sentence case

`Titles.Sentence`: first character upper, rest unchanged. Apply on extract and on morning save (day title + each task). Prompt asks for sentence case so the model starts closer.
