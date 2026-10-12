# nevo-presence (delta)

Assistant presence outside the main app: snapshot of today's plan, Android opt-in bubble, and local notification heads-ups.

## ADDED Requirements

### Requirement: Day snapshot after plan is saved

When the user successfully saves a morning plan for today, the system SHALL write a Nevo day snapshot containing the next planned commitment (by start minute), streak count, local date, and deep link targets.

#### Scenario: Save produces snapshot

- **WHEN** morning save completes for today's local date
- **THEN** a snapshot exists with the earliest PLANNED commitment that has a title and optional start time

#### Scenario: No tasks

- **WHEN** save completes with zero commitments
- **THEN** snapshot indicates no next task and notifications for that day are cleared

### Requirement: Local notification heads-up

The system SHALL schedule local notifications from planned start times so the user receives a heads-up before commitments without opening the app.

#### Scenario: Lead notification

- **WHEN** a commitment has a planned start minute today in the future
- **THEN** a notification is scheduled for a configurable lead interval (default 15 minutes) before that time

#### Scenario: Reschedule on update

- **WHEN** the snapshot is updated after save or desk refresh
- **THEN** previously scheduled notifications for that local date are replaced so duplicates do not fire

#### Scenario: Permission denied

- **WHEN** notification permission is not granted
- **THEN** save still succeeds and the app MAY prompt once to enable notifications without blocking the plan flow

### Requirement: Android Nevo bubble opt-in

On Android, the user MAY enable an opt-in floating bubble that displays Nevo and the next task and opens the app when tapped.

#### Scenario: Opt-in after save

- **WHEN** the user accepts "Keep Nevo nearby" after save
- **THEN** the app requests overlay permission if needed and starts the bubble service when granted

#### Scenario: Tap bubble

- **WHEN** the user taps the bubble
- **THEN** the app opens to the Plan tab for today's live day

#### Scenario: User disables bubble

- **WHEN** the user turns off Nevo bubble in settings or dismisses with "off for today"
- **THEN** the overlay service stops and does not restart until the user opts in again

### Requirement: Windowed bubble visibility

When windowed mode is enabled (default), the bubble SHALL become visible or prominent within a lead window before the next planned commitment and MAY hide or minimize between commitments.

#### Scenario: Before next block

- **WHEN** current time is within the lead window of the next planned start
- **THEN** the bubble is shown with next task title and time

#### Scenario: Between blocks

- **WHEN** current time is outside all lead windows and no commitment is active
- **THEN** the bubble is hidden or minimized according to product settings

### Requirement: Deep link from external entry

Notifications and the bubble SHALL open the app via the app scheme to the Plan experience for the current day.

#### Scenario: Notification tap

- **WHEN** the user taps a Nevo heads-up notification
- **THEN** the app launches to the Plan tab with today's desk loaded
