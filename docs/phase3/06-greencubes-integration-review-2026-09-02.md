# Greencubes integration review — 2026-09-02

Independent review of the Greencubes (Miraj) work delivered on 2026-09-02, covering
`origin/feature/admin-login` and the live backend at `bridge-software-backend.onrender.com`.

- Branch reviewed: `origin/feature/admin-login` @ `fde9cf0`
- Base: `origin/development` @ `6d7aed6`
- Commits in scope: `93ba32b`, `a409d97`, `436203a`, `9f5fa49`, `fde9cf0`
- Diff: 32 files, +830 / −313
- Reviewed against `docs/INTEGRATION-API-CONTRACT.md` and `docs/INTEGRATION-PIPELINE.md`

**Verdict: do not merge to `development` yet.** The backend is genuinely well built and
clears the security bar that was set on 2026-08-31. Three items block the merge, and the
first is a governance question only Dillon can answer.

---

## What was verified as working

### Backend (verified live, unauthenticated probes)

| Check | Result |
|---|---|
| `GET /api/v1/health` | `200` `{"status":"ok","service":"bridge-api"}` |
| `GET /api/v1/admin/users` unauthenticated | `401 UNAUTHORIZED` |
| `GET /api/v1/admin/verification-queue` unauthenticated | `401 UNAUTHORIZED` |
| `GET /api/v1/auth/me` unauthenticated | `401 UNAUTHORIZED` |
| Same three routes with a forged `Bearer` token | `401 UNAUTHORIZED` |
| `POST /api/v1/auth/login` with bad credentials | `401 INVALID_CREDENTIALS` |

**Server-side RBAC is real.** The 2026-08-31 requirement — "enforce admin access through
backend RBAC, not only by hiding the route on the frontend" — is met. Admin routes reject
both missing and forged tokens at the server.

CORS is configured correctly for a credentialed design:

- `Access-Control-Allow-Origin: https://bridge-connected-signal.netlify.app` — a specific
  origin, not `*`, exactly as the contract requires
- `Vary: Origin`
- `Access-Control-Allow-Headers: Authorization,Content-Type`
- `Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS`

Response security headers are strong: HSTS (`max-age=31536000; includeSubDomains`), a
restrictive CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`,
`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`,
`X-Frame-Options: SAMEORIGIN`. Errors use a consistent `{error, message}` envelope.

### Frontend gates

| Gate | Result |
|---|---|
| `npm run typecheck` | **pass** |
| `npm run lint` | **pass** |
| `npm run build` | **pass** — 33 routes compiled |
| `npm run test:phase3` | **fail — 23 pass, 1 fail** |

---

## Blocking

### B1 — Repository identity was rewritten in the canonical repo

`9f5fa49` rewrites the repository pointer in all three project-identity files:

| File | From | To |
|---|---|---|
| `CLAUDE.md` | `dillonmohr8777/bridge-software-frontend` | `getonthebridge0-max/thebridge` |
| `CLAUDE_BUILD_SPEC.md` | `dillonmohr8777/bridge-software-frontend` | `getonthebridge0-max/thebridge` |
| `CLAUDE_SESSION_PROMPT.md` | `dillonmohr8777/bridge-software-frontend` (×2) | `getonthebridge0-max/thebridge` |

`CLAUDE.md` opens with "STOP: verify the Bridge repository first" — a guard that exists
specifically to stop sessions working against the wrong Bridge. Merging this change points
every future session at a different repository.

This may well be intentional: a client-owned repo under the `getonthebridge0-max` account
is a reasonable end state, and that account already holds an admin invitation. But moving
the canonical pointer is a decision about **which repo is authoritative**, not an
integration detail, and it arrived inside a feature branch with no discussion.

**Needs Dillon's decision before merge.** If `getonthebridge0-max/thebridge` is becoming
canonical, that deserves its own commit, a note in `docs/decision-log.md`, and a migration
of the pipeline docs. If it is not, revert these four lines.

### B2 — The branch fails the existing test suite

```
not ok 23 - http client sends credentialed requests to the versioned API origin
# tests 24  # pass 23  # fail 1
```

`lib/phase3/phase3.test.ts:306` asserts `requestInit?.credentials === "include"`. It now
receives `undefined`, because `fde9cf0` commented out `credentials: "include"` in
`lib/phase3/http-client.ts`.

`CLAUDE.md` lists `npm run test:phase3` first among the required commands and states that a
change is not complete until the gates pass. This is a real regression in the Phase 3
adapter, not a stale test — the assertion still describes the contract as written.

### B3 — Bearer-token switch was never flagged as a contract change

`docs/INTEGRATION-API-CONTRACT.md:29` states the adapter sends `credentials: include` so
cookie sessions work. Line 37 is explicit:

> If Greencubes uses bearer tokens instead, **flag that contract change before changing the
> frontend client.**

`fde9cf0` ("remove credentials include from HTTP clients") changed the frontend client to a
pure bearer-token model in two files without that flag being raised. The commit message
describes it as a fix; it is an architecture change.

The change is also avoidable in its current form. Because the backend already echoes a
specific origin with `Vary: Origin`, credentialed requests fail only for the want of one
response header — `Access-Control-Allow-Credentials: true`. Adding that header on the
Greencubes side restores cookie support and resolves B2 and B4 together.

---

## Should fix before production

### S1 — Refresh tokens are stored in `sessionStorage`

`lib/auth/storage.ts` persists the whole session — `accessToken` **and** `refreshToken` —
into `sessionStorage` under `bridge_session`. Any XSS on any Bridge page can read both. An
access token is short-lived; a refresh token is the long-lived credential, and it should
not be reachable from JavaScript.

Recommended: move the refresh token to an httpOnly, `Secure`, `SameSite` cookie and keep
only the access token in memory. This needs the `Access-Control-Allow-Credentials: true`
header from B3, and restores `credentials: "include"`, which also fixes B2.

If the pure-bearer design is deliberately kept instead, it is at least internally coherent
(bearer auth is not CSRF-exposed, and no CSRF header is defined), but it should be recorded
as an accepted risk in `docs/decision-log.md` with a short refresh-token TTL and
server-side revocation.

### S2 — Required session claims are missing from `/auth/me`

The contract's "Required session claims" section lists nine claims the server must
authorize from. The implemented `CurrentUser` type carries roughly four:

| Contract claim | Present in `/auth/me`? |
|---|---|
| `userId` | yes (`id`) |
| `role` | partial — `platformRoles` plus per-org `role` |
| `organizationId` | yes, via `memberships` |
| `ageEligible` | **missing** |
| `membershipStatus` | **missing** |
| `organizationVerificationState` | **missing** |
| `delegatedPermissions` | **missing** |
| `stateLicenseEligibility` | **missing** |
| `adminScope` | **missing** |

Age eligibility matters here: Bridge runs a 21+ age gate, and the frontend currently has no
server-authoritative signal for it. Verification state and membership status gate the
product's core flows. These need to land before the verification and publishing slices.

### S3 — The auth layer has no mock-mode fallback, so `/login` breaks in the default config

`lib/auth/api.ts` computes its base once at module scope:

```ts
const configuredBase = process.env.NEXT_PUBLIC_BRIDGE_API_BASE?.replace(/\/$/, "") ?? "";
const apiBase = configuredBase.endsWith("/api/v1") ? configuredBase : `${configuredBase}/api/v1`;
```

`CLAUDE.md` documents the repo as "in-memory by default; live `/api/v1` only when
`NEXT_PUBLIC_BRIDGE_API_BASE` is set", and `lib/phase3/client.ts` honours that by selecting
the in-memory adapter. The new auth layer has no such branch: with the variable unset,
`apiBase` collapses to the relative `/api/v1`, so `/login` posts to the Netlify origin
itself, 404s, and surfaces the generic "The request could not be completed."

Anyone running the documented `npm run dev` gets a login screen that cannot work and does
not say why. Either give the auth layer the same in-memory fallback, or fail loudly at
startup when the variable is missing.

### S4 — Contract shape is inconsistent between endpoints

`/auth/me` returns `platformRoles: "admin"[]` (plural array, and typed so narrowly that
`"admin"` is the only representable value). `/admin/users` returns
`platformRole: string | null` (singular, open string). Same concept, two shapes, two names.
Pick one before more code depends on either.

---

## Minor

| # | Item | Detail |
|---|---|---|
| M1 | Dead code | `credentials: "include"` is commented out rather than removed in `lib/auth/api.ts` and `lib/phase3/http-client.ts`. Whichever way B3 resolves, do not leave it commented. |
| M2 | `next-env.d.ts` edited | Changed `./.next/types/` → `./.next/dev/types/`. The file says "should not be edited"; this is dev-server output. Build passes, but it should not be committed. |
| M3 | Lockfile drift | `package-lock.json` shows 90 deletions / 0 insertions, stripping `libc: ["glibc"]` from optional platform deps — the signature of `npm install` on an older npm than the one that generated the lockfile. Revert and re-run with the project's npm. |
| M4 | `netlify.toml` | Trailing newline removed for no reason. |
| M5 | `app/layout.tsx` formatting | `<AuthProvider><AgeGate>` and `</AgeGate></AuthProvider>` collapsed onto single lines, against surrounding style. |
| M6 | Commit hygiene | `93ba32b`, `a409d97`, `436203a` share the identical message "Complete admin login implementation". Squash before merge. |
| M7 | Auth runs on public pages | `AuthProvider` now wraps `AgeGate` at the root, so every public page mounts the provider and issues a `/auth/me` call when a session exists. Intentional is fine; worth confirming it is. |

---

## What Greencubes should be asked for

1. A decision on B1 — is `getonthebridge0-max/thebridge` the canonical repo, or should the
   pointer be reverted?
2. `Access-Control-Allow-Credentials: true` on the API, which unblocks B2, B3 and S1
   together — or an explicit, recorded decision to stay on pure bearer tokens.
3. The remaining session claims in S2, with the age-eligibility signal prioritised.
4. The route table and request/response examples for the endpoints now in use:
   `/auth/register`, `/auth/login`, `/auth/me`, `/auth/forgot-password`,
   `/auth/reset-password`, `/auth/resend-verification`, `/admin/users`,
   `/admin/verification-queue`. The contract still lists these as "to confirm".
5. Access-token TTL and the refresh/rotation policy.
6. Confirmation that `/api/v1` is stable as the versioned prefix on the staging origin.

## Reviewer notes

Product approval for Steps 2 and 4 remains with Melissa and Tori and is unchanged by this
review. Nothing in this branch has been merged or promoted. The backend security posture is
the strongest part of this delivery and should be acknowledged as such — the blocking items
are a governance question, one broken test, and one undeclared contract change, all of which
are cheap to resolve.
