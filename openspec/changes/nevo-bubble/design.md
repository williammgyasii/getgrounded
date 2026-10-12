## Context

Plan tab completes save → user lives the day in another app. Nevo presence closes the "find the icon again" gap. Platforms differ: Android allows overlay bubbles with user consent; iOS has no equivalent floating assistant.

## Goals

- One tap from bubble → Plan / today with context.
- Time-aware nudge before commitments (notifications as source of truth for timing).
- Opt-in, obvious off switch, quiet after evening or user quiet hours (v1: end of calendar day or manual off).

## Non-goals

- Floating bubble on iOS.
- Always-on bubble with no sleep (default is windowed visibility).
- Server-driven push campaigns.

## Architecture

```text
Save day / refresh desk
        │
        ▼
  NevoDaySnapshot (AsyncStorage + Android SharedPreferences)
        │
        ├──► NotificationScheduler (expo-notifications, local)
        │
        └──► BubbleService (Android native, reads snapshot)
                 tap → Linking.openURL(getgroundedapp://plan?…)
```

### NevoDaySnapshot (stable shape)

| Field | Purpose |
|--------|---------|
| `localDate` | Which day this snapshot belongs to |
| `nextTaskTitle` | Next PLANNED commitment by start minute |
| `nextTaskStartMinute` | For UI and notification identity |
| `nextTaskId` | Deep link target |
| `streakDays` | Bubble badge optional |
| `bubbleEnabled` | User preference |
| `updatedAt` | Stale detection |

### Android bubble

- **Module volatility:** Native Kotlin service + overlay view; RN bridge: `startBubble`, `stopBubble`, `updateSnapshot`.
- **Foreground service:** Required while bubble visible; notification channel "Nevo" with low intrusion when idle.
- **Windowed mode:** JS or native timer compares `now` to next start; show/expand bubble within `leadMinutes` (default 30); shrink or hide between blocks.
- **Permission flow:** After first successful save, sheet: "Keep Nevo nearby?" → Settings intent for overlay if not granted → fallback copy explaining notifications still work.

### Notifications

- On snapshot write: cancel prior day’s scheduled ids; schedule for each future commitment (lead + optional at-start).
- Idempotent keys: `{localDate}-{commitmentId}-lead`.
- Respect OS notification permission; degrade gracefully.

### Deep links

- `getgroundedapp://plan` — Plan tab, live day
- `getgroundedapp://plan/task/{id}` — scroll/highlight task (best effort)

## Risks

| Risk | Mitigation |
|------|------------|
| Overlay permission denied | Notifications + in-app CTA to enable later |
| Play rejection | Opt-in only, clear FGS justification, no ads in overlay |
| Battery | Windowed bubble; stop service when day closed or user disables |
| Stale snapshot | Refresh on app foreground + after save |

## Phased delivery

1. Snapshot + local notifications + deep links (no native bubble) — proves scheduling.
2. Android bubble reading same snapshot — proves tap-through.
3. Windowed visibility polish + settings UI.
4. Home widget (reuse snapshot) — optional follow-up change.

## Open questions

- Evening close: auto-stop bubble at first evening save vs fixed local hour (default: 9 PM local until evening flow exists).
