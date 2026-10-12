## Purpose

Maps an external login identity (Firebase UID) to GetGrounded's internal user id and rejects deleted accounts.

## Requirements

### Requirement: Authenticated caller receives internal user id

The system SHALL expose `GET /me` that accepts an `Authorization: Bearer <token>` header and returns the caller's internal user id when the token is valid and the account is active.

#### Scenario: Valid token and living user

- **WHEN** the client sends `GET /me` with a valid Bearer token for a user that exists and is not deleted
- **THEN** the response status is 200
- **AND** the JSON body is `{ "userId": "<guid>" }` where the guid is stable for that login identity

#### Scenario: Missing Authorization header

- **WHEN** the client sends `GET /me` without an `Authorization` header
- **THEN** the response status is 401

#### Scenario: Invalid or unverifiable token

- **WHEN** the client sends `GET /me` with a Bearer token that cannot be verified
- **THEN** the response status is 401

#### Scenario: Deleted (tombstone) user

- **WHEN** the client sends `GET /me` with a valid Bearer token for a user marked deleted
- **THEN** the response status is 401

### Requirement: Login identity maps to one internal user

The system SHALL resolve each verified login identity to exactly one internal user record, creating the record on first successful authentication.

#### Scenario: First login

- **WHEN** a valid token is presented for a login identity that has never been seen
- **THEN** the system creates a new user with a new guid
- **AND** subsequent requests with the same login identity return the same guid
