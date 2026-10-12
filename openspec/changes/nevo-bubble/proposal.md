## Why

After morning save, GetGrounded disappears into the launcher. Habit apps force rediscovery; Nevo should feel like an assistant that stays reachable and nudges you as blocks approach. Android-first: an opt-in floating bubble for one-tap return to the app, backed by local notifications so heads-up works even when the overlay is off or denied.

## What Changes

- **Nevo day snapshot:** After save (and on foreground refresh), persist a small JSON snapshot: next commitment, streak, deep link, notification schedule inputs.
- **Android bubble (opt-in):** Foreground service + overlay bubble showing Nevo + next task; tap opens app via deep link; dismiss / settings to turn off.
- **Local notifications:** Schedule from `plannedStartMinute` (e.g. 15 minutes before and at start); copy in assistant voice; tap opens same deep link.
- **Bubble visibility policy:** Default **windowed** — bubble is most prominent in the window before each planned block (configurable lead time), not necessarily 24/7 on screen.
- **Non-goals (this change):** iOS Live Activity, home-screen WidgetKit, iOS bubble, server push (FCM), notification actions (Done/Skip) unless trivial on Android.

## Capabilities

### New Capabilities

- `nevo-presence`: Day snapshot, Android bubble, local notification scheduling, deep links from outside the app.

### Modified Capabilities

- `book`: Morning save and desk refresh must emit/update the Nevo snapshot (mobile-side or documented contract; no new public API required for v1).

## Impact

- **Mobile:** New native Android module or config plugin; `expo-notifications`; shared storage for widget/bubble provider; settings entry under Plan or You.
- **Permissions:** `SYSTEM_ALERT_WINDOW` (overlay), notification permission, foreground service type (dataSync or specialUse with Play declaration).
- **Dev client:** Rebuild required after native changes; document in `mobile/README.md`.
- **iOS:** Notifications + deep link only in v1; parity bubble deferred.
