# GetGrounded features → five tabs

Stop tracking. Start talking.

The user lives the day. They speak the plan in the morning and the truth at night. The software does the bookkeeping. Voice is the command interface, not a dictation box on a task manager.

This file is the product map for navigation. The full inventory is [`FEATURE-CATALOG.md`](./FEATURE-CATALOG.md).

---

## What the five are for

The bar has **five** destinations. The center one is Talk: raised, bulging, animated. Talk stays **in** the tab shell. The bar never disappears.

The names come from surfaces in the product, not from habit-tracker chrome (no “Day”, no “Stay”).

```text
Today     History     [ Talk ]     Review     You
  desk     ledger      voice        week      account
```

| Tab | Product job | First screen (now) | Later, same tab |
|---|---|---|---|
| **Today** | Live this day. Greeting, showing-up streak, remaining commitments, yesterday’s honest score. Mic CTA: Plan today / Reflect / Update my day. | Desk you already have, copy from the home mock in the master prompt. | Commitments with COMPLETED / PARTIAL / MISSED. Unplanned wins. Recovery welcome-back. |
| **History** | Promise ledger: what I said vs what I did. | Empty: “No days spoken yet.” | Daily summaries, past check-ins, “Finish portfolio moved 6 times.” |
| **Talk** | The voice OS. Morning plan, midday update, evening reflection, coach, Ask My Life. One tap from a notification. | Product copy + mint a ticket. Tabs stay. | ElevenLabs Quick Log + Talk to Coach. Client tools can `navigateToToday`. |
| **Review** | Follow-through and the week. Facts from SQL, words from AI. | Empty: “A week appears after you show up.” | Weekly review, 84% not 0%, pattern lines, conversational week. |
| **You** | The person, not the tasks. | Email + sign out. | Coach style, quiet hours, audio retention, partners, call opt-in. |

Talk is a **tab**, not a new page. Remove `href: null` and the “hide bar on Talk” branch.

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

---

## Core loop (prove this first)

```text
Sign in
  → Today
  → Talk (morning): "Here's what I'm doing."
  → live the day (optional Talk: update)
  → Talk (evening): "Here's what happened."
  → Today / History show the bookkeeping
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

- **Quick Log** — cheap: morning, evening, midday, short updates. Scribe → API → extract.
- **Talk to Coach** — expensive: weekly, recovery, conflicts, Ask My Life, phone.
- ElevenLabs talks. **.NET + Postgres** remember.
- Secrets stay on the server. The phone only holds a short-lived ticket.

Expo Go can mint a ticket. Live WebRTC needs the GetGrounded **dev build**.

---

## Stack we actually run (prompt vs now)

The master prompt still says Render. Live GetGrounded is:

- API: Cloud Run (`https://dev.get-grounded.app`)
- Data: Cloud SQL Postgres
- Auth: Firebase
- Audio objects: Cloudflare R2
- Infra: Terraform in `environments/dev`

Firebase is the phone platform (auth, later FCM / Crashlytics). It is not the book.

---

## What we are not building in this UI slice

- Real extraction / reconciliation (API still identity + voice ticket).
- ElevenLabs in-app conversation (waits on the Android dev build).
- Expo UI native controls (Expo Go cannot host them).
- A sixth tab, shop, XP, or habit categories the user has to pick.

This slice: five tabs from this file, Talk keeps the bar, forest on the raised mic, Today / History / Review / You as honest empty or desk states.
