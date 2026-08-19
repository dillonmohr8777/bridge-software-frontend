# Bridge discovery prototype

A decision-ready front-end prototype for Monday's product session with Tori. It is built in Next.js, React, and TypeScript and uses mock data only.

> **Project identity:** This is the Bridge software-development project for Tori's cannabis-industry professional network. It is not Bridge of Hope OTC, an SEO audit, or the user's general client-meeting workspace. Claude should read `CLAUDE.md` before using external memory or asking discovery questions.

## Starting a Claude session

Connect Claude to the public GitHub repository `dillonmohr8777/bridge-discovery-prototype`, then paste the prompt in `CLAUDE_SESSION_PROMPT.md`. Claude should confirm the repository, branch, and current commit before planning or editing. The complete implementation order, approval gates, route requirements, backend boundary, test plan, and definition of done are in `CLAUDE_BUILD_SPEC.md`.

## What is included

- Responsive landing and directory experiences
- Working search, role, and verification filters
- Role selection/onboarding direction
- Member profile and permission-based contact request
- Brand dashboard
- Admin verification queue
- Three switchable visual directions
- Provisional brand kit and reusable design-system page
- Monday meeting package, product definition, evidence audit, and Claude workflow

## Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`. Important routes:

- `/create` — Phase 3 targeted Promotion slice
- `/my-profile` — Phase 3 protected profile projection
- `/directory`
- `/join`
- `/profile/cascade-canna` (any member: `/profile/<slug>`)
- `/dashboard`
- `/admin/verification`
- `/directions`
- `/design-system`

## Staging previews (one link per direction)

Three static, direction-pinned copies of this prototype are hosted for side-by-side comparison. Each hides the theme switcher, labels itself "Provisional preview", and sends `noindex`; none is an approved identity.

- Trusted Current — https://bridge-preview-current.netlify.app
- Modern Network — https://bridge-preview-network.netlify.app
- Botanical Ledger — https://bridge-preview-botanical.netlify.app

Rebuild all three with `./scripts/build-staging.sh` (outputs to `staging/<direction>/`), then redeploy each folder to its Netlify site (zip deploy via the Netlify API, or drag-and-drop in the Netlify UI).

## Status and boundaries

Phase 3 is open on the Promotion + protected-profile slice. `/create` and `/my-profile` use typed claims, upload-intent, post, and projection adapters in `lib/phase3/`. The default adapter is in-memory. A live `/api/v1` bind requires `NEXT_PUBLIC_BRIDGE_API_BASE` plus Miraj's inspectable staging origin.

There is still no production Supabase session, email delivery, or real license verification. All profiles and metrics are fictional. The brand identity is provisional.

## Verification

```powershell
npm run test:phase3
npm run typecheck
npm run lint
npm run build
npm run build:staging
npm run test:staging
```

`build:staging` creates three direction-pinned static builds under
`staging/current`, `staging/network`, and `staging/botanical`. The verification
command checks the expected routes, provisional label, theme lock, and noindex
metadata before a staging upload. Netlify's three connected projects use the
single-direction commands so each project builds only its assigned preview.
