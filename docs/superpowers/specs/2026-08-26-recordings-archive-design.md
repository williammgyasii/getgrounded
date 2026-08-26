# Recordings archive

The day’s voice is the archive. Medical, speech, personal — if they said it and saved it, it stays: the file and the words. ⋯ on the day opens that list. Not a new tab.

Hear already gets the m4a. We throw it away. This slice keeps it.

---

## Done when

```text
speak → hear → extract → save
  → voice_sessions row has transcript + storage_key
  → ⋯ Recordings
  → back chevron (no X)
  → play the take, words under it
old takes with no file: words only, no play
typed save (no hear): words only
another person’s clip id: 404
delete the day: sessions go; best-effort delete the R2 object
```

Never log the transcript. Phone never holds R2 keys.

---

## Why not phone-only

The book is the truth. A new phone should still play yesterday. Local m4a is a cache, not the archive.

---

## HTTP

| Call | In | Out | Book? |
|---|---|---|---|
| `POST /voice/hear` | multipart `audio` | `{ transcript, storageKey }` | no |
| `POST /days/morning` | existing body + optional `storageKey` | `DayRecord` | **yes** — writes `voice_sessions.storage_key` when present |
| `GET /voice/clips/{id}` | Bearer | `audio/mp4` (or original type) | no |
| `GET /days`, `GET /days/today` | timezone | `clips[]` include `playable` | no |

`playable` is `storage_key IS NOT NULL`. Do not send the raw key on day reads.

`GET /voice/clips/{id}` is this user’s session or 404. No key → 404. Stream from the store; do not load the whole book.

Same 2 MiB / type rules as hear.

Add-another-take uses the same hear → `storageKey` → morning save path.

---

## Store

`IAudioStore`: `PutAsync` → opaque key. `GetAsync(key)` → bytes + content type or null. `DeleteAsync(key)` best-effort.

| Env | Implementation |
|---|---|
| Tests / local without keys | Memory that **keeps** bytes (today’s store returns a fake key and drops the file) |
| Cloud Run / any host with keys | **R2 only.** Private bucket already in terraform (`getgrounded-dev-audio`). Key: `{userId}/{kind}/{uuid}.m4a` |

Files live in R2. Phone never talks to R2. Cloud Run needs `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`. API streams the file.

---

## Book

`voice_sessions.storage_key` already exists (`TEXT NULL`).

`ClipRecord` grows `Playable` (bool). Load selects `storage_key IS NOT NULL`, not the key itself.

`InsertSessionAsync` writes `storage_key` when morning/evening sends one.

---

## Phone

⋯ **Recordings** (not Your transcript).

Sheet matches the day header: **back chevron**, title Recordings. No X.

Each take, newest last (same order as `created_at`):

- If `playable`: play / pause, then the transcript.
- If not: transcript only.

Empty: “No recordings on this day yet.”

Play: `GET /voice/clips/{id}` with the same Bearer as the rest of the book. One take at a time.

---

## Out of this slice

- Global archive across all days (this is per day)
- Evening recordings (same table later; morning + add-take first)
- Signed R2 URLs
- Transcript search
- Sharing / export
- Keeping audio when they type instead of speak
