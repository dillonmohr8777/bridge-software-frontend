# Bridge frontend integration pipeline

This repository is the live Bridge frontend source for Greencubes API integration.

Live production at the time of this handoff was the age-gate Next.js app deployed to `https://bridge-connected-signal.netlify.app` from commit `7a3e611` (`codex/restore-age-gate-2026-08-21`).

## Ownership

- Dillon owns canonical frontend and UX.
- Greencubes owns backend APIs and wiring those APIs into this frontend.
- Do not restyle the product or replace screens while integrating.

## Branches

| Branch | Purpose | Netlify |
| --- | --- | --- |
| `development` | Daily integration work | Auto-deploys to the preview site |
| `production` | Approved releases | Auto-deploys to live `bridge-connected-signal` |

Default branch is `production`.

## Workflow

1. Create feature branches from `development`.
2. Push to `development` for an automatic preview deploy.
3. Review and test on the preview URL.
4. Open a pull request into `production` only after Dillon and the client approve the preview.
5. Merge to `production` to auto-deploy live.

## URLs

- Production: https://bridge-connected-signal.netlify.app
- Production admin: https://app.netlify.com/projects/bridge-connected-signal
- Preview: https://bridge-connected-signal-dev.netlify.app
- Preview admin: https://app.netlify.com/projects/bridge-connected-signal-dev
- Source: https://github.com/dillonmohr8777/bridge-software-frontend

## First integration target

Wire Milestone 3 APIs (auth, RBAC, registration, login, verify, reset, EIN intake, admin verification queue) into the existing screens, starting with `/join` and login. Keep the current visual design.
