# Tori feedback — 2026-09-03 triage

Source: Tori Patterson, email "Re: Phase 3 Follow-Up!", 2026-09-03 14:44 UTC, 8 screenshots.
Branch: `claude/tori-call-feedback-20260903`. Not deployed.

## Done on this branch

| # | Her note | Change |
|---|---|---|
| 1 | Replace the home tagline | `app/page.tsx` — now "A space to promote yourself, have others help promote you, advertise your movement, and let people know what you are doing. A space to connect, a space to build, a space to keep in touch." |
| 2 | "Find the signal…" → "Stay connected with the world. Move the industry forward." | `app/page.tsx` visual-story heading |
| 3 | Community: "Find out what the cannabis WORLD is working on now!" | `app/community/page.tsx` h1 |
| 4 | Explore: "Stay in signal with how other states are moving. Browse the movement." | `app/explore/explore-client.tsx` market switcher heading |
| 5 | Create: keep using the word WORLD | `app/create/page.tsx` h1 |
| 6 | "Freeze the search bar so you don't work your way to the top" | Community feed toolbar (market, layout, favorites) is now `position: sticky` |
| 7 | "What if we did Fivr style and aligned them up, five posts to a row?" | Added a third layout, **Aligned rows** — 5-up on desktop, 3/2/1 down the breakpoints. Visual News and Classic Feed are unchanged, so all three can be compared side by side before she picks a default. |

Her exact punctuation was softened in two places only: the apostrophe in "what you're doing" and the trailing "!" on the Community heading, both to match existing sentence-case headings. Say the word and they go back verbatim.

## Needs a decision from her — not built

- **Default Community layout.** Still the open D-item. Now a three-way choice, not two.
- **White / lighter Community page.** She asked "Perhaps this page is white and easier to read? I wonder!" — a theme flip is not a guess to make silently.
- **Brighter, more enticing photography** on the home cards and Community intro; "sneak peeks" of the newsfeed, search, and a profile lower on the home page. Needs real art direction and assets, not placeholder swaps.
- **B2B "go up against the world as a unit"** — she says herself she is unsure what it looks like.

## Real scope, not this branch

These are new product surface, and several sit in milestones that are not accepted or paid:

- **Repost / follow with hidden follower counts, analytics visible only to the owner.** This is the Early Engagement Layer — contract **Milestone 5**.
- **Advertising and boost slots** ("sell those as advertising slots", "pay for a front page boost"). Paid placement and subscriptions are on the **Section 10 exclusions** list. Building it moves an excluded item onto the client's review URL. Do not start without a written change.
- **AI assist for making content.** New feature, no milestone, no estimate.
- **Groupon / Myspace / Fiverr posting modes** (dispensary deals, brand drops public vs B2B private, service listings). This is Milestone 4 Directory MVP plus Milestone 5, i.e. **$13,500 + $4,500** of unsigned scope.

## Standing gate

Milestone 2 is live but unsigned and Milestone 3 is awaiting merge. Her route-by-route accept/revise is still the thing that unblocks payment, and this email is enthusiasm rather than a dated acceptance. Ask for the five route decisions in writing on this call.
