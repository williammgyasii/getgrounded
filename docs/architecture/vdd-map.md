# VDD map — GetGrounded API rebuild

Volatility-driven design: slice by what changes, not by feature nouns. Each **room** is a folder; dependencies point inward toward Domain facts.

## Cast (Identity chapter)

| Actor | Where | Job |
|-------|-------|-----|
| **Phone** | Mobile app | Holds Firebase token, calls API |
| **MeController** | `GetGrounded.Api/Identity/` | HTTP door — reads Bearer, returns JSON or 401 |
| **AuthManager** | `GetGrounded.Application/Identity/` | Runs the sequence: verify → find/create → accept |
| **AuthEngine** | same | Policy: tombstone users are rejected |
| **Token accessor** | Infrastructure (port in Application) | "Is this token real? What's the login id?" |
| **User accessor** | Infrastructure (port in Application) | "Load or create our `User` for this login id" |
| **User** | `GetGrounded.Domain/Identity/` | Facts: `Id`, `LoginId`, `DeletedAt` |
| **Firebase / Postgres** | Outside code | Resources the accessors talk to |

## Cast (Book chapter)

| Actor | Where | Job |
|-------|-------|-----|
| **DaysController** | `GetGrounded.Api/Book/` | HTTP door for desk, history, morning save |
| **PlanMorningManager** | `Application/Book/` | Sequence: validate → local date → save via accessor |
| **DeskManager / HistoryManager** | same | Read desk snapshot and history list |
| **BookEngine** | same | Policy: require transcript, sentence titles, clean items |
| **IBookDayAccessor** | port | Persist and load days, commitments, sessions |
| **PostgresBookDayAccessor** | `Infrastructure/Book/` | SQL for the book |
| **LocalDay / Streak** | `Domain/Book/` | Calendar date and streak math (no I/O) |

## Cast (Hear chapter)

| Actor | Where | Job |
|-------|-------|-----|
| **VoiceController** | `GetGrounded.Api/Hear/` | HTTP door for `POST /voice/hear` and `POST /voice/extract` |
| **HearManager** | `Application/Hear/` | Save clip → Scribe → transcript |
| **PlanExtractManager** | same | Validate input → call accessor |
| **PlanExtractEngine** | same | Policy: require transcript and timezone |
| **PlanExtractInterpreter** | same | Map GPT JSON → `MorningDraft` |
| **IPlanExtractAccessor** | port | Turn transcript into `MorningDraft` |
| **OpenAiPlanExtractAccessor** | `Infrastructure/Hear/` | GPT JSON extract when `OPENAI_API_KEY` set |
| **HeuristicPlanExtractAccessor** | same | Line-split fallback when no OpenAI key |
| **ElevenLabsSpeechToTextAccessor** | same | Scribe STT when `ELEVENLABS_API_KEY` set |
| **R2AudioClipAccessor / MemoryAudioClipAccessor** | same | Clip archive |

## Story — morning plan on the phone

1. Phone records → **`POST /voice/hear`**. **VoiceController** → **HearManager** → **R2** + **ElevenLabs Scribe** → `{ transcript, storageKey }`.
2. Phone (or user edit) → **`POST /voice/extract`**. **PlanExtractManager** → **OpenAiPlanExtractAccessor** (or heuristic without key) → draft.
3. User edits on Check, taps Save. **`POST /days/morning`** → **PlanMorningManager** → **PostgresBookDayAccessor** writes day + commitments + voice session.
4. **Today** tab calls **`GET /days/today`** → **DeskManager** → streak + today/yesterday snapshots.
5. **Work** tab calls **`GET /days`** → **HistoryManager** → ledger list.

**Wrong:** "VoiceController saves to Postgres."  
**Right:** "Extract returns a draft; DaysController books after the user approves."

## Layer diagram

```text
┌─────────────────────────────────────────────────────────┐
│  Client (volatile)     Api/{Identity,Book,Hear}/        │
│  MeController, DaysController, VoiceController          │
└───────────────────────────┬─────────────────────────────┘
                            │ calls
┌───────────────────────────▼─────────────────────────────┐
│  Managers + Engines       Application/{Identity,Book,Hear}│
│  AuthManager, PlanMorningManager, PlanExtractManager, … │
│  Ports: IAuth*, IBookDayAccessor, IPlanExtractAccessor │
└───────────────┬─────────────────────────┬───────────────┘
                │ uses                  │ implemented by
┌───────────────▼─────────────┐  ┌──────▼──────────────────┐
│  Domain/{Identity,Book}/  │  │  Infrastructure/…       │
│  User, LocalDay, Streak     │  │  Firebase, Postgres, …  │
└─────────────────────────────┘  └─────────────────────────┘
```

## Naming cheat sheet

| Suffix / name | Layer | Example |
|---------------|-------|---------|
| `*Controller` | Client | `MeController`, `DaysController` |
| `*Manager` | Manager | `AuthManager`, `PlanMorningManager` |
| `*Engine` | Engine | `AuthEngine`, `BookEngine` |
| `I*Accessor` | Port | `IBookDayAccessor` |
| `*Accessor` | Adapter | `PostgresBookDayAccessor` |

## Living specs

Behavior contracts live in OpenSpec:

- `openspec/specs/identity/spec.md` — `/me`
- `openspec/changes/plan-morning/specs/book/spec.md` — desk, history, morning save (delta)
- `openspec/changes/plan-morning/specs/hear/spec.md` — morning extract (delta)

Commands: `/opsx-explore`, `/opsx-propose`, `/opsx-sync`, `/opsx-archive`.

## Future rooms (not started)

- **Reader** — playback, reflection window
- **Health** — ping, readiness

Each gets its own Manager, Engine, accessors, and spec under `openspec/specs/<room>/`.
