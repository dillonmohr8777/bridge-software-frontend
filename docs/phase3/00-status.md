# Phase 3 — Promotion + protected profile slice

**Opened:** 2026-08-19  
**Status:** IN PROGRESS — typed contract, mock adapter, and Create / My Profile journeys are implemented. Live `/api/v1` bind waits on Miraj's inspectable staging origin.

## Why this is Phase 3 now

Phase 2's five-route Trusted Current frontend is technically complete and live. The next contracted product/UX lane is Phase 3: productionize the first vertical slice against typed claims, upload intent, audience persistence, and profile projections.

Locked slice for this implementation:

1. Targeted **Promotion** creation
2. **Protected profile projection** plus 90-day contact confirmation

Out of this slice: nationwide live directories, algorithmic ranking, subscriptions/payments, in-platform ordering, EIN document handling, production auth UI.

## Adapter contract

Default: in-memory `MockPhase3Client`.  
Live bind: set `NEXT_PUBLIC_BRIDGE_API_BASE` to Miraj's versioned origin. The HTTP client then calls:

| Behavior | Method | Path |
|---|---|---|
| Session claims | GET | `/api/v1/session` |
| Upload intent | POST | `/api/v1/uploads/intent` |
| Persist post | POST | `/api/v1/posts` |
| Profile projection | GET | `/api/v1/profiles/current?view=public\|protected` |
| Confirm contacts | POST | `/api/v1/contacts/confirm` |

Those paths are the frontend proposal from the Phase 2 Miraj handoff. They are not accepted as Miraj's final routes until he returns repository, branch, commit, and staging evidence.

## Claims required

`userId`, `ageEligible`, `membershipStatus`, `organizationId`, `organizationVerificationState`, `role`, `delegatedPermissions`, `stateLicenseEligibility`, `adminScope`.

Promotion create requires an active membership, a verified organization, and `create_promotion`. Protected projection requires `view_protected_profile`. Contact confirmation requires `confirm_contacts`.

## Server rules the UI now shares

- PNG / JPEG / WebP / PDF, 25 MB max
- Protected wholesale detail cannot target Adults 21+
- Publish requires at least one remaining eligible audience
- Public projection never includes sales/accounting contacts
- Confirmation records actor, time, and next-due (+90 days)

## Verification

```bash
npm run test:phase3
npm run typecheck
npm run lint
npm run build
```

Do not deploy this slice to the unified review URL until Dillon approves the Netlify update. Do not bind a live API origin without Miraj's inspectable staging URL.
