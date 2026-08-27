# Phase 1.4 — midday update

Live the day by voice. Append new tasks, patch named ones, record extras. Morning stays. Night stays open. Confirm, then book.

## Done when

```text
Plan: today has a morning and no evening → midday wizard
Day ⋯ Update the day → same wizard
speak → hear → extract MIDDAY_UPDATE → Check the update
  → POST /days/midday { dayId, add, outcomes, extras }
new clip kind MIDDAY_UPDATE
closed night → 409
Add another take no longer posts /days/morning
```

## HTTP

| Call | Writes book? |
|---|---|
| `POST /voice/hear` | no |
| `POST /voice/extract` `{ kind: "MIDDAY_UPDATE", transcript, dayId }` | no — `{ add, outcomes, extras }` |
| `POST /days/midday` `{ timezone, transcript, dayId, add, outcomes, extras, storageKey?, words? }` | **yes** |

Unnamed planned tasks stay as they are.

## Out of this slice

Coach / live agent, push, Home midday cue, calendar week.
