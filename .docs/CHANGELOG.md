# Changelog

> Append-only. Every change to a data shape, enum, schema, architectural rule, or feature
> gets an entry here in the same commit (enforced by the documentation-sync hook). Format:
> what changed, and why. The decision *rationale* lives in `DECISIONS.md`; this is the
> running record of changes as they happen.

## [Unreleased]

### Scoping
- Initial scoping complete. Architecture, domain model, conventions, design tokens, and
  AI-tooling proposal locked. See `DECISIONS.md` (D1–D30) for the full decision set and
  rationale. No code written yet — repo seeded with `.docs/`, `CLAUDE.md`, and this
  changelog ahead of development.

### Tooling & scaffolding (Step 0)
- Scaffolded the Turborepo + Bun monorepo: `@finni/shared` (source-export contract package),
  `@finni/web` (Vite + React 18.3), `@finni/api` (Vercel serverless). *Why:* implements the
  locked structure (spec §3) so feature work has one source of truth for types.
- `@/` alias wired per-package in tsconfig + Vite + Vitest (via `vite-tsconfig-paths`);
  cross-package imports use `@finni/shared`. *Why:* enforces C2 mechanically across dev,
  build, and test.
- ESLint flat config enforces C1–C9 (no-explicit-any; no `../`/dayjs imports; a custom
  `no-import-alias` rule for C3; no-shadow/no-redeclare with `ignoreDeclarationMerge` so the
  const-object enum pattern is allowed; no `new Date()` outside `DateTimeUtil`; default-export
  ban with tool-required exceptions; no-magic-number/hex/px scoped to style files). *Why:* the
  conventions are only real if they cannot be bypassed.
- Husky pre-commit runs lint + type-check; `.claude/` ships hooks H1 (quality gate), H2
  (dangerous-op guard), H3 (doc-sync gate) plus skills S1–S3 and agents A1–A3, all committed.
  *Why:* enforcement travels with the repo and applies to every contributor (D30).
- Docker compose for local Postgres (dev parity only, spec §2); `.env.example` documents the
  connection + `PHI_ENCRYPTION_KEY` + `USE_HEADSHOTS` without committing secrets.
- React pinned to 18.3 and `vite` deduped to v6 via an `overrides` entry. *Why:* 18.3 has
  first-class antd v5 support without the React-19 compat patch; a single vite version avoids
  cross-version plugin type clashes under `exactOptionalPropertyTypes`. (D33, D34)
- Recorded D31 (C6 lint scoped to style-convention files), D32 (commit directly to main;
  commit messages stand in for PRs), D33 (React 18.3), D34 (shared exports TS source; vite
  pinned via overrides). *Why:* decisions made during Step 0 setup, surfaced and approved.
- Removed H2's main-commit block to match D32 (force-push / secrets / DROP / dayjs-Date
  guards retained). *Why:* commits go straight to main for this solo demo; the branch guard
  no longer applies.

### Shared package (Step 1)
- Added all domain enums (PatientStatus×6, AddressType, ContactMethodType, ContactLabel) and
  preference enums (FontFamily incl. dyslexic, FontScale, ThemePalette, Density) in the
  const-object union pattern (§6.4). Preference enum *values* were chosen here (e.g. FontFamily
  = sans/serif/dyslexic, Density = compact/comfortable).
- Added entity transport types (Patient, Address, ContactMethod, PatientWithRelations) and
  UserPreferences. camelCase TS / snake_case DB mapping recorded as D35.
- Added app constants: SOFT_DELETE_PURGE_DAYS=30, pagination + cache defaults, DEFAULT_COUNTRY,
  DEFAULT_USER_PREFERENCES.
- Added DateTimeUtil (the only dayjs/Date home, C8): calculateAge, formatDob (zoneless),
  toUserZone, resolveTimezone, nowUtc, isValidDate, isFuture. Age uses dayjs year-diff; leap-day
  convention documented (D38).
- Added the shared Zod creation schemas (§6.5): addressCreateSchema, contactMethodCreateSchema,
  patientCreateSchema — one rule set for form + API. Requires first/last name, valid past DOB,
  ≥1 address with region, ≥1 email contact. Defaults + validation recorded as D38.
- Added 32 unit tests (DateTimeUtil age boundaries incl. leap day; Zod valid/invalid cases).
- Resolved the §6.4-vs-C4 lint collision (D36) and switched shared to a built package (D37,
  supersedes D34) so consumers can resolve it. Tooling: added `tsc-alias`.

### Data layer (Step 2)
- Recorded the PHI-encryption-vs-queryable-filter resolution (D39, Option A) in spec §6.6 +
  §11 before writing schema: field-encrypt names/contact values/street lines; keep
  date_of_birth + region + city queryable (at-rest + scoped) so the exact age/location hero
  filter and sort work at scale. *Why:* a B-tree index can't sit on an encrypted column;
  this confines the deviation to one documented, bounded concession (queryable DOB).
- Built the data layer: Drizzle schema (patient/address/contact_method, UUID v7 PKs, documented
  indexes incl. the composite `(deleted_at, archived, status)`), AES-256-GCM PHI cipher
  (repository layer), repositories with explicit scope (active/include-archived/include-deleted)
  and encrypt-on-write/decrypt-on-read, the atomic patient-creation service transaction, and a
  deterministic faker seed (36 patients, six statuses, multi-state, insurance + email/phone mix).
- Added `subtractDaysUtc` to DateTimeUtil for the purge window.
- Tooling (D40): `drizzle-orm`, `postgres`, `uuidv7`, `drizzle-kit`, `@faker-js/faker`,
  `@electric-sql/pglite`. Repository scope + PHI + purge are exercised on pglite (9 api tests).
- Docker hardened (D41): explicit Compose project name `finni`, host port 5434, named volume.
- Verified end-to-end against local Postgres: seed → headline "intake/NY/under-30" returns rows
  → PHI stored as ciphertext while region stays queryable.
