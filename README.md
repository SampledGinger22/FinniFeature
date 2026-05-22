# Finni Patient CRM

A provider-facing patient management dashboard for ABA (Applied Behavior Analysis) care
practices. Built to make one thing effortless: finding the right patients fast — answering
questions like *"who are all my patients in intake who live in New York and are under 30?"*
in two clicks.

> **Status:** demonstration build. This is a foundation designed to be iterated on, not a
> throwaway. Architecture decisions were made as if for a real system. It implements
> HIPAA-*aware* patterns but makes no claim of HIPAA certification (see
> [Compliance](#compliance--privacy)).
>
> **Trademark:** "Finni", the Finni name, and the Finni logo are the property of Finni Health —
> not of the repository author (Mason Britsch). This is an independent, unaffiliated
> demonstration project, not endorsed by or affiliated with Finni Health (see
> [Trademark & attribution](#trademark--attribution)).

---

## What it does

- **Two views of one caseload** — card (warm, photo-forward) and table (dense, sortable) —
  sharing the same data, filters, and sort. (A board/kanban view was prototyped and removed.)
- **Compound filtering** — filter by status, location, age, and insurance simultaneously
  with live result counts, plus a shared order-by. This is the hero feature.
- **Full patient management** — create (bottom drawer), edit (right drawer), archive,
  soft-delete with a 30-day recovery window.
- **Six-stage lifecycle** — Inquiry → Waitlist → Onboarding → Active → Paused → Churned.
- **"Your day" view** *(in progress — hidden in this build)* — a care-forward overview of
  who needs attention, leading with people rather than metrics.
- **Personalization** — font size, font family (including a dyslexia-friendly option), a
  reduced-eye-strain palette, layout density, and timezone — persisted per device.

A fuller, non-technical description is in [`.docs/01-product-brief.md`](.docs/01-product-brief.md).

---

## Tech stack

| Layer | Choice |
|---|---|
| Language | TypeScript (strict) |
| Frontend | Vite + React, Ant Design + antd-style, atomic design |
| Server state | TanStack Query · Global UI state: Zustand · Local: useState/useReducer |
| API | Vercel serverless functions over a service/repository layer |
| Validation | Zod (shared schemas, inferred types) |
| Database | Vercel Postgres (Neon) via Drizzle ORM |
| Dates | dayjs, centralized in `DateTimeUtil` |
| Logging | Winston (with PHI redaction) |
| Tests | Vitest + React Testing Library (unit/component) · Playwright (E2E) |
| Monorepo | Turborepo + Bun workspaces |

The authoritative architecture is [`.docs/02-technical-spec.md`](.docs/02-technical-spec.md).

---

## Repository layout

```
.
├─ CLAUDE.md                 # AI-assisted development rules (loaded every session)
├─ .docs/                    # specs, decision log, changelog
├─ .claude/                  # committed agents, skills, and hooks (enforcement travels with the repo)
├─ packages/shared/          # @finni/shared — types, enums, Zod schemas, DateTimeUtil (single source of truth)
├─ apps/web/                 # @finni/web — Vite + React frontend
├─ apps/api/                 # @finni/api — serverless functions + service/repository layers
└─ docker/                   # local Postgres for dev parity
```

---

## Running locally

> Prerequisites: Bun, Node 20+. Docker is **optional** (only for a persistent local Postgres).

**Zero-config (recommended for a demo):**

```bash
bun install
bun run dev          # web + API; the API boots an in-memory pglite, seeded on startup
```

`bun run dev` needs no database, secrets, or Docker — the API spins up an in-process pglite
and seeds it on boot, and Vite proxies `/api` to it. Open the printed localhost URL.

**Optional — a persistent Postgres (Docker):**

```bash
docker compose -f docker/docker-compose.yml up -d        # Postgres on host port 5434

# from apps/api, with DATABASE_URL + PHI_ENCRYPTION_KEY set (see .env.example):
cd apps/api
bun run db:migrate   # apply versioned migrations from drizzle/
bun run seed         # seed realistic demo data
```

Point `DATABASE_URL` at that Postgres (or a Neon instance) and `bun run dev` uses it instead
of pglite. The seed is deterministic — the same realistic caseload every run, spanning all
six statuses and multiple US states so the location and age filters have signal.

**Schema changes:** edit `src/db/schema.ts`, run `bun run db:generate` to write a new
migration under `drizzle/`, commit it, then `bun run db:migrate` applies it. `db:push` syncs
the schema directly for throwaway prototyping only — it is not the deploy path. Deployment runs
`db:deploy` (migrate, then seed only if the database is empty) automatically — see DECISIONS D61.

### Demo controls
A clearly-separated "Demo controls" area lets a reviewer reset state: **purge** expired
deletions (the real lifecycle behavior, made visible), **reseed** fresh data, or go to a
**blank slate** to see how the app handles an empty caseload. These would not exist in a
production build.

### Tests
```bash
bun run test                       # Vitest unit + component (all packages, via turbo)
cd apps/web && bun run test:e2e    # Playwright end-to-end (boots the zero-config dev servers)
```

---

## Why it's built this way

This project began from a deliberately vague brief — four patient fields, four statuses,
"build a web app." That vagueness was intentional on the company's part: it tests whether
an engineer can assess an ambiguous spec and iterate sensibly. The decisions below are the
result of that work. Each is recorded in full, with rationale, in
[`.docs/DECISIONS.md`](.docs/DECISIONS.md); the running record of changes is in
[`.docs/CHANGELOG.md`](.docs/CHANGELOG.md).

A few decisions worth surfacing here, because they show the reasoning rather than just the
result:

**Scope was chosen, not assumed.** The brief's clarifications removed billing, sales
pipeline, and required scheduling, and named patient-management UX as the thing being
evaluated. So the product is built around the compound-filter question, and deferred
features are *documented* as next-iteration work rather than half-built. Scoping wide and
then deliberately narrowing is itself the product-thinking signal.

**The status field drove the design.** Four statuses in a brief is really a patient
lifecycle. The model added **Waitlisted** and **Paused** to the given four — not invention
for its own sake, but because real ABA practices live in those states (long waitlists are
endemic to the field; patients routinely pause for travel, insurance, or medical reasons).
The extension is recorded as a deliberate read of the domain, not a guess.

**Architecture was chosen for iteration, not just the demo.** Normalized tables, a
service/repository layering, field-level PHI encryption, soft-delete with a recovery
window, and UTC-everywhere date handling are more than a four-field demo needs — but they
are the correct baseline for the system this is meant to grow into. The headline filter
query crosses a join; that cost is paid down deliberately with a composite index and
indexed location/age columns rather than avoided by denormalizing.

**Consistency is enforced, not hoped for.** The conventions — typed-everything, aliased
import paths, globally unique names, token-only styling, centralized date handling — are
enforced by ESLint and committed Claude Code hooks, so they hold under speed and across
parallel work rather than depending on vigilance. The reasoning is in
[`.docs/03-agent-skill-hook-proposal.md`](.docs/03-agent-skill-hook-proposal.md).

**The design borrows Finni's warmth, adapted for daily use.** The palette is derived from
Finni's own brand variables, then dialed for a management app a provider stares at for
hours — restrained saturation, calmer neutrals, tighter density — rather than carried over
at marketing scale. The guiding thesis throughout is care for the *provider*, not just
administration.

> *This section is pre-seeded from the decision log. At v1 it will be expanded with the
> decision timeline reconstructed from commit history — the order in which things were
> built and the reasoning captured in each commit message.*

---

## Compliance & privacy

This build implements **HIPAA-aware patterns** because they are the right foundation for a
system meant to handle real patient data — but it is **not HIPAA-certified** (certification
requires Business Associate Agreements, audited hosting, and access controls beyond a demo's
scope). What is implemented: encryption at rest, field-level encryption on PHI columns, no
PHI in logs or client-side storage, scoped queries that never leak hidden records by
default, soft deletion, and audit-log scaffolding. Details in the technical spec, §11.

---

## Accessibility

Targets WCAG 2.1 AA: keyboard navigation, focus management in drawers, screen-reader
labeling on the caseload views, and verified contrast on both the default and
reduced-eye-strain palettes. A dyslexia-friendly font and adjustable font sizing are
available in settings.

---

## Trademark & attribution

"Finni", the Finni name, the Finni logo, and the Finni brand identity are trademarks and the
property of **Finni Health** — not of the repository author (Mason Britsch). The logo asset
(`apps/web/src/assets/brand/finni-logo.svg`) and the brand-derived color palette are included
solely to present this demonstration in its intended product context.

This project is an **independent, unaffiliated demonstration build** — not endorsed by,
affiliated with, or sponsored by Finni Health. All other product names, logos, and brands are
the property of their respective owners.
