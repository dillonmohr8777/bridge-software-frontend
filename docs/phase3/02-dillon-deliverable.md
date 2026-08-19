# Dillon Phase 3 deliverable — Promotion + protected profile

**Date:** 2026-08-19  
**Status:** FRONTEND SLICE COMPLETE — internal review only. Do not Slack, email Tori/Melissa/Mac/Miraj, or update Netlify until Dillon asks.  
**PR:** https://github.com/dillonmohr8777/bridge-discovery-prototype/pull/6

This is Dillon's frontend lock for the contracted Phase 3 vertical slice: targeted Promotion create plus protected profile projection, on the existing Phase 1/2 five-route Connected product. It is not a new app, not the Kimi suite, and not Trusted Current navy/teal. It is not Tori formal brand acceptance and not Miraj's live `/api/v1` bind.

Visual default: Connected purple (ink `#17152D`, electric violet `#6556E8`, coral `#D95848`, canvas `#F7F6FB`). Product inventory from the 2026-08-16 actual-work report remains: Home, Community News, Create, My Profile, Explore; legacy Studio/Business/Signal redirects; Phase 1 directory, join, profile, dashboard, admin, contact, and search.

## What shipped

| Surface | Journey | What to demo |
|---|---|---|
| `/create` | C | Promotion, upload intent on file select, PNG/JPEG/WebP/PDF ≤25MB, audiences, protected detail strips Adults 21+, publish blocked with no audience or empty message, preview access level, persisted posts |
| `/my-profile` | D | First-login vs 90-day copy, sales + accounting in B2B, edit then save, confirm cycle, Public hides contacts and protected promotions, no EIN |
| `/design-system` | Production rules | Six mutation states using existing tokens/classes |
| `lib/phase3/` | Contract | Claims, upload intent, posts, projections, contact update/confirm, mock + HTTP clients |

## Demo script

1. Open `/create` as Harbor Dispensary (in-memory adapter).
2. Attach a PNG. Confirm upload intent is requested before Publish.
3. Enable protected wholesale detail. Adults 21+ is removed and labeled.
4. Publish. The record appears under Persisted promotions.
5. Adapter controls: simulate a network failure, then retry. Toggle unverified organization and confirm publish is forbidden.
6. Open `/my-profile` B2B. Edit a contact, save, then confirm. Copy should switch from first-login to recurring 90-day.
7. Switch Public view. Contacts disappear. Protected promotions disappear. No EIN.

## How to verify

```bash
npm run test:phase3
npm run typecheck
npm run lint
npm run build
```

Local UI: `npm run dev` then `/create` and `/my-profile`.

## Gated on purpose

- Live `NEXT_PUBLIC_BRIDGE_API_BASE` — wait for Miraj repository, branch, commit, and staging URL
- Netlify update of https://bridge-connected-signal.netlify.app
- Slack or client send
- Tori written accept/revise on the five Phase 2 routes
- Nationwide directories, ranking, subscriptions, in-platform ordering, EIN docs, production auth UI

Proposed HTTP paths (`GET /api/v1/session`, `POST /api/v1/uploads/intent`, `POST|GET /api/v1/posts`, `GET /api/v1/profiles/current`, `POST /api/v1/contacts/confirm`, `PATCH /api/v1/contacts`) are a frontend proposal, not Miraj-confirmed.
