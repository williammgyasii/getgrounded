## Purpose

Owns the day book: calendar days, commitments, showing-up streak, and the desk/history views the Today and Work tabs read.

## ADDED Requirements

### Requirement: Today's desk returns streak and day snapshots

The system SHALL expose `GET /days/today?timezone=<iana>` for authenticated callers. The response MUST match the desk shape the mobile client expects: local date, streak day count, today's day record (or null), and yesterday's day record (or null).

#### Scenario: Authenticated caller with no days yet

- **WHEN** the client sends `GET /days/today?timezone=America/New_York` with a valid Bearer token and the user has no saved days
- **THEN** the response status is 200
- **AND** `streakDays` is 0
- **AND** `today` and `yesterday` are null

#### Scenario: Authenticated caller after a morning plan was saved today

- **WHEN** the client sends `GET /days/today` with a valid Bearer token after saving a morning plan for the caller's local today
- **THEN** the response status is 200
- **AND** `today` includes the saved commitments with status `PLANNED`
- **AND** `streakDays` reflects consecutive local days where the user showed up

#### Scenario: Missing or invalid timezone

- **WHEN** the client sends `GET /days/today` without a timezone or with an invalid IANA zone
- **THEN** the response status is 400

#### Scenario: Unauthenticated desk request

- **WHEN** the client sends `GET /days/today` without a valid Bearer token
- **THEN** the response status is 401

### Requirement: History lists past days newest first

The system SHALL expose `GET /days?timezone=<iana>` for authenticated callers and return an array of day records ordered by local date descending.

#### Scenario: History after one morning save

- **WHEN** the client sends `GET /days?timezone=America/New_York` after one morning plan was saved
- **THEN** the response status is 200
- **AND** the array contains exactly one day with its commitments and clips metadata

#### Scenario: Unauthenticated history request

- **WHEN** the client sends `GET /days` without a valid Bearer token
- **THEN** the response status is 401

### Requirement: Morning plan creates or updates today's day

The system SHALL expose `POST /days/morning` for authenticated callers. The body MUST accept timezone, transcript, optional title, optional coach note from Muse, optional storageKey and words, and a commitments array. On success the system MUST persist the day (create or replace morning plan for that local date), store a `MORNING_PLAN` voice session with the transcript, insert commitments with status `PLANNED` and source `MORNING_EXTRACT`, set `showed_up` true for that day, and return the full day record including coach note when provided.

#### Scenario: Morning save persists coach note

- **WHEN** the client sends `POST /days/morning` with a non-empty `coachNote`
- **THEN** the response status is 200
- **AND** the day record includes the same coach note on subsequent desk loads

#### Scenario: First morning plan of the day

- **WHEN** the client sends `POST /days/morning` with a valid Bearer token, a valid timezone, a non-empty transcript, and one or more commitments with titles
- **THEN** the response status is 200
- **AND** the response body is a day record whose `localDate` is the caller's local today in that timezone
- **AND** each commitment has a new id, status `PLANNED`, and the supplied title and optional planned duration, start minute, and life area

#### Scenario: Replacing an existing morning plan the same day

- **WHEN** the client sends `POST /days/morning` again for the same user and local date
- **THEN** the response status is 200
- **AND** previous morning-extracted commitments for that day are replaced by the new set
- **AND** a new morning voice session row is recorded

#### Scenario: Empty commitments rejected

- **WHEN** the client sends `POST /days/morning` with an empty commitments array
- **THEN** the response status is 400

#### Scenario: Unauthenticated morning save

- **WHEN** the client sends `POST /days/morning` without a valid Bearer token
- **THEN** the response status is 401
