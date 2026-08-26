# Vertex Quick Log — design

Locked for the rest of Phase 1 capture: hear the day on Vertex, book it in Postgres. ElevenLabs and OpenAI leave the product. Vertex AI Studio stays a lab. Agent Studio / Gemini Live / Chirp speak wait for coach.

Philosophy: the phone records. `.NET` hears, extracts, validates, writes. Gemini never invents a streak or a status we did not allow.

Companion: [phase1-book-design](./2026-08-26-phase1-book-design.md). The five tables do not change.

---

## Vendor

| Use | Service | How |
|---|---|---|
| Hear | Cloud Speech-to-Text (`speech.googleapis.com`) | Sync recognize, clips ≤ 60s. Chirp / telephony model as Google documents for short audio. |
| Extract / reconcile | Gemini on Vertex (`aiplatform.googleapis.com`) | `generateContent` + structured JSON. Pin a Flash-class model id in config (`VERTEX_MODEL`). |
| Speak | Cloud Text-to-Speech | API enabled only. No call in Phase 1. |
| Book | Existing `BookService` + `/days/*` | Same morning / evening writes. |

Auth is Application Default Credentials on Cloud Run. No Gemini API key. No `generativelanguage.googleapis.com`. Phone never talks to Google AI.

---

## Surfaces we will not use

| Surface | Why not |
|---|---|
| Vertex AI Studio | Playground. Prompts in the console are not versioned with the app. |
| Prompt classes in Agent Studio | Extract rules live in `.NET` next to tests. |
| Agent Platform / Agent Studio / Dialogflow CX | Visual agents. Terraform exists (`google_vertex_ai_*`, CX). Wrong product for a one-minute log. |
| Gemini Live | Live coach. Next, not morning volume. |
| AI Studio (`aistudio.google.com`) | Different auth and bill. |
| `google_vertex_ai_endpoint` | For **our** deployed models. Gemini Flash is a publisher model string. |

Docs that match this path: [generateContent quickstart](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/try-gen-ai), [Speech-to-Text](https://cloud.google.com/speech-to-text/docs/before-you-begin), [Terraform for Agent Platform](https://cloud.google.com/vertex-ai/docs/start/use-terraform-vertex-ai) (read so we do **not** copy it).

---

## Terraform

Module `infra/terraform/modules/vertex`:

- `google_project_service` for `aiplatform.googleapis.com`, `speech.googleapis.com`, `texttospeech.googleapis.com` (`disable_on_destroy = false`)
- `roles/aiplatform.user` and `roles/speech.client` on the Cloud Run runtime SA (`317766274600-compute@developer.gserviceaccount.com`)

No API key secret. No Vertex endpoint. No recognizer resource until we need a reusable v2 config.

Cloud Run env for capture (later slice, not this module): `GOOGLE_CLOUD_PROJECT=get-ground-448ca`, `GOOGLE_CLOUD_LOCATION=us-central1`, `VERTEX_MODEL=<pinned Flash id>`. ADC needs no extra secret.

Raise the Cloud Run request timeout from 30s to 60s when the capture endpoint ships (STT + Gemini on a cold start).

---

## Data flow

```text
Talk mic
  → POST /voice/clips  (Bearer, kind, timezone, audio bytes)
  → API writes object to R2 (storage_key)
  → ISpeechToText.HearAsync(bytes) → transcript
  → IDayInterpreter.ReadAsync(kind, transcript, desk?) → draft
  → .NET validates titles, statuses, ids
  → BookService.PlanMorningAsync / ReflectEveningAsync
  → voice_sessions row (transcript, storage_key, processing_status)
  → same desk JSON Today already reads
```

Typed `TalkLog` stays. Same book endpoints. Mic is another way to produce a transcript + draft.

Phone does not post extracted JSON. Phone does not call Vertex. One authenticated request.

Audio: one take, ≤ 60 seconds, ≤ 2 MiB. MIME `audio/mp4` or `audio/m4a` from Expo. Sync Speech-to-Text only (Google’s ≤ 1 minute path). No streaming. No signed upload URL in this slice — API receives bytes and puts them on `getgrounded-dev-audio` itself.

---

## Ports

```csharp
public interface ISpeechToText
{
    Task<HearResult> HearAsync(HearClip clip, CancellationToken cancellationToken);
}

public sealed record HearClip(byte[] Bytes, string ContentType);
public sealed record HearResult(string Transcript, float? Confidence);

public interface IDayInterpreter
{
    Task<MorningDraft> ReadMorningAsync(string transcript, CancellationToken cancellationToken);
    Task<EveningDraft> ReadEveningAsync(
        string transcript,
        IReadOnlyList<DeskCommitment> planned,
        CancellationToken cancellationToken);
}
```

`MorningDraft` / `EveningDraft` map onto the existing `PlannedItem`, `OutcomeItem`, `WinItem` the book already takes.

Gemini must return JSON only. Schema:

**Morning**

```json
{
  "commitments": [
    {
      "title": "Read",
      "plannedDurationMinutes": 20,
      "confidence": 0.9
    }
  ]
}
```

**Evening**

```json
{
  "outcomes": [
    {
      "id": "<commitment uuid from the request>",
      "status": "COMPLETED",
      "actualDurationMinutes": 25,
      "reason": null
    }
  ],
  "wins": [{ "title": "Cleaned the kitchen" }]
}
```

Allowed evening statuses: `COMPLETED`, `PARTIAL`, `MISSED`, `RESCHEDULED`, `CANCELLED`, `BLOCKED`. Gemini receives the morning ids. If it invents an id, `.NET` drops that outcome. If it leaves a planned item out, `.NET` marks that leftover `MISSED` (same honest default the typed stand-in uses). The LLM never sets `showed_up` or the streak number.

Empty transcript after STT: no book write. Session `FAILED`.

---

## HTTP

`POST /voice/clips`

- Auth: Bearer Firebase id token → our `users.id`
- Multipart: `kind` (`MORNING_PLAN` \| `EVENING_REFLECTION`), `timezone` (IANA), `audio` (file)
- 200: same desk payload as `GET /days/today`
- 400: bad kind / timezone / empty file
- 401: no user
- 413: over 60s or 2 MiB
- 422: no speech
- 502: Vertex returned unusable JSON
- 503: Vertex / Speech unavailable

`GET /voice/session` is deleted. No ticket.

---

## `voice_sessions`

Keep the table. Change meaning only:

| Column | After this spec |
|---|---|
| `transcript` | STT text. Never log. |
| `processing_status` | `RECEIVED` → `EXTRACTED` \| `FAILED` |
| `storage_key` | R2 object key. Required for clips. |
| `conversation_id` | Null. Not an ElevenLabs id. Do not store Vertex request ids. |

---

## Talk (phone)

One screen for everyone. Delete the WebRTC gate.

- Mic → `POST /voice/clips`
- Keyboard → existing `POST /days/morning` and `/days/evening` (typed stand-in)
- No `@elevenlabs/react-native`, no LiveKit, no `react-native-webrtc` plugins

Expo Go can record. A new native build is required only to **drop** the old WebRTC APK, not to use Quick Log.

---

## Nuke list (implementation, after this spec)

Delete or stop referencing:

| Path | What goes |
|---|---|
| `api/GetGrounded.Infrastructure/Voice/ElevenLabsVoiceSessions.cs` | Ticket mint |
| `api/GetGrounded.Application/Voice/IVoiceSessionIssuer.cs` | Port |
| `api/GetGrounded.Application/Voice/VoiceSession.cs` | Ticket DTO |
| `api/GetGrounded.Application/Voice/VoiceIssue.cs` | Ticket result |
| `api/GetGrounded.Api/Controllers/VoiceController.cs` | `GET /voice/session` |
| `api/GetGrounded.Tests/VoiceTests.cs` | Ticket tests |
| ElevenLabs `HttpClient` in `DependencyInjection.cs` | `api.elevenlabs.io` |
| `mobile/src/components/talk/talk-agent.tsx` | Agent UI |
| `startVoiceSession` in `mobile/src/store/api.ts` | RTK ticket |
| WebRTC branch in `mobile/src/app/(app)/talk.tsx` | Always `TalkLog` + mic |
| `mobile` deps | `@elevenlabs/*`, `@livekit/*`, `livekit-client`, `@config-plugins/react-native-webrtc` |
| `infra/terraform/modules/cloud_run` `ELEVENLABS_*` | Env + variables |
| `infra/terraform/modules/secret` ElevenLabs secret + IAM | After Cloud Run no longer mounts it |
| `infra/terraform/environments/dev/main.tf` `elevenlabs_agent_id` | Agent id |
| Catalog / FEATURES / README ElevenLabs + OpenAI as the path | Vertex + `.NET` |

Do not destroy the Secret Manager secret in the same apply as the first Vertex module. Unmount from Cloud Run first, then remove the secret resource in a later apply so a failed apply cannot strand the service.

Park, do not delete: `voice/agent_configs/`, Chirp mp3 samples (ears only).

---

## Errors and safety

- Never log `transcript`, draft JSON, or audio bytes. Log `kind`, byte length, duration, status code, Vertex error code.
- Rate-limit `/voice/clips` per user (e.g. 20/hour).
- Default audio retention: delete the R2 object after `EXTRACTED` once we have a deleter. Until then `storage_key` may remain. Spec of the book already allowed this delay.
- `.NET` is the validator. Gemini is a draft.

---

## Tests (TDD when we implement)

1. `HearAsync` port: fake returns a transcript; empty bytes → 422 path.
2. `ReadMorningAsync`: valid JSON → `PlannedItem` list; garbage JSON → failed interpret.
3. `ReadEveningAsync`: unknown id dropped; omitted planned id → `MISSED`.
4. `POST /voice/clips` with stub speech + interpreter calls `PlanMorningAsync` once and returns the desk.
5. Existing book tests stay green. Ticket tests are deleted with the ticket.

---

## Out of scope

Chirp playback, Gemini Live coach, midday voice, evening notification, signed R2 upload URLs, Speech-to-Text v2 reusable recognizers, prompt store in Agent Studio, OpenAI leftover (none in code), committing or applying the ElevenLabs secret destroy.
