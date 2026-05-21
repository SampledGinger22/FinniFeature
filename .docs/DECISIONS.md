# Decision Log

> Append-only record of architectural and product decisions, each with the *why*. The
> documentation-sync hook (proposal H3) keeps this current as the code evolves. The v1
> README will draw its "how we got here" narrative from this log plus commit messages.

## Pre-development scoping (seeded from the scoping conversation)

The brief was deliberately vague — per the founder, to test the ability to assess an
ambiguous spec and iterate. The following decisions were made during a structured scoping
pass that resolved conflicts in the original brief and narrowed scope to what is actually
graded (UI/UX and code quality for patient management).

### Scope
- **D1 — Hero feature is compound filtering.** The founder's example query ("intake
  patients in New York under 30") is the rubric. The product is organized around making it
  effortless. Billing, sales pipeline, and appointment-as-requirement were explicitly
  removed by the founder and are documented as next-iteration work, not built.
- **D2 — Scoped wide, then deliberately narrowed.** Comprehensive architecture and docs are
  retained (this is a foundation to iterate on), but the *built* v1 UI is focused on the
  patient-CRM hero plus a "Your day" view. Cut features are listed, not silently dropped —
  the narrowing is the product-thinking signal.
- **D3 — "Your day" view kept in v1.** It carries the care-for-providers thesis. It leans on
  patient status (no appointment data exists yet); calendar-backed scheduling is logged as
  the next step.

### Architecture
- **D4 — Backend as Vercel serverless functions, not Express.** The deploy target is Vercel;
  a long-running Express server fights it. Thin handlers over a service/repository layer
  keep the OOP structure without the server. Docker is local-dev parity only.
- **D5 — Vercel Postgres + Drizzle + Zod.** Free tier, serverless-friendly, idiomatic
  Drizzle; Zod validates the API boundary with types inferred from schemas.
- **D6 — State split:** TanStack Query (server data) / Zustand (global UI) / useState (local).
  TanStack Query delivers the "rapid refresh on edit" requirement; React alone is not a
  state manager.
- **D7 — No auth.** Opens to the dashboard. Therefore preferences persist to localStorage
  (no server-side user to hang them on).
- **D8 — Monorepo (Turborepo + Bun) with a shared `@finni/shared` package** as the single
  source of truth for types, enums, Zod schemas, and DateTimeUtil.

### Domain
- **D9 — Six-status lifecycle.** Shipped the founder's four (inquiry, onboarding, active,
  churned) verbatim and added **waitlisted** and **paused** as informed domain extensions —
  real ABA practice states the vague spec omitted (endemic waitlists; routine pauses).
  Recorded as a deliberate iteration on the spec.
- **D10 — Normalized model:** `patient` → many `address`, many `contact_method`. Chosen over
  denormalization despite the headline query needing a join, because it is the correct
  foundation; the join is covered by deliberate indexing (D12).
- **D11 — UUID v7 primary keys**, app-generated. Time-ordered (index-friendly at scale),
  non-enumerable (no count leakage).
- **D12 — Composite index `(deleted_at, archived, status)`** for the default list query;
  `address.region`/`city` and `patient.date_of_birth` indexed for the location/age filters.
  Every index documented with its reason.
- **D13 — Age is derived, never stored** (`DateTimeUtil.calculateAge`), so card and filter
  never disagree at a date boundary.
- **D14 — Lifecycle states:** `archived` is a boolean (reversible UI-visibility, no timer);
  `deleted_at` is a nullable timestamp (soft delete, 30-day purge). Trade-off noted: if an
  archive-by-date sort is later needed, add `archived_at` then.
- **D15 — Required at creation:** first_name, last_name, dob, ≥1 email, ≥1 address with
  state. Enforced by one shared Zod schema for both form and API. Creation is one atomic
  transaction.
- **D16 — `has_insurance` boolean** with a small card indicator. A display flag, explicitly
  *not* a coverage/billing model (scope boundary).
- **D17 — Contact methods limited to email/phone for v1**; fax/other deferred as a
  schema-safe addition.

### Conventions
- **D18 — `@/` path alias, no `../` traversal; no import aliasing; globally unique names;
  named exports; no `any`; no magic numbers in styles; comments ≤2 lines (what+why).** All
  enforced by lint and/or hooks so they cannot drift.
- **D19 — Enums use the const-object union pattern, not native `enum`** (no runtime JS
  bloat, no unsafe numeric members, no Zod/Drizzle boundary shims).
- **D20 — dayjs centralized in `DateTimeUtil`.** All stored time UTC; rendered in user zone
  (settings → else browser default); DOB is zoneless.

### Design
- **D21 — Palette derived from Finni's real brand variables** (primary `#ed762f`, surface
  `#fbf7f0`, slate `#34415b`, plus their natural supporting hues), adapted for management-app
  density (smaller radii, restrained saturation, neutrals carry surface area).
- **D22 — Primary button is orange with dark ink text.** White-on-orange fails WCAG AA
  (2.90); orange-with-ink passes and keeps Finni's signature color as the hero action.
- **D23 — Six status colors as an intentional progression**, all passing AA, shown against
  both the default and eye-strain palettes.
- **D24 — Retired the skeuomorphic theme** (gradients, inset/text shadows) from the brief's
  `bootstrapTheme.ts` in favor of Finni's clean rounded feel. The mechanism
  (antd-style `createStyles` + `ConfigProvider`) is kept; the aesthetic is replaced.
- **D25 — WCAG 2.1 AA target; per-widget error boundaries + skeleton/empty states**
  promoted to hard requirements.
- **D26 — Avatars:** generated-face seeds + deterministic colored-silhouette fallback, with
  a single `USE_HEADSHOTS` flag to force all to fallback.
- **D27 — Finni's real logo used** (provided by the builder, on-brand for their demo) via a
  `BrandLogo` atom with a neutral fallback.

### Compliance & observability
- **D28 — HIPAA-*aware*, not certified.** Field-level PHI encryption (repository layer),
  encryption at rest, no PHI in logs or client storage, soft delete, audit-log scaffolding.
- **D29 — Winston with PHI redaction** + per-handler request timing. No metrics stack
  (deferred). Frontend: reporting error boundaries + redacting client logger behind a
  Sentry-ready seam. No RUM/analytics/session-replay (session replay is a PHI liability).

### Tooling
- **D30 — `.claude/` agents, skills, hooks committed to the repo** so enforcement travels
  with the code and applies to every contributor. See `03-agent-skill-hook-proposal.md`.
