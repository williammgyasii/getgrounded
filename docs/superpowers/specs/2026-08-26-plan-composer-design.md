# Plan composer

Replace the hero mic on Plan your day. Same morning HTTP. Same steps. New layout.

Companion to `2026-08-26-phase1.1-morning-wizard-design.md`. That spec’s “center raised mic” is superseded here.

---

## Done when

```text
Plan your day
  ← goes to Today
  words fill the screen
  bottom row: type + small forest mic
  tap mic → talk → tap again → POST /voice/hear
  Continue → extract → Check the plan
    ← “Your words” returns to the composer
    Save → Today
```

No giant center mic. No new routes. No streaming STT. No new EAS build in this slice.

---

## Layout (record step)

```text
[ ← ]  Plan your day
Speak it. Then we book it.

┌─────────────────────────────┐
│  words (scrolls, editable)  │
└─────────────────────────────┘

┌────────────────────┐  (48pt mic)
│ type or talk…      │  [ ● ]
└────────────────────┘
note
Continue
```

- Forest `#2F4A3C` mic, ~48pt, pulse + thin halo while recording. Waves may sit under that row, not a 168pt stage.
- Mic is the record/stop control. It is not Continue.
- Words stay visible while recording. Placeholder: “Listening…” until Scribe returns, or live captions if the native module is already in the APK.
- Keyboard and tab bar: composer row sits above the tab bar; `paddingBottom` uses the safe area.

Check the plan and Thinking keep their current structure, plus the header back described below.

---

## Back (both)

| Where | Control | Goes |
|---|---|---|
| All Plan steps | Header chevron, same as auth (`chevron.left`) | Today (`/today`) |
| Check the plan | Existing “Edit your words” | Composer (`step = record`) |

Thinking has the header chevron only. No extra back link.

---

## Hear (unchanged)

- Mono 16 kHz AAC. Expo `File` multipart. `POST /voice/hear`.
- Empty speech → same 422 copy.
- Type-only still skips hear.

---

## Out of this slice

- `expo-speech-recognition` / new native build (live captions while talking).
- Streaming STT.
- Evening composer.
- Visual redesign of Check the plan beyond the header chevron.
