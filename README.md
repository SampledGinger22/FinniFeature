# Finni Patient CRM

A provider-facing patient management dashboard for ABA (Applied Behavior Analysis) care
practices. Built to make one thing effortless: finding the right patients fast — answering
questions like *"who are all my patients in intake who live in New York and are under 30?"*
in two clicks.

> **Status:** demonstration build. This is a foundation designed to be iterated on, not a
> throwaway. Architecture decisions were made as if for a real system. It implements
> HIPAA-*aware* patterns but makes no claim of HIPAA certification (see
> [Compliance](#compliance--privacy)).

---

## What it does

- **Three views of one caseload** — card (warm, photo-forward), table (dense, sortable),
  and board (kanban by status, drag to move) — all sharing the same data and filters.
- **Compound filtering** — filter by status, location, and age simultaneously with live
  result counts. This is the hero feature.
- **Full patient management** — create (bottom drawer), edit (right drawer), archive,
  soft-delete with a 30-day recovery window.
- **Six-stage lifecycle** — Inquiry → Waitlisted → Onboarding → Active → Paused → Churned.
- **"Your day" view** — a care-forward overview of who needs attention, leading with people
  rather than metrics.
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
| Drag & drop | dnd-kit |
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

> Prerequisites: Bun, Docker (for local Postgres), Node 20+.

```bash
# 1. Install
bun install

# 2. Start local Postgres
docker compose -f docker/compose.yml up -d

# 3. Apply schema + seed realistic demo data
bun run db:migrate
bun run db:seed

# 4. Run the app (frontend + API)
bun run dev
```

The seed data is deterministic — the same realistic caseload every run, spanning all six
statuses and multiple US states so the location and age filters have signal.

### Demo controls
A clearly-separated "Demo controls" area lets a reviewer reset state: **purge** expired
deletions (the real lifecycle behavior, made visible), **reseed** fresh data, or go to a
**blank slate** to see how the app handles an empty caseload. These would not exist in a
production build.

### Tests
```bash
bun run test          # Vitest unit + component
bun run test:e2e      # Playwright end-to-end
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
