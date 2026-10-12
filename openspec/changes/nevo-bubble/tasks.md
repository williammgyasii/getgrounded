## 1. Snapshot and links (mobile JS)

- [x] 1.1 Define `NevoDaySnapshot` type and AsyncStorage key in `mobile/src/lib/nevo-presence.ts`
- [x] 1.2 Build snapshot from desk/today after `planMorning` save and on Plan tab foreground
- [x] 1.3 Add deep link routes/handlers for `getgroundedapp://plan` (and optional task id)
- [x] 1.4 Unit tests: next-task selection, snapshot merge, date rollover

## 2. Local notifications

- [x] 2.1 Add `expo-notifications` and permission prompt flow (non-blocking)
- [x] 2.2 Implement `scheduleNevoHeadsUps(snapshot)` with cancel-and-replace semantics
- [x] 2.3 Wire save + refresh to scheduler; test with fake clock if available

## 3. Android bubble (native)

- [x] 3.1 Expo config plugin or small Kotlin module: overlay + foreground service
- [x] 3.2 RN bridge: start/stop/update from snapshot JSON
- [x] 3.3 Windowed visibility tied to next start minute (shared logic with 2.2)
- [x] 3.4 Opt-in sheet after save + Settings toggle

## 4. Polish and docs

- [x] 4.1 Settings: bubble on/off, lead minutes (15 default)
- [x] 4.2 `mobile/README.md`: rebuild dev client, overlay permission steps
- [x] 4.3 Manual test script: save → notification fires → bubble tap → app opens

## 5. Out of scope (track separately)

- [ ] iOS home widget / Live Activity
- [ ] Notification action buttons (Done/Skip)
- [ ] Server push (FCM)
