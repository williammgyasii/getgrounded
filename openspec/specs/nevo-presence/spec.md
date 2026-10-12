# nevo-presence

Assistant presence outside the main app: day snapshot, Android opt-in bubble, local notification heads-ups, deep links.

## Requirements

### Requirement: Day snapshot after plan is saved

When the user successfully saves a morning plan for today, the system SHALL write a Nevo day snapshot containing the next planned commitment (by start minute), streak count, local date, and deep link targets.

### Requirement: Local notification heads-up

The system SHALL schedule local notifications from planned start times so the user receives a heads-up before commitments without opening the app.

### Requirement: Android Nevo bubble opt-in

On Android, the user MAY enable an opt-in floating bubble that displays Nevo and the next task and opens the app when tapped.

### Requirement: Windowed bubble visibility

When windowed mode is enabled (default), the bubble SHALL become visible within a lead window before the next planned commitment.

### Requirement: Deep link from external entry

Notifications and the bubble SHALL open the app via the app scheme to the Plan experience for the current day.
