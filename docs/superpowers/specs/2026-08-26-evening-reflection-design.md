# Phase 1.2 — evening reflection

Close the night. A mirror, not a scolding. Speak what happened, confirm it against that morning, save. Nothing writes the book until they confirm.

## Done when

```text
You: set reflect from–to (default 19:00–22:00)
  + one hour grace after the end
during that window:
  center tab label = Reflect
  tap → short list of open days (today + last two, morning exists, no evening yet)
  pick a day → wizard
Tasks: recover icon next to ⋯ (only in window, only if that day is open)
  → bottom sheet wizard for that day
wizard: speak → hear → extract against that day’s tasks
  → Check the truth (statuses + Also happened)
  → POST /days/evening { dayId, … }
messy honest night still shows up
```

## HTTP

| Call | Writes book? |
|---|---|
| `POST /voice/hear` | no |
| `POST /voice/extract` `{ kind: "EVENING_REFLECTION", transcript, dayId }` | no — outcomes + wins |
| `POST /days/evening` `{ timezone, transcript, dayId, outcomes, wins, storageKey?, words? }` | **yes** |

`dayId` required for a past night. Leftover planned ids the model skips stay `MISSED` (already in `.NET`).

## Out of this slice

Push “How did today go?”, Review math, midday, coach.
