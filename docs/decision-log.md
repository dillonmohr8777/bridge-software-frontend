# Bridge decision log

## Phase 2 scope reconciliation — 2026-08-15

| Item | Current status | Evidence boundary |
|---|---|---|
| Community default | Unresolved; News Grid is Dillon's recommendation and Classic remains available for comparison | Tori's written choice is still required |
| MVP feed behavior | Basic chronological/non-algorithmic | Later scope alignment narrowed the MVP; no ranking system is approved |
| Approved MVP roles | Brands, retailers, dispensaries, sales representatives, and administrators | Final claim names and permissions require Miraj confirmation |
| Public/member/business fields | Working matrix only | Tori must approve exact fields; Miraj must confirm enforceable projections |
| Vendor visibility | Deny protected fields by default | Relationship-based access remains an unresolved product/legal/technical decision |
| Private Bridge League/rewards | Future scope | Interest or discussion is not written approval |
| Expanded live directories | Future scope/change order | Sample search and filters do not promise a production directory dataset |
| Subscriptions and payments | Future scope/change order | Pricing discussion is not an approved build requirement |
| Marketplace or ordering | Future scope/change order | MVP may use external links only |
| HR functionality | Future scope/change order | Requires separate discovery and privacy/legal review |

No unresolved item in this table is an approved decision.

## Confirmed from written history

| Decision | Status | Evidence/owner |
|---|---|---|
| Product is a browser-based web application | Confirmed | Proposal and Miraj email |
| Working backend is Supabase/PostgreSQL | Confirmed direction | Miraj/proposal; final integration design pending |
| AI-assisted development includes Claude and Cursor | Confirmed | Miraj email/proposal |
| Dillon owns front-end/UX/product-structure contribution | Confirmed | Email, Slack role discussion, execution plan |
| Next.js + React + TypeScript is the recommended front end | Team-aligned working decision | Dillon's Slack explanation; Miraj replied that he understood |
| Product name changed from The Ecosystem to Bridge | Confirmed | Tori email, 2026-06-07 |
| Tori has or had a Claude-built prototype | Confirmed, not delivered | Tori/Slack references |

## Provisional decisions made for this prototype

| Decision | Why it was made | Approval needed |
|---|---|---|
| Trusted Current is the default visual direction | Best balance of credibility, distinctiveness, and category restraint | Tori |
| Simplified bridge mark | Enables realistic layouts without implying a final logo | Tori / brand process |
| Retailer and dispensary are shown as separate roles | Both appear in project language | Tori + Miraj |
| Contact starts as a structured request | Matches scope and protects private details without adding direct messaging | Tori + Miraj |
| Verification uses explicit pending/verified/attention states | Makes admin and member UX testable | Compliance definition needed |

## Provisional decisions made during Phase 1 defect repair (2026-07-11)

All Phase 1 work repaired existing defects without pre-approving product or brand choices. These implementation assumptions need review, not the underlying scope:

| Decision | Why it was made | Approval needed |
|---|---|---|
| Mobile navigation uses a disclosure menu button in the header | Navigation disappeared entirely below 980px; disclosure pattern is the smallest accessible repair | Dillon (UX) |
| Every directory member resolves to `/profile/[slug]` from typed mock data | Every card previously linked to Cascade Canna, which would mislead the walkthrough | Dillon (UX); fictional profile copy is placeholder only |
| Contact request submission uses a typed mock adapter (`lib/contact.ts`) with simulated pending/success/error | The route's required states were untestable with an inert button; the adapter shape is a proposal for Miraj, not a contract | Miraj (contract), Tori (flow) |
| Join step 1 shows role-specific requirement copy from a typed map | The static preview showed organization/EIN fields for every role, including sales reps | Tori/Miraj/compliance (D-03); copy labeled provisional in the UI |
| Non-functional controls are disabled with a visible reason instead of looking active | Dead active-looking buttons read as broken in a client demo | Dillon (UX) |
| Direction-card swatches were corrected to the hexes the themes actually apply | The cards showed colors that differ from what previewing applies, which would distort Tori's comparison | None — consistency fix; Tori still chooses the direction |
| Fictional data is labeled in place on landing, directory, dashboard, and admin | Prototype metrics could be mistaken for production data in the meeting | None — required by build spec |
| One Netlify staging link per provisional direction (`bridge-preview-current` / `-network` / `-botanical` .netlify.app) | Lets Tori compare the three directions side by side on real flows; each build is pinned via `NEXT_PUBLIC_DIRECTION_LOCK`, labeled "Provisional preview", and marked noindex | None for the demo tooling; Tori still owns the direction choice (D-01) |
| Directory search matches ANDed word-prefix tokens across name/location/role/serving/description/specialties, with US state abbreviations expanding to state names (`lib/search.ts`) | "Erie, PA" returned 0 results on staging: the old matcher required the whole query as one literal substring and ignored the serving field; whole-network search itself still requires the backend | Miraj — confirm as the server-side search contract at gate B |
| Sample network expanded to 10 fictional profiles across more roles and markets, including Erie and Pittsburgh, PA | Natural demo queries should return results; target launch states are unknown (open D-07), so markets are placeholders re-seeded once Tori names them | Tori/Melissa — D-07 decides the real market list |
| Directory empty state echoes active constraints, offers clear actions, shows near-filter matches, and states the prototype searches sample data only | A zero-result search looked broken and implied a live network exists | None — required-state coverage per build spec |

## Open decision register

| ID | Question | Decision owner | Needed by |
|---|---|---|---|
| D-01 | Is Trusted Current, Modern Network, or Botanical Ledger the best starting direction? | Tori | Monday |
| D-02 | Are retailer and dispensary distinct account types? | Tori/Miraj | Data model lock |
| D-03 | What exact evidence is required per role? | Tori/Miraj/compliance | Verification build |
| D-04 | What does the public “Verified” label promise? | Mac/Tori/compliance | Copy approval |
| D-05 | Which profile/contact fields are public, member-only, or private? | Tori | Schema/API lock |
| D-06 | Is AWS a hard hosting requirement or a proposal-level direction? | Miraj/Mac | Architecture review |
| D-07 | What is the first geographic market and priority user role? | Tori/Melissa | Launch plan |
| D-08 | Who approves design and scope between live sessions? | Tori/Mac | Monday close |
