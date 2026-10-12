## Purpose

Turns spoken or typed words into structured drafts the Plan wizard can check before booking. Morning planning includes Muse clarification before extract.

## ADDED Requirements

### Requirement: Morning extract returns a checkable draft

The system SHALL expose `POST /voice/extract` for authenticated callers. When `kind` is `MORNING_PLAN`, the body MUST accept transcript, timezone, and spokenAt (ISO timestamp). The response MUST return a morning draft: optional day title, optional coach note from Muse, and a commitments array with title, optional planned duration minutes, optional planned start minute, and optional life area.

#### Scenario: Transcript with multiple plan lines

- **WHEN** the client sends `POST /voice/extract` with `kind: MORNING_PLAN`, a valid timezone, spokenAt, and a transcript that names several tasks
- **THEN** the response status is 200
- **AND** `commitments` contains at least one item with a non-empty title derived from the transcript

#### Scenario: Unknown extract kind rejected

- **WHEN** the client sends `POST /voice/extract` with a kind other than `MORNING_PLAN`, `EVENING_REFLECTION`, or `MIDDAY_UPDATE`
- **THEN** the response status is 400

#### Scenario: Evening and midday kinds not implemented yet

- **WHEN** the client sends `POST /voice/extract` with `kind: EVENING_REFLECTION` or `MIDDAY_UPDATE`
- **THEN** the response status is 501

#### Scenario: Empty transcript rejected

- **WHEN** the client sends `POST /voice/extract` with `kind: MORNING_PLAN` and a blank transcript
- **THEN** the response status is 400

#### Scenario: Unauthenticated extract request

- **WHEN** the client sends `POST /voice/extract` without a valid Bearer token
- **THEN** the response status is 401

### Requirement: Morning clarify before extract

The system SHALL expose `POST /voice/clarify` for authenticated callers when `kind` is `MORNING_PLAN`. The response MUST include a Muse line and zero or more clarification questions (id, prompt, optional topic) when the transcript lacks scheduling detail.

#### Scenario: Gym without time yields a question

- **WHEN** the client sends `POST /voice/clarify` with a transcript that mentions gym without a clock time
- **THEN** the response status is 200
- **AND** `questions` contains at least one item about gym timing

#### Scenario: Unauthenticated clarify request

- **WHEN** the client sends `POST /voice/clarify` without a valid Bearer token
- **THEN** the response status is 401
