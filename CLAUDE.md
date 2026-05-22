# CLAUDE.md — Finni Patient CRM

Operational rules for AI-assisted development. This file is loaded every session. It is
**rules**, not explanation — the *why* lives in `.docs/02-technical-spec.md`. When a rule
here and a rule there conflict, the spec wins and this file is wrong (flag it).

## What this project is
Provider-facing ABA patient CRM. Hero feature: fast compound filtering of a caseload
("intake patients in New York under 30"). Foundation to iterate on — build like it's real.
Deploys to Vercel from GitHub. Monorepo: `@finni/shared`, `@finni/web`, `@finni/api`.

## Non-negotiable rules
These are enforced by lint and hooks. Do not work around them; fix the code.

1. **No `any`.** Type every value. Use `unknown` + narrowing for genuinely dynamic data.
2. **Imports use `@/` alias.** Never `../` parent traversal. Cross-package: use the
   package name (`@finni/shared`).
3. **No import aliasing.** `import { X }`, never `import { X as Y }`.
4. **Globally unique names.** No two variables/types/classes/constants share a name. On a
   collision, rename at the source — never alias.
5. **Named exports.** Default exports only where a tool requires it.
6. **No magic numbers, hex, or px in component styles.** Reference a design token (theme
   config or CSS var). Styling is controlled at root, not per-component.
7. **Comments ≤2 lines.** State *what* the code does and *why*, never *how*. Write them
   for the next AI reader's context, not for a human who can read the code.
8. **Dates only through `DateTimeUtil`.** Never import dayjs elsewhere. Never `new Date()`
   in display/filter logic. All stored time is UTC; render in user zone; DOB is zoneless.

## Architecture you must respect
- **Layer flow (one direction):** handler → service → repository → Drizzle → Postgres.
  Handlers are thin (parse, Zod-validate, call one service method, respond). Services hold
  business logic and own transactions. Repositories do all DB access and take an explicit
  **scope** (active / include-archived / include-deleted) — never leak PHI by default.
- **State:** TanStack Query owns server data. Zustand owns global UI state (theme, font,
  density, palette, current view, filters, layout). useState/useReducer owns local state.
  Never put server data in Zustand or hand-roll fetch caching.
- **Shared package is the contract.** Entity types, enums, Zod schemas, DateTimeUtil are
  defined once in `@finni/shared`. Change a shape there, not in two places.
- **Enums** use the const-object union pattern (see spec §6.4). Never native `enum`.

## Domain quick reference
- `patient` (id v7, names, dob [zoneless date], status, has_insurance, archived,
  deleted_at, audit) → many `address` (region/state required + indexed) → many
  `contact_method` (email/phone).
- **Age is derived** via `DateTimeUtil.calculateAge()`, never stored.
- **Six statuses:** inquiry, waitlisted, onboarding, active, paused, churned.
- **Lifecycle:** archived = hidden+reversible; deleted_at = soft delete, purge after 30d.
- **Create requires:** first_name, last_name, dob, ≥1 email, ≥1 address with state.
  Same Zod schema validates the form and the API.
- Patient creation is one atomic transaction (patient + primary address + primary email).

## UI rules
- Atomic design. One canonical component per concept.
- Two caseload views (card/table) over ONE data + filter layer. Switching views preserves
  filters and never refetches. Board view was removed (D57).
- Create = bottom drawer; Edit = right drawer.
- Every widget/view has its own error boundary + skeleton + empty state. One widget
  failing must never blank the page.
- `PatientAvatar`: headshot or deterministic colored-silhouette fallback; respect the
  `USE_HEADSHOTS` flag.
- Tokens adapt Finni's warm rounded brand. Retired: skeuomorphic gradients/shadows.

## HIPAA-aware (not certified)
- Field-level encryption on PHI columns, handled in the repository layer.
- **Never log PHI.** Log patient UUIDs, never names/dob/contact values. Winston redaction
  is on; don't bypass it. Same discipline in frontend `reportError()`.
- No PHI in localStorage (prefs only).

## Testing
- Vitest + RTL for units/components; Playwright for E2E. Vitest is NOT for E2E.
- New repository method → test its scope behavior. New util → unit test it.

## Build discipline
- Build the shared package and one full vertical slice (patient list + edit drawer) BEFORE
  parallelizing. The slice is the pattern others copy.
- When unsure, prefer a vetted library over hand-rolling, but justify every new dependency
  (bundle weight matters).

## Documentation discipline (enforced by pre-commit hook)
When you change a data shape, an enum, an architectural rule, or a feature: update the
relevant `.docs/` file AND append to `.docs/CHANGELOG.md` with *what* changed and *why* in
the same commit. Code and docs move together. A commit that drifts them apart is blocked.

## When in doubt
Ask, or check `.docs/`. Do not invent a convention — if a pattern isn't defined, surface
it rather than guessing, so it gets decided once and recorded.
