# Finni Patient CRM — Technical Specification

> Audience: engineers (human and AI). This is the authoritative architecture document.
> Every rule here is a decision, not a suggestion. Where a rule is enforceable by lint or
> hook, that is noted — those are not optional.

## 0. Document status

| Section | Status |
|---|---|
| Stack, structure, conventions | **Locked** |
| Domain model | **Locked** (designed in scoping; see §6) |
| UI architecture | **Locked** |
| Out of scope | **Locked** (see product brief) |

---

## 1. Goal and constraints

Build a provider-facing ABA patient CRM whose hero capability is fast, compound
filtering of a caseload ("intake patients in New York under 30"). Deploys to Vercel from
GitHub. Primarily evaluated on UI/UX and code quality. This is a **foundation to iterate
on**, so architectural decisions are made as if for a real system, not a throwaway.

Guiding principles, in priority order:

1. **Clarity over cleverness** (KISS). The simplest design that meets the requirement.
2. **Single responsibility, single source of truth** (SOLID). One concept, one home.
3. **No drift, no regression.** Conventions are enforced mechanically, not by vigilance.
4. **Slim and fast.** Prefer a well-chosen library over hand-rolled code, but every
   dependency must earn its weight.

---

## 2. Stack (locked)

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript (strict) | End-to-end types; `any` is banned (§4). |
| Build | Vite | Fast dev, first-class TS/React. |
| UI | React | Component model fits atomic design. |
| Component lib | Ant Design (antd) + antd-style | Dense, accessible primitives out of the box. |
| Server state | TanStack Query | Caching, optimistic updates, refetch — delivers instant record refresh. |
| Global UI state | Zustand | Theme/font/density/layout prefs; minimal boilerplate. |
| Local state | `useState`/`useReducer` | Component-local only. |
| API | Vercel serverless functions | Deploys with the frontend; thin handlers over the service layer. |
| Validation | Zod | Runtime validation at the API boundary; types inferred from schemas. |
| ORM | Drizzle | Lightweight, excellent types, sits naturally over the repository pattern. |
| Database | Vercel Postgres (Neon) | Free tier, serverless-friendly, idiomatic Drizzle. |
| Dates | dayjs (+ utc, +timezone plugins) | Small, immutable; centralized in `DateTimeUtil`. |
| ~~Drag & drop~~ | ~~dnd-kit~~ | Removed with the board view (D57); the caseload ships Cards + Table only. |
| Cache | in-memory LRU (`lru-cache`) | Behind a cache interface; swappable for Redis later. |
| Logging | Winston (+ PHI redaction) | Structured logs; never logs PHI. |
| Monorepo | Turborepo + Bun workspaces | Shared types package; fast installs. |
| Unit/component tests | Vitest + React Testing Library | — |
| E2E tests | Playwright | Vitest cannot do real E2E. |
| Package manager | Bun | Speed; npm acceptable fallback. |
| Containerization | Docker | **Local dev parity only**, not the deploy path. |

### Deployment reality (important)
Vercel runs the static frontend and the serverless functions. There is **no
long-running Express server** — route handlers are thin Vercel functions that delegate
to the service layer. Docker is for reproducible local development, not deployment.

**Local dev transport (D47).** Since there is no Vercel runtime locally, `@finni/api` ships a
small Node-`http` dev server (`bun run dev`, Vite proxies `/api` to it) that adapts the *same*
framework-agnostic route-core the Vercel functions use. It runs against Postgres when
`DATABASE_URL` is set, else an in-memory pglite seeded on boot — so the app runs with zero config
or secrets. This is dev tooling only; production is the serverless functions.

---

## 3. Repository structure (locked)

Monorepo via Turborepo. Three packages, one source of truth for shared types.

```
finni-feature/
├─ .docs/                      # scoping docs, decision log (this folder)
├─ CLAUDE.md                   # AI engineering rules (repo root, read by Claude Code)
├─ .claude/                    # agents, skills, hooks (see proposal doc)
│  ├─ agents/
│  ├─ skills/
│  └─ settings.json            # hook configuration (committed; team inherits)
├─ packages/
│  └─ shared/                  # @finni/shared — types, enums, Zod schemas, DateTimeUtil
├─ apps/
│  ├─ web/                     # @finni/web — Vite + React frontend (atomic design)
│  └─ api/                     # @finni/api — Vercel serverless functions + service/repo
└─ docker/                     # local dev compose (Postgres)
```

### The shared package is the contract
`@finni/shared` is the single source of truth for: entity types, all enums (§6.4), Zod
schemas, and `DateTimeUtil`. Both `web` and `api` import from it. **An entity's shape is
defined once, here.** This is what makes "no drift" structurally true rather than hoped.

The package keeps the `@/` alias and a subdirectory layout internally, and is **built**
(`tsc` + `tsc-alias`) to `dist` so consumers can resolve it — a source export cannot expose
its own `@/` alias to a consumer's compiler (D37). Turbo's `^build` orders the build before
dependents' type-check and dev.

---

## 4. Code conventions (locked, mostly enforced)

These are the rules that prevent drift. Most are enforced by ESLint and/or hooks; an
unenforced rule is a comment, not a constraint.

| # | Rule | Enforcement |
|---|---|---|
| C1 | **No `any`.** Every value is typed. `unknown` + narrowing where genuinely dynamic. | `@typescript-eslint/no-explicit-any` (error) |
| C2 | **Path imports use `@/` alias**, never `../` parent traversal. | `no-restricted-imports` bans `../*`; alias in tsconfig + Vite + Vitest via `vite-tsconfig-paths` |
| C3 | **No import aliasing.** `import { X }`, never `import { X as Y }`. | `no-restricted-syntax` on import specifiers where imported ≠ local |
| C4 | **Globally unique names.** No two variables, types, classes, or constants share a name across the project. Collisions are resolved by renaming at the source, never by alias. | `no-shadow`, `no-redeclare`; convention enforced by review agent |
| C5 | **Named exports preferred.** Default exports only where a tool requires them (e.g. some React/config cases); those get a fixed conventional import name. | review + lint where feasible |
| C6 | **No magic numbers or hex/px in component styles.** Every value references a design token (theme config or CSS var). | `no-magic-numbers` (styles), review |
| C7 | **Comments: ≤2 lines, state *what* and *why*** (for AI continuance), never *how*. | review agent |
| C8 | **dayjs and raw `Date` construction live only in `DateTimeUtil`.** Nothing else imports dayjs or constructs Dates for display logic. | `no-restricted-imports` (dayjs outside util); `no-restricted-syntax` (new Date in render paths) |
| C9 | **Styling is controlled at root**, not per-component. Component styles reference tokens; they do not define raw values. | review + C6 |

### Styling architecture
Design tokens live in two coordinated places: the antd `ConfigProvider` theme (for antd
components) and CSS custom properties at `:root` (for custom primitives). Component CSS
*references* these; it never hardcodes. The `bootstrapTheme.ts` pattern from the brief is
retained as the *mechanism* (antd-style `createStyles`, `ConfigProvider` injection) but
the *aesthetic* is retired in favor of Finni's clean, warm, rounded feel — the
skeuomorphic gradients/shadows/text-shadows are dropped (decision logged).

**C6 enforcement scope.** "No magic numbers/hex/px" cannot be AST-detected as "a style"
globally without false positives, so the `no-magic-numbers` + hex/px lint applies to
style-convention files only: `**/*.styles.{ts,tsx}` and `**/theme/**`. Because styling is
centralized (C9), raw style values may live *only* there — so scoping the lint there is
equivalent to enforcing it everywhere styles legitimately appear (decision D31). The single
token-*source* file (`theme/finniTokens.ts`) is exempt from the hex/number rules — it holds the
real values antd's `ThemeConfig` seed requires (a `var()` can't seed antd's ramp, and numeric
tokens can't be strings without `any`); it *is* the token, so C6's "reference a token" cannot
apply to it. Everything else under `theme/**` stays fully linted. See D42.

### Density
Compose antd's `compactAlgorithm` with `defaultAlgorithm`. Compact on by default; a
settings toggle exposes it.

---

## 5. Layered architecture (locked)

Strict one-directional dependency flow. Each layer may only call the layer below it.

```
HTTP handler (Vercel fn)  →  Service  →  Repository  →  Drizzle  →  Postgres
     (thin: parse,             (business      (DB access     (query
      validate, respond)        logic,         only, scope     builder)
                                formatting)     enforcement)
```

| Layer | Responsibility | May NOT |
|---|---|---|
| Handler | Parse request, validate with Zod, call one service method, shape response, map errors to status codes. | Contain business logic or touch the DB. |
| Service | Business logic, orchestration, transactions, formatting for transport. OOP objects/methods. | Build SQL or know about HTTP. |
| Repository | All DB interaction. Every find method takes an explicit **scope** (active-only / include-archived / include-deleted) so PHI never leaks by default. | Contain business logic. |
| Drizzle | Query building, schema definitions. | — |

### Transactions
Creating a patient inserts the patient + primary address + primary email **atomically**
(one transaction, all-or-nothing). A failed child insert rolls back the patient. The
service layer owns this boundary.

---

## 6. Domain model (locked)

### 6.1 Entities

Three tables, normalized. UUID **v7** primary keys (time-ordered → index-friendly at
scale, non-enumerable → no count leakage). IDs generated app-side in the service layer.

**`patient`**
| Column | Type | Notes |
|---|---|---|
| id | uuid (v7) PK | app-generated |
| first_name | text | required |
| middle_name | text? | nullable |
| last_name | text | required |
| date_of_birth | date | **no timezone**; age is derived, never stored |
| status | enum | 6-state lifecycle (§6.4) |
| has_insurance | boolean | default false; display flag only, not a coverage model |
| archived | boolean | default false; reversible UI-visibility toggle |
| deleted_at | timestamptz? | null = live; set = soft-deleted; purged after 30 days |
| created_at | timestamptz | UTC |
| updated_at | timestamptz | UTC |

**`address`** (one-to-many from patient)
| Column | Type | Notes |
|---|---|---|
| id | uuid (v7) PK | |
| patient_id | uuid FK | |
| type | enum | home / billing / other |
| is_primary | boolean | |
| line1 | text? | optional at creation |
| line2 | text? | nullable |
| city | text? | **indexed** (location filter) |
| region | text | **state — required minimum**, **indexed** |
| postal_code | text? | |
| country | text | default US |
| created_at / updated_at | timestamptz | UTC |

**`contact_method`** (one-to-many from patient)
| Column | Type | Notes |
|---|---|---|
| id | uuid (v7) PK | |
| patient_id | uuid FK | |
| type | enum | email / phone (v1 scope) |
| value | text | |
| label | text | mobile / home / work |
| is_primary | boolean | |
| created_at / updated_at | timestamptz | UTC |

### 6.2 Derived, never stored
**Age** is computed from `date_of_birth` via `DateTimeUtil.calculateAge()`. It is
computed one way, in one place, so a card and a filter can never disagree at a date
boundary.

### 6.3 Indexing (scale-conscious)
- **Composite index `(deleted_at, archived, status)`** on `patient` — the default list
  query ("live, non-archived, by status") hits one index instead of combining several.
  Column order places the always-present equality predicates first.
- Index `deleted_at` for the purge sweep.
- Index `address(patient_id)`, `address(region)`, `address(city)` — location is a
  headline filter.
- Index `patient(date_of_birth)` for age-range filtering.
- Every index is documented with *why* in the schema file. Unexplained indexes are debt.

### 6.4 Enums (const-object union pattern)
Defined once in `@finni/shared`, consumed by Drizzle, Zod, and the frontend. Pattern:

```ts
export const PatientStatus = {
  Inquiry: 'inquiry',
  Waitlisted: 'waitlisted',
  Onboarding: 'onboarding',
  Active: 'active',
  Paused: 'paused',
  Churned: 'churned',
} as const;
export type PatientStatus = typeof PatientStatus[keyof typeof PatientStatus];
```

Reads like an enum at call sites (`PatientStatus.Active`), compiles to a plain string,
satisfies Zod (`z.enum`) and Drizzle without shims, cannot take a stray value. Native
`enum` is **not** used (extra runtime JS, unsafe numeric members, boundary shims).

Enums: `PatientStatus` (6), `AddressType` (home/billing/other), `ContactMethodType`
(email/phone), `ContactLabel` (mobile/home/work), plus preference enums (`FontFamily`
incl. dyslexic, `FontScale`, `ThemePalette` default/eye-strain, `Density`).

App constants (also in shared): `SOFT_DELETE_PURGE_DAYS = 30`, pagination defaults,
cache TTLs.

### 6.5 Validation contract (Zod, shared)
Patient creation requires: `first_name`, `last_name`, `date_of_birth`, **≥1 email**,
**≥1 address with `region` (state)**. Everything else optional. Frontend form and API
handler use the *same* Zod schema — one rule set, two consumers.

### 6.6 PHI encryption vs. queryability (D39)

Field-level encryption and the hero filter pull in opposite directions: you cannot B-tree
index an AES-encrypted column, so age (from `date_of_birth`) and location (`region`/`city`)
filtering/sorting would break if those columns were field-encrypted. The resolution (Option
A, D39):

| Column(s) | Treatment | Rationale |
|---|---|---|
| `first_name`, `middle_name`, `last_name`, `contact_method.value`, `address.line1`, `line2`, `postal_code` | **Field-level encrypted** (AES-256-GCM, repo layer) | High-identifiability free-text PHI; never a filter/sort target, so encrypting is free on the hero path. |
| `date_of_birth`, `address.region`, `address.city` | **Queryable** (at-rest encryption + scoped queries + never logged) | Power exact age range + sort and the location filter; must stay indexable. |

Encryption/decryption happens only in the repository layer. Decryption is applied to the
**already-filtered, paginated** result set (O(page), not O(table)), so the design holds at
scale, not just at demo-seed size. Name search (if later needed) would require a blind/HMAC
index — deferred.

---

## 7. Dates & time (locked)

All date logic routes through `DateTimeUtil` in `@finni/shared` (rule C8). dayjs is
configured there once (utc + timezone plugins registered).

| Concern | Rule |
|---|---|
| Storage | All timestamps `timestamptz` in **UTC**. No exceptions. |
| Rendering | Convert to user zone: settings override → else browser default (`Intl.DateTimeFormat().resolvedOptions().timeZone`). |
| DOB | Stored and rendered as a plain date, **no zone conversion** (a birthday must not shift across midnight). Documented inline so no one "fixes" it into a bug. |
| Age | `calculateAge(dob)` — the single source for both display and filtering. |

`DateTimeUtil` exposes: `calculateAge`, `formatDob` (zoneless), `toUserZone`,
`resolveTimezone`, `nowUtc`, `subtractDaysUtc` (purge-window math), `isValidDate`, `isFuture`,
and `toDatePickerValue`/`fromDatePickerValue` (the dayjs⇄`YYYY-MM-DD` bridge for date-entry
components, so they never import dayjs — C8).
Age uses dayjs year-diff, so a Feb-29 birthday ages on Feb 28 in non-leap years (documented
convention, D38).

---

## 8. UI architecture (locked)

### Atomic design
Components organized atoms → molecules → organisms → templates → pages. A button is
*the* button everywhere (supports rule C4/uniqueness and consistency).

### The caseload views (one data + filter layer)
The views all read from the same TanStack Query data and the same Zustand filter state.
Switching views preserves filters and scroll context and never refetches. Building multiple
views over one data layer is deliberate — it both serves the demo and demonstrates clean
separation of data from presentation. A shared order-by (Name/Age/Status, default Name A→Z)
also lives in the filter layer so both views render the same sequence.

- **Card** (default): photo-forward `PatientAvatar`, status tag, locality, insurance
  indicator when `has_insurance`.
- **Table**: dense, sortable, the workhorse for compound filtering.
- **Board** *(removed — D57)*: was a dnd-kit kanban by status; judged not to earn its
  complexity during the redesign, so the caseload now ships **Cards + Table only**.

### Filtering (the hero)
Faceted filter bar: status (multi), location (region/city), age range (derived). Live
result counts. Instant client-side filtering over the loaded set; server-side filtering
available for scale. The "intake / New York / under 30" question is answerable in two
interactions.

### Forms & drawers
- **Create**: full-height drawer from the **bottom**.
- **Edit**: drawer from the **right** (list stays visible behind).
- Both use the shared Zod schema for validation; focus is trapped and returned on close
  (accessibility, §11).

### Avatars
`PatientAvatar` atom renders a headshot or a fallback: a rounded square in a color
derived deterministically from patient name/id, white person-silhouette overlay. A single
config flag (`USE_HEADSHOTS`) forces *all* avatars to the fallback app-wide — the safety
valve if seeded headshots render poorly. Seeded patients use generated-face avatars (no
real individuals).

### Logo
Finni's actual mark (provided), at `@/assets/brand/finni-logo.svg`, rendered through a
`BrandLogo` atom with a neutral fallback if it fails to load. Single-color orange mark →
on dark surfaces it renders on a light "plate" to preserve the brand orange.

### Per-widget resilience (hard requirement)
Every dashboard widget/view has its own **error boundary** (one widget failing never
blanks the page) and its own **skeleton loading** and **empty** states. Empty states are
designed, not afterthoughts ("No patients in this view yet").

---

## 9. State management — the dividing line (locked)

| State kind | Owner | Examples |
|---|---|---|
| Server data | **TanStack Query** | patient list, a patient record, filtered results |
| Global UI | **Zustand** | theme, font, density, palette, current view, filter state, dashboard layout |
| Local | **useState/useReducer** | drawer open?, form field values pre-submit, dropdown expanded? |

Record edits fire a mutation → TanStack Query invalidates → list re-renders instantly.
This is the "rapid UI refresh" requirement; it is not hand-rolled.

---

## 10. Persistence of preferences (locked)
No auth, so no server-side user. UI prefs (theme, font, palette, density, timezone,
dashboard layout) persist to **localStorage** — the standard demo pattern, instant, and
honest about the absence of a user system. Patient data persists to Postgres.

---

## 11. HIPAA-aware architecture (locked)

This is a demo and makes **no claim of HIPAA certification** (which requires BAAs, audited
hosting, access controls). It implements HIPAA-*conscious patterns* because they are the
correct baseline for a system meant to be iterated into something real:

- **Encryption at rest** on the database.
- **Field-level encryption** on the high-identifiability free-text PHI — `first_name`,
  `middle_name`, `last_name`, `contact_method.value`, `address.line1/line2/postal_code` —
  encrypt/decrypt in the repository layer so services and handlers never touch ciphertext
  (AES-256-GCM, per-value IV). **`date_of_birth`, `address.region`, and `address.city` are
  kept queryable** (encryption-at-rest + scoped queries + no-logging) because they power the
  exact age/location hero filter and cannot be both encrypted and indexed. This split is
  decision **D39** — see §6.6; it is a deliberate, bounded deviation from "encrypt DOB".
- **No PHI in logs.** Winston runs a redaction format that scrubs known PHI fields before
  any transport; code logs identifiers (patient UUID), never contents.
- **No PHI in client storage.** localStorage holds preferences only, never patient data.
- **Soft delete + scoped queries** so records are never hard-lost and never leak by default.
- **Audit-log scaffolding** (who/what/when shape) present as a seam for iteration.

### Observability
- **Backend**: Winston structured logs to stdout (Vercel captures); each handler logs its
  duration (cheap performance breadcrumb). No metrics stack (deferred, logged).
- **Frontend**: error boundaries that *report* (not just catch) via a thin redacting
  `reportError()` util, plus a dev-verbose/prod-quiet client logger, both behind a seam
  ready to point at Sentry later. No PHI in client logs/reports. No RUM, analytics, or
  session replay (the last is an active PHI liability; deferred and logged).

---

## 12. Soft-delete lifecycle & demo controls (locked)

- **Archive** (`archived = true`): hidden from default views, reversible, no timer.
- **Soft delete** (`deleted_at = now`): hidden everywhere, recoverable, purged after
  `SOFT_DELETE_PURGE_DAYS` (30).
- **Purge**: `purgeExpiredDeletes()` service method removes records past the window. In
  production this is a scheduled job (out of scope, logged); in the demo it is a button.

**Demo controls** (clearly separated "Demo controls" area, confirm-modal gated, would not
exist in production): **Purge expired** (real behavior, visible), **Reseed** (wipe +
deterministic faker dataset; optional new-random-seed variant), **Blank slate** (wipe,
seed nothing — exercises every empty state at once).

---

## 13. Seed data (locked)
Deterministic faker (fixed seed → identical dataset each run) generating realistic ABA
patients: names, DOB across age ranges, all six statuses represented, addresses across
multiple US states (so the location filter has signal), email + phone contact methods,
`has_insurance` mix. Generated in a seed script in `@finni/api`.

---

## 14. Testing (locked)
- **Vitest + RTL**: units (DateTimeUtil age math, repository scope logic, Zod schemas),
  components (PatientAvatar fallback, status tag, filter bar).
- **Playwright**: E2E happy paths — create a patient, filter to the headline query,
  edit via drawer, archive, soft-delete + restore.
- A "kitchen sink" page renders every primitive in every state (loading/empty/error/
  disabled/hover); Playwright snapshots it as a visual-regression surface.

---

## 15. Build order (locked)
1. Shared package: types, enums, Zod schemas, DateTimeUtil.
2. Schema + repositories + seed.
3. Token system + atoms + kitchen-sink page (visual-regression surface).
4. **One full vertical slice**: patient list + edit drawer, fully working (tokens, data,
   mutation, error boundary, skeleton, toast). This is the pattern.
5. **Then parallelize** the remaining views/features against that proven pattern.

> Parallelizing before the pattern exists produces four divergent implementations.
> The slice comes first.
