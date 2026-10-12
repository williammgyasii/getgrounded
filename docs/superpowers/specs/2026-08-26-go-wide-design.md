# Go wide — anticipation, films, early access

Get the sentence into strangers’ heads before the store exists. Content now. List grows. Beta opens in waves. Wide is the feed. The ask is one door.

This is not a product slice. The morning → night loop still has to get excellent. These films must not wait for that — and must not show the unfinished app.

---

## Done when

```text
stranger sees a 15–30s film
  → files it as “habits, but you talk”
  → one URL
  → join the list  =  line for early access
  → we invite in waves when the loop is honest
  → they speak a morning
```

No second button. Follow can sit on the same page. TestFlight is not in the film.

---

## Locked decisions

| Decision | Lock |
|---|---|
| Job now | Anticipation. Not a cold store drop. |
| Reach | Go wide in the feed. Message stays one life. |
| First filing | Hook as a habit tracker. Land as talking. |
| Doors | A, B, C are one house. First ten films open on A (taps failed me) and prove with B (you talk). C (I went quiet) is why they stay. |
| Look | After Effects register. Feature as a *scene*, ElevenLabs-style. Life, not chrome. |
| Sound | Spoken word. Silent kinetic ads are fallback, not the brand. |
| Ask | Waitlist **is** the beta line. |
| People | No influencers. The voice in the film is the product. |
| App UI | Off-screen until the loop is honest. Optional even then. |

Sentence a stranger should leave with:

> You don’t tap a list. You say the day. The software keeps the book.

---

## The machine

```text
film (9:16, spoken)
  → same end card, one URL
  → get-grounded.app
  → email on the list
  → drip: the sentence, one feature scene, “you’re in line”
  → wave invite when morning + evening both write the book
  → Firebase sign-in  →  they are a user
```

The marketing list is **not** `users`. A row in Postgres appears only after they sign in. Delete GetGrounded still means erase the book. Unsubscribing from the list is not delete-account.

---

## One house, three doors

Same product. One story per film. All three in the feed over time.

| Door | Wound | First line energy |
|---|---|---|
| **A** — taps failed me | Habit apps, streaks, guilt | Widest stop. Opens the first ten. |
| **B** — I already talk | Voice notes, journaling, thinking out loud | Proves it is not another tracker. |
| **C** — I went quiet | Recovery, no reset-to-zero | Why they stay. Not the first hook. |

Do not blend A+B+C in one clip. A manifesto has no first line.

---

## Film series

Each film is **one feature as a life**, not a screen. No Talk tab. No tab bar. No fake phone chrome.

Length: 15–30 seconds. 9:16 first. Recut 1:1 and 16:9 from the same master if a platform needs it.

### First ten (week one stock)

| # | Door | Feature (the life) | Land |
|---|---|---|---|
| 1 | A | The checkbox graveyard — taps, reset, gone | You don’t tap. You talk. |
| 2 | B | Morning — they say the day. The book writes itself. | Speak the plan. |
| 3 | B | Night — they say what happened. | Tell the truth. |
| 4 | C | Messy day. Still a day. | Honesty keeps the fire. |
| 5 | B | Midday — the plan moves because life moved. | Update out loud. |
| 6 | C | They came back. No “streak lost.” | Welcome back. |
| 7 | A | Follow-through is not a streak. 84%, not 0%. | The book is honest. |
| 8 | B | A voice note that became a day. | The software books. |
| 9 | C | Unplanned win. The day is not a failure. | What happened counts. |
| 10 | — | The ask, as its own film. | Join the list. That’s early access. |

After ten, rotate the same four lives: morning, midday, night, recovery. New pictures. Same sentence. Same end card.

### End card (every film)

```text
GetGrounded
You say the day.
get-grounded.app
Early access
```

No “link in bio” as the only door if the platform lets a URL on screen. Bio URL matches the card.

### What a film must not show

- The real app, simulators, or a Figma of the five tabs
- Streak flames, XP, gems, “don’t break the chain”
- A download button or TestFlight
- A face we hired
- A feature that is not in the MVP loop (coach calls, partners, Ask My Life)

---

## Look and voice

Stone floor. Ink for words. Forest for the ask. Cream and moss if a card needs a surface. Same tokens as the app (`FEATURES.md`). The films should feel like the product even when the product is off-screen.

| Layer | Rule |
|---|---|
| Picture | Kinetic type + short lived scenes (kitchen, walk, desk, night window). After Effects craft, AI-made. |
| Type | Few words. One sentence on screen at a time. Not a paragraph. |
| Voice | One consistent spoken voice across the series. Prefer a real read (founder) or the same TTS the product already uses — so the ad sounds like the app. |
| Music | Optional, under the voice. Never louder than the words. Room tone is enough. |
| Caption | Burned in. Assume sound off. Captions are the type, not a second essay. |

ElevenLabs is the *method* (capability as a scene), not the vendor. We are not their look (dark, neon, console). We are stone and forest and a mouth saying the day.

---

## How a film gets made

Discussed, then locked for v1 so we do not shop tools forever.

| Step | Job | v1 tool |
|---|---|---|
| 1. Script | 40–70 words. Hook → one life → land → URL | Written here, in `docs/superpowers/films/` later |
| 2. Picture | Scenes + type motion | Kling for scenes. Type and timing in CapCut. |
| 3. Voice | One take or one TTS voice | Founder phone take, or product TTS if it matches |
| 4. Edit | 15–30s, captions, end card | CapCut |
| 5. Post | Same file, three places | TikTok, Reels, Shorts |

If a clip looks like every other AI habit ad, it fails even if the model was expensive. Re-edit toward fewer cuts, more voice, more stone.

Do not buy After Effects until ten films exist and the list is moving. The craft is the reference. The tool is whatever gets that craft in public this month.

---

## The page

**URL:** `https://get-grounded.app` (apex). `dev.get-grounded.app` stays the API. Do not put a waitlist form on the API host.

**On the page, in this order:**

1. The sentence: *You don’t tap a list. You say the day.*
2. One line of proof: *Speak the morning. Live the day. Tell the truth at night.*
3. Email field + forest button: **Get early access**
4. One quiet line: *You’re on the list. We open the beta in waves.*
5. Optional: the current hero film, muted, captions on

No feature grid. No screenshot. No App Store badge. No second form.

**After submit:** same page, the button becomes *You’re in line.* No new route required. Confirmation email from the list tool: the sentence, nothing else.

**Stack (locked):**

| Piece | Own or rent | Why |
|---|---|---|
| Page | Own — Cloudflare Pages on the existing zone | Zone is already Cloudflare. Apex belongs to the public, not Cloud Run. |
| List | Rent — Loops | Waitlist + wave invites. Not a newsletter we have to invent. Marketing email is not Postgres. |
| Analytics | Page views + form submits only | No pixel maze. |

Rejected: waitlist rows in GetGrounded Postgres; a form on `dev.get-grounded.app`; Carrd with the wrong stone; Buttondown (fine tool, wrong shape — that’s a letter, this is a line).

Send from a `get-grounded.app` address the same week the page goes up. If Loops cannot authenticate that domain, switch vendor; do not switch the ask.

---

## Channels

Same film, three uploads. Do not native-edit a different story per app.

| Place | Job |
|---|---|
| TikTok / Reels / Shorts | Wide. Anticipation. |
| `get-grounded.app` | The door. Hero film + form. |
| Email to the list | Keep the sentence warm. One letter per new film or per week, not both. |

Out until later: paid ads, Product Hunt, App Store feature pitch, influencer seeding, Discord-as-the-product.

Cadence: batch the first ten before the first public post. Then **two or three a week**, not daily. A dead week of silence is better than a silent kinetic ad that looks like everyone else.

---

## Beta waves

The list is a line. It is not a promise of a date on the film.

| Wave | Who | When |
|---|---|---|
| 0 | You + a handful who will tell the truth | Now, while the loop is still being built. Not public. |
| 1 | First slice of the list | Morning **and** evening both write the book. TestFlight / internal track. |
| 2 | More of the list | They come back the next morning. Recovery does not shame. |
| Store | Anyone | The public sentence matches the product. Then Product Hunt is allowed. |

Invite copy is the same as the film: *You say the day. Here’s the door.* Not *you’ve been selected.*

A waitlist email is not a user. Wave 1 is the first time Firebase and the book exist for them.

---

## Software vs films

Two jobs. Do not mix them in one implementation plan later.

| Job | What it is | Done when |
|---|---|---|
| **Page + list** | Apex site, form, confirmation, DNS | A stranger can join from a URL in a film |
| **Films** | Scripts, picture, voice, post | Ten clips in the can, first three public |

The product repo keeps building the loop. This spec does not add tabs, endpoints, or coach.

---

## Out of this slice

- Showing the real app in a film
- Paid acquisition
- Influencers
- Putting waitlist emails in Postgres
- Launch date on the end card
- Localizing films
- A blog, a changelog, or build-in-public as the main channel

---

## Success (so we do not chase views)

Views are fuel. They are not the score.

| Signal | Means |
|---|---|
| List joins per film | The door works |
| % of list who open the invite | Anticipation survived |
| % of wave 1 who speak a morning in seven days | The sentence was true |
| Unsubscribes after a film | The hook lied |

A million views and a quiet list is a failed film. A small list that speaks is the machine working.
