# GetGrounded — full feature catalog

Every product feature from the master build prompt. Navigation lives in [`FEATURES.md`](./FEATURES.md) (Today · Work · Plan · Review · You). This file is the inventory.

Philosophy: **Stop tracking. Start talking.** The user lives. They speak. The software books. Voice is the command interface, not a microphone glued onto a to-do list.

```text
User voice → transcript → AI interpretation → .NET validates → Postgres
```

Postgres is the book. ElevenLabs Scribe, OpenAI, Firebase, and Cloudflare R2 are services around it.

---

## How to read this

| Tag | Meaning |
|---|---|
| **MVP** | Prove the morning → day → night loop |
| **Next** | Same five tabs, more inside (V1.5) |
| **Later** | V2 and after the loop is excellent |
| **Calls** | AI phone calls — paid, opt-in, after the loop |

---

## 1. Voice and the day

| Feature | What it is | Phase | Tab |
|---|---|---|---|
| Morning plan | Notification: “Morning. What’s the plan today?” Opens Talk. User speaks the day. AI extracts commitments. High confidence saves; only ask if unsure. | MVP | Talk, Today |
| Evening reflection | “How did today actually go?” Speak the truth. AI reconciles against the morning plan. | MVP | Talk, Today |
| Midday update | “Finished the challenge. Move reading to the bus.” Complete, reschedule, cancel, partial, add, unplanned win — by voice. | MVP | Talk |
| Quick Log | Cheap path: record → `POST /voice/hear` → Scribe → `POST /voice/extract` → GPT JSON → `.NET` book. Morning, evening, midday, short updates. | MVP | Talk |
| Talk to Coach | Live conversation when it earns it: week, recovery, conflicts, Ask My Life, phone. Separate from Quick Log. | Next | Talk |
| Voice commands | “What’s left today?” “Move everything after nine to tomorrow.” “How consistent have I been with reading?” Voice is the OS. | Next | Talk |
| Client nav tools | Agent can `navigateToToday`, `openWeeklyReview`, `openReflection`, `showGoal`, `openHistory`. | Next | Talk → other tabs |
| Agent tools (server) | get/create/update commitments, unplanned wins, finish check-in/reflection, week, history, goals, routines, memory. The model talks. .NET writes. | Next | — |
| Two voice modes | Quick Log for volume. Coach for depth. Controls cost. | MVP / Next | Talk |

Do not force a confirmation screen every time. Clarify only when confidence is low. Allow manual correction when AI misses.

---

## 2. Commitments and truth

| Feature | What it is | Phase | Tab |
|---|---|---|---|
| Extraction | One sentence → structured commitments (title, time, duration). No add-task form. | MVP | Today |
| Status model | PLANNED, COMPLETED, PARTIAL, MISSED, RESCHEDULED, CANCELLED, BLOCKED, UNPLANNED. Not a boolean. | MVP | Today, History |
| Reconciliation | Evening speech vs morning plan: completed / 10 of 20 / missed. | MVP | Today, History |
| Unplanned wins | “I didn’t exercise, but I cleaned and submitted the application.” Wins are recorded. The day is not a failure. | MVP | Today, History |
| Three concepts | **Routine** (weekday lunch reading) ≠ **Commitment** (20 min today) ≠ **Accomplishment** (read 35). | MVP | Today, History |
| Smart reality check | Plan vs history: “That’s heavier than your usual day. Four most important?” | Next | Talk |
| Routine detection | Same commitment four weekdays → “Make this a weekday routine?” “Yeah.” / “Weekdays only.” No recurrence form. | Next | Talk, Today |
| Life areas | WORK, LEARNING, HEALTH, SPIRITUAL, RELATIONSHIPS, FINANCIAL, HOME, PERSONAL. Auto if confident. Never force a picker. | MVP | Today |
| Manual correction | User can fix a bad extraction. Transcript remains the audit. | MVP | Today |

---

## 3. Showing up and scores

| Feature | What it is | Phase | Tab |
|---|---|---|---|
| Showing-up streak | Honest check-in keeps the fire. “Today was terrible. I did none of it.” still counts if they reflected. | MVP | Today, You |
| Follow-through | Planned / completed / partial / missed → e.g. 84%. Moves 87 → 84, never 87 → 0. **Backend math only.** AI explains. | MVP / Next | Review |
| Daily summary | Yesterday: ✓ 4  ◐ 1  ○ 1 | MVP | Today, History |
| Promise ledger | 30-day said vs did: 126 made, 94 done, follow-through 86%. | Next | History |
| Recovery mode | After silence: “Welcome back. Want to tell me what happened?” Never “you lost your streak.” Offer a smaller tomorrow. | Next | Today, Talk |
| Milestones | 30 days showing up, 100 commitments, 30 hours reading. Quiet. Not XP, gems, or boxes. | Later | Today, Review |

---

## 4. Week, patterns, memory

| Feature | What it is | Phase | Tab |
|---|---|---|---|
| Weekly review | SQL facts first (7/7 days, 36 planned, 28 done). Then AI interpretation. | Next | Review |
| Weekly conversation | “You planned exercise four times and did it once. What got in the way?” Can rewrite next week by voice. | Next | Review, Talk |
| Pattern intelligence | Before noon 91% vs after 8pm 54%. Tuesday strong, Friday slips. “Finish portfolio” moved 6 times. Duration planned vs actual. | Next | Review |
| Ask My Life | “What do I keep postponing?” “When am I most productive?” Structured history + embeddings. | Later | Talk, Review |
| Structured memory | Typical work 9–5, commute 45, reads at lunch. Explicit rows. | Next | — |
| Semantic memory | Embeddings of meaningful reflections. Postgres **pgvector**. No extra vector DB at first. User can delete. | Next | — |
| “Why am I doing this?” | Record *their* voice when a goal starts. Later: “Want to hear what you said when you started?” Play the original. Never synthesize it. | Next | You, Talk |

---

## 5. Goals and people

| Feature | What it is | Phase | Tab |
|---|---|---|---|
| Conversational goals | “I want to be a better engineer.” → what consistency looks like → GOAL + ROUTINES + daily commitments. | Next | You, Talk |
| Accountability partners | Invite. Permissions: STREAK_ONLY, PROGRESS, DAILY_SUMMARY, FULL. Never auto-share raw audio or transcripts. | Later | You |
| Voice drops | Partner records “Finish strong.” R2. Can play on a reminder or coach turn. | Later | You |
| Shared commitments | Same gym week, two people, no forced competition. | Later | History, You |

---

## 6. AI phone calls

Opt-in. Likely paid. Not until the in-app loop is reliable.

| Feature | What it is | Phase |
|---|---|---|
| Evening call flow | Remind → wait → remind → optional later call: “Hey. How did today go?” | Calls |
| Complete reflection by phone | App never opened. Post-call webhook → transcript → .NET → reconcile → Postgres. | Calls |
| Guardrails | Quiet hours, max frequency, missed-call behavior, fallback push, minute caps, consent, TCPA / state law. | Calls |
| Cost controls | Monthly minutes, max duration, daily cap. Not unlimited. | Calls |

---

## 7. Coaching and tone

The product is calm, mature, honest, non-judgmental. It almost disappears.

| Feature | What it is | Phase | Tab |
|---|---|---|---|
| Coach styles | Gentle / Balanced / Direct / Minimal. Stored in settings. | Next | You |
| Notifications | Contextual: “You planned to study around 7. Still happening?” Never “5 incomplete tasks.” | MVP | → Talk |
| Home visual | Greeting, streak, **large mic**, Plan today / Reflect, yesterday’s honest score. Voice stays dominant. | MVP | Today |

No fake urgency. No checkbox religion.

---

## 8. Calendar (later)

Google / Apple / Outlook. “Gym after work” vs an existing 5:30 → future-you. Prevents fantasy plans.

---

## 9. Platform (not user-facing tabs)

### Mobile

Expo, React Native, TypeScript. Typed Talk works in Expo Go. Mic Quick Log does not need WebRTC.

### Backend

ASP.NET: Api / Application / Domain / Infrastructure. Business brain. Validates AI. Owns entitlements.

**Live now:** Cloudflare Containers + Neon Postgres (`https://api.get-grounded.app`).

### Firebase (phone platform only)

Auth, Analytics, Crashlytics, FCM, App Check, Remote Config. **No Firestore as the book.** Expo never writes core GetGrounded rows to Firebase.

Auth flow: Expo → Firebase ID token → API verifies → internal user → Postgres.

App Check later: ID token + App Check token. Who + is this the real app.

### Analytics events (no journal text, no transcripts)

`morning_checkin_started/completed`, `evening_reflection_started/completed`, `voice_session_started/abandoned`, commitment created/completed/rescheduled, `weekly_review_opened`, AI call answered/missed, partner added, streak 7 / 30.

### Cloudflare

DNS, private R2 (voice, why-recordings, drops, exports), Workers / Queues / Workflows as **thin** orchestration. .NET decides whether to call, whether the reflection is done, what a partner may see.

R2: short-lived signed upload/download. No public permanent audio URLs. API authorizes first.

### Voice AI

ElevenLabs Scribe hears (full transcript + optional word times). OpenAI extracts and reconciles as JSON. `.NET` validates. Never invent the score. No ElevenLabs conversational agent ticket on the Quick Log path.

### Notifications

Expo Notifications + FCM + APNs. Morning / evening / “still happening?”

---

## 10. Data (shapes, not tables yet)

User, UserSettings, DailyCheckIn, VoiceSession, Commitment, Accomplishment, Routine, Goal, GoalReasonRecording, Reflection, Memory, AccountabilityRelationship, AccountabilityVoiceDrop, SharedGoal, SharedGoalMember, NotificationPreference, AiCallPreference, AiCallSession, WeeklyReview, Achievement.

**Commitment** includes planned/actual times and durations, status, reason, source, confidence.

**VoiceSession** type: MORNING_PLAN, EVENING_REFLECTION, MIDDAY_UPDATE, WEEKLY_REVIEW, COACH_CONVERSATION, AI_PHONE_CALL. Plus transcript, processing status, optional storage key. `conversation_id` stays unused.

**Memory** has embedding, source, importance, soft delete.

---

## 11. Security (non-negotiable)

- No server secrets in Expo. Phone holds public config only.
- Secrets in the host secret store (Secret Manager today): R2, DATABASE_URL, Firebase admin, ElevenLabs, OpenAI.
- Expo never talks to Postgres.
- R2 private. Upload URLs 5–10 min. Download 5–15 min. Ownership check first.
- Audio retention: delete after transcription (default for daily logs), 30 days, or keep. Exceptions: goal-why, partner drops, user-saved.
- Never log transcripts to Analytics, Crashlytics, app logs, Cloudflare, or Sentry. Log ids, stage, duration, error code.
- Twilio webhooks later: raw body, signature, timestamp, dedupe, idempotent.
- Rate-limit: **Worker** global cap (2400/min per CF location, before container); **API** per authenticated user on `/me`, book read/write, voice hear/upload, extract/clarify, speak, clip download; `/health` by IP in .NET. Response `429` with `{ "error": "rate_limit" }`. User policies in `RateLimitEngine`.
- Entitlements checked on the server. Mobile claims are not enough.

---

## 12. Cost posture

Keep the loop cheap. Quick Log for volume. Full agent only when conversation is the product. Spark Firebase while it holds. Cloudflare free until reliability needs paid. Twilio only when calls ship. Calls are a paid differentiator.

Possible later tiers: Free (quick log, summaries, streak) · Pro (coach, week, Ask My Life) · Pro+ (phone).

---

## 13. Build order

**MVP — this loop, nothing else**

1. Sign in  
2. Open Today  
3. Talk morning  
4. Transcribe  
5. Extract  
6. .NET saves  
7. Today shows the plan  
8. Evening notify  
9. Talk reflection  
10. Transcribe  
11. Reconcile  
12. .NET saves outcomes  
13. Summary  
14. Showing-up streak  
15. History shows the day  

**Next:** memory, routines, weekly review, follow-through score, recovery, voice commands, reality check, patterns, goals, why-recordings, Talk to Coach.

**Later:** partners, drops, shared goals, Ask My Life, calendar, deeper coaching, billing.

**Calls:** Twilio or similar later, quiet hours, limits, Cloudflare wait/retry, post-call reconcile, consent.

---

## 14. What we refuse

- A task manager with a microphone.
- Firestore as source of truth.
- LLM-invented statistics.
- ElevenLabs as the database.
- Secrets on the phone.
- Logging the user’s words.
- Punishment UX for disappearing.
- A sixth tab for every idea.

New work **fills** Today, History, Talk, Review, or You.
