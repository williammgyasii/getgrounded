# GetGrounded features → five tabs

Stop tracking. Start talking.

The user lives the day. They speak the plan in the morning and the truth at night. The software does the bookkeeping. Voice is the command interface, not a dictation box on a task manager.

This file is the product map for navigation. The full inventory is [`FEATURE-CATALOG.md`](./FEATURE-CATALOG.md).

---

## What the five are for

The bar has **five** destinations. The center one is Plan: raised, bulging, animated. Plan stays **in** the tab shell. The bar never disappears.

The names come from surfaces in the product, not from habit-tracker chrome (no “Day”, no “Stay”).

```text
Today     Work     [ Plan ]     Review     You
  desk    ledger    morning      week      account
```

| Tab | Product job | First screen (now) | Later, same tab |
|---|---|---|---|
| **Today** | Live this day. Greeting, showing-up streak, remaining commitments, yesterday’s honest score. Mic CTA: Plan today / Reflect / Update my day. | Desk you already have, copy from the home mock in the master prompt. | Commitments with COMPLETED / PARTIAL / MISSED. Unplanned wins. Recovery welcome-back. |
| **Work** | Promise ledger: what I said vs what I did. Route stays `history`. | Empty: “No days spoken yet.” | Daily summaries, past check-ins. |
| **Plan** | Morning wizard. Midday and evening later. | Record → Your words → Thinking → Check the plan → Save. | Coach, Ask My Life. |
| **Review** | Follow-through and the week. Facts from SQL, words from AI. | Empty: “A week appears after you show up.” | Weekly review, 84% not 0%, pattern lines, conversational week. |
| **You** | The person, not the tasks. | Email + sign out. | Coach style, quiet hours, audio retention, partners, call opt-in. |

Plan is a **tab**, not a new page. Route stays `talk`.

---

## Color (so the bar reads as GetGrounded)

Stone floor stays. Ink is for **words**. Forest is for **action**.

| Token | Use |
|---|---|
| Stone `#F3EFE8` | Screen floor |
| Ink `#1C1915` | Titles, body |
| Forest `#2F4A3C` | Raised Talk, primary CTA, focused tab |
| Cream `#FAF7F1` | Cards, tab bar surface |
| Moss `#DCE6DF` | Soft selected chip |

The raised mic is forest, not black.

### Typography

| Role | Font | Use |
|---|---|---|
| **Type** | Inter (400–700) | Body, headlines, tabs, buttons — single mobile UI sans |

Tokens live in `mobile/src/constants/theme.ts` as `Typography.*`. Custom fonts: never mix `fontWeight` with `fontFamily` on the same text node.

---

## Core loop (prove this first)

```text
Sign in
  → Plan (morning): "Here's what I'm doing."
  → live the day
  → Plan (evening, later): "Here's what happened."
  → Today / Work show the bookkeeping
  → showing-up streak moves if they were honest
```

Do not add partners, phone calls, or Ask My Life until this loop feels excellent.

---

## Feature map

### Always (philosophy)

- One sentence instead of five taps.
- Status is not a boolean: PLANNED, COMPLETED, PARTIAL, MISSED, RESCHEDULED, CANCELLED, BLOCKED, UNPLANNED.
- Streak = showed up and told the truth. Not a perfect list.
- Follow-through is a separate, gradual score. Backend math. AI only explains.
- Unplanned wins count. A messy day is still a day.
- Routine ≠ commitment ≠ accomplishment.
- Recovery: “Welcome back. Want to tell me what happened?” Never “you lost your streak.”
- Code owns facts. AI owns interpretation. Postgres owns truth.

### MVP — belongs on these tabs

| Feature | Tab |
|---|---|
| Morning / evening / midday voice | **Talk** (CTA also on **Today**) |
| Today’s plan and remaining | **Today** |
| Yesterday completed / partial / missed | **Today** |
| Unplanned wins | **Today**, then **History** |
| Showing-up streak | **Today** (number), **You** (what it means) |
| Daily summary + past days | **History** |
| Basic follow-through counts | **Review** (can show “not enough days” until then) |
| Auth, account | **You** |
| Push: “What’s the plan?” / “How did today go?” | Opens **Talk** |

### Next (same five tabs, more inside)

| Feature | Tab |
|---|---|
| Weekly review + AI conversation | **Review** |
| Pattern lines, planning realism | **Review** |
| Goals, “why I started” (their own voice) | **You** → opens **Talk** to record |
| Routines, memory, Ask My Life | **Talk** asks; **History** / **Review** show |
| Coach styles | **You** |
| Accountability partners, voice drops | **You** |
| AI phone calls (opt-in, paid) | **You** preferences; not a sixth tab |

Nothing in that list needs a sixth tab. New work **fills** a tab.

---

## Voice (do not turn Talk into a form)

- **Quick Log** — cheap: morning, evening, midday, short updates. Phone records. API hears on ElevenLabs Scribe, extracts with OpenAI, books in Postgres.
- **Talk to Coach** — expensive: weekly, recovery, conflicts, Ask My Life, phone. Later slice.
- ElevenLabs hears. GPT drafts. **.NET + Postgres** remember.
- Secrets stay on the server. The phone never talks to Scribe or OpenAI directly.

Expo Go can type the day. Mic Quick Log does not need WebRTC.

---

## Stack we actually run (prompt vs now)

**Local dev (rebuild-api branch):**

- API: `dotnet run` in `api/` → `http://<mac-lan-ip>:5217`
- Phone: `EXPO_PUBLIC_API_URL` in `mobile/.env` (same IP, not `localhost`)
- Data: Neon Postgres (`DATABASE_URL` in `api/.env`)
- Auth: Firebase on phone; API verifies token (Identity slice)

**Deployed (legacy, until rebuild parity):**

- API: Cloud Run (`https://dev.get-grounded.app`)
- Data: Neon Postgres
- Audio: Cloudflare R2
- Infra: Terraform in `infra/`

Firebase is the phone platform (auth, later FCM / Crashlytics). It is not the book.

---

## What we are not building in this UI slice

- Clip playback from R2 (`GET /voice/clips/{id}`).
- In-app microphone UI (typed Talk first).
- Expo UI native controls (Expo Go cannot host them).
- A sixth tab, shop, XP, or habit categories the user has to pick.

This slice: five tabs from this file, Talk keeps the bar, forest on the raised mic, Today / History / Review / You as honest empty or desk states.
