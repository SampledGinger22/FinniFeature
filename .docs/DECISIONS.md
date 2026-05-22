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
  the next step. **(Amended 2026-05-21: the page is built but **hidden in the current build**
  — nav entry + route disabled — pending completion, since it isn't demo-ready. The page and
  its tests stay in the repo for a one-line re-enable. See CHANGELOG.)**

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
- **D31 — C6 (`no-magic-numbers`/hex/px) is lint-enforced on style-convention files only**
  (`**/*.styles.{ts,tsx}`, `**/theme/**`). "A style" is not AST-detectable globally without
  false positives; since styling is centralized (C9), raw values may live only in those
  files, so scoping the lint there enforces C6 everywhere it legitimately applies. Broader
  enforcement (e.g. all `.tsx`) was rejected as too noisy; the `convention-reviewer` agent
  (A1) backstops inline cases. See spec §4.
- **D32 — Commit directly to `main` for this solo demo; commit messages stand in for PRs**
  so a repository reviewer reads the rationale inline. The H2 dangerous-op guard's
  main-commit block is therefore dropped (its force-push / secrets / DROP / dayjs-Date
  guards remain). Trade-off: no PR-gated review step; acceptable for a single-builder demo,
  revisit if the project gains contributors.

### Build process
- **D33 — React pinned to 18.3, not 19.** First-class antd v5 support without the
  React-19 compatibility patch package; revisit when antd lands (Step 3) if 19 is wanted.
- **D34 — `@finni/shared` exports TypeScript source** (no build step); consumers (Vite,
  Vitest, Vercel/esbuild) transpile it and `tsc` resolves it via package `exports`. Avoids
  cross-package build ordering. `vite` is pinned to v6 via an `overrides` entry because
  `vitest@2` otherwise pulls a second `vite@5`, clashing plugin types under
  `exactOptionalPropertyTypes`. *(Superseded in part by D37 — see below.)*

### Step 1 — Shared package
- **D35 — TS entity shapes are camelCase; DB columns are snake_case.** The repository/Drizzle
  layer maps between them. camelCase is the TS idiom; snake_case is the SQL idiom. Documented
  so the boundary mapping is expected, not a surprise.
- **D36 — `@typescript-eslint/no-redeclare` is scope-disabled in `**/enums/**`.** The §6.4
  const-object union pattern deliberately pairs a value and a type of the same name, which the
  rule false-flags. The exception is the narrowest possible (enum files only); `tsc` still
  catches genuine illegal redeclaration there, and `no-shadow` + the A1 convention-reviewer
  still backstop C4's global-uniqueness intent everywhere. Resolves the §6.4-vs-C4 collision.
- **D37 — `@finni/shared` is built (`tsc` + `tsc-alias`) to `dist`; consumers import the
  build.** Supersedes D34's no-build decision. A source-exported package cannot expose its
  internal `@/` alias to consumers (each consumer's tsc/Vite resolves `@/` against its own
  `src`). Building rewrites `@/` to relative paths in `dist`, so the package keeps the `@/`
  convention and its subdirectory structure while remaining consumable by tsc, Vite, and
  Vercel. Turbo's `^build` dependency orders the build before dependents' type-check/dev.
  The D34 `vite` override still stands. Trade-off: shared must be built before web dev/check
  (handled by turbo); acceptable for a scalable foundation.
- **D38 — Creation defaults and validation (Zod, §6.5).** New patients default to
  `status = Inquiry`, `country = US`, `hasInsurance = false`, address `type = Home`, contact
  `label = Mobile`, `is_primary = false`. Email contacts are email-validated; phone contacts
  require ≥7 digits; DOB must be a real, non-future `YYYY-MM-DD`. Age uses dayjs year-diff,
  so a Feb-29 birthday ages on **Feb 28** in non-leap years (dayjs clamps `+1yr` to Feb 28) —
  a defined, documented convention rather than an accident.

### Step 2 — Compliance vs. queryability
- **D39 — PHI encryption split so the hero filter stays exact at scale (Option A).** Resolves
  the collision between §11 field-level encryption and the §1 hero filter (age + location).
  - **Field-level encrypted** (AES-256-GCM, per-value random IV, authenticated; encrypt-on-
    write / decrypt-on-read in the *repository layer only*): `first_name`, `middle_name`,
    `last_name`, `contact_method.value`, `address.line1`, `address.line2`, `address.postal_code`.
    These are high-identifiability free-text PHI and are never filter/sort targets, so
    encrypting them costs nothing on the hero path.
  - **Queryable** (stored as normal indexed columns, protected by DB encryption-at-rest +
    scoped repository queries + the no-PHI-in-logs rule): `date_of_birth`, `address.region`,
    `address.city`. These power exact age range + sort and the location filter; a B-tree index
    on encrypted bytes is impossible, so they must remain queryable.
  - **Why this holds at scale (not a 50-row illusion):** filters/sorts hit B-tree indexes on
    unencrypted columns — same query plan at 50 or 500k rows. Decryption cost scales with the
    *paginated page returned*, not table size (O(page)). Rejected the decrypt-in-repository
    alternative precisely because it is O(n) full-scan.
  - **Bounded deviation:** §11 literally said "encrypt DOB"; we keep DOB queryable instead,
    because field-encrypting it breaks the headline exact-age filter *and* sort. This is the
    single, documented concession. Posture for identified PHI = at-rest encryption + access
    scoping + audit + minimum-necessary, with field-level encryption as defense-in-depth on
    the highest-risk free-text.
  - **Deferred:** searching patients *by name* would need a blind/HMAC index (deterministic
    lookup over encrypted names); out of scope for v1's status/location/age hero filter.
- **D40 — Data-layer tooling.** `postgres.js` as the single Postgres driver (works for local
  Docker and Neon over TCP from Vercel Node functions, avoiding a second edge driver);
  `drizzle-kit` for migrations (committed under `apps/api/drizzle/`); `uuidv7` for app-side v7
  PKs (Node's `randomUUID` is v4 only); `@faker-js/faker` for the deterministic seed; and
  `@electric-sql/pglite` for repository tests — a real Postgres engine in-process, so scope +
  encryption behavior is *exercised* without requiring Docker in CI. Repositories take an
  injected `AppDatabase`, so the same code runs against postgres.js and pglite.
- **D41 — Docker kept as the standard local-dev DB, hardened.** Docker stays (D4: dev parity,
  never the deploy path) because a local Postgres matching prod's engine is the standard,
  self-contained, offline-capable local setup. Hardened after a collision: explicit Compose
  project name `finni` (no longer adopts other projects) and host port **5434** (5432/5433 were
  taken on the dev machine) → container 5432, matched in `.env.example`. Tests use pglite; dev
  can alternatively point `DATABASE_URL` at Neon.

### Step 3 — Design system, atoms, kitchen sink
- **D42 — A single token-source file is exempt from the C6 hex/number lint** (`theme/finniTokens.ts`).
  C6 lints `theme/**` for raw hex/px/magic-numbers (D31), but antd's `ThemeConfig` seed genuinely
  *needs* real values: its ramp algorithm cannot derive hover/active shades from a `var()`, and
  numeric tokens (`borderRadius`) are typed `number`, so a `var()` string would require `any`
  (banned, C1). The token source is therefore the one place C6's "reference a token" cannot apply —
  it *is* the token. A narrow ESLint override lifts only `no-magic-numbers` + the hex/px rules for
  that one file (C8's `new Date` ban still holds), exactly parallel to D36 (enum redeclare) and C8
  (DateTimeUtil). Every other `theme/**` and `*.styles.ts` file stays fully linted and references
  tokens or CSS vars. Bounded amendment to D31's enforcement scope; C6's intent (no raw values in
  component styles) is preserved.
- **D43 — antd semantic colors are decoupled from the status-tag colors.** The six status colors
  (D23) are tuned for AA text on a light tag tint, which makes them dark/low-luminance; feeding
  those same values into antd's `colorSuccess/Warning/Error/Info` seeds produced muddy derived
  alert backgrounds. So semantic colors get their own brighter, warm-brand values, kept separate
  from the status palette. antd's generator still yields a greyed tint-1 for green seeds in this
  theme, so `colorSuccessBg`/`colorSuccessBorder` are set explicitly (the other three derive
  cleanly). All status pairs are proven AA by `a11y/statusColorContrast.test.ts`, which also
  asserts the D22 orange-ink button (white-on-orange fails, ink passes).
- **D44 — Preferences in Zustand + `persist` → localStorage; theme applied via antd-style.**
  `usePreferencesStore` (palette/density/font/scale, seeded from `DEFAULT_USER_PREFERENCES`)
  persists to localStorage (§9/§10, prefs only — never PHI). `FinniThemeProvider` maps the store to
  an antd `ThemeConfig` (antd-style `ThemeProvider`, retaining the D24 `createStyles`/`ConfigProvider`
  mechanism) and injects per-palette status/radius/spacing **`:root` CSS vars** at runtime for custom
  primitives. Compact density composes `compactAlgorithm` over `defaultAlgorithm` (§4).
- **D45 — Client avatar flag is `VITE_USE_HEADSHOTS`.** Vite exposes only `VITE_`-prefixed env to
  the browser, so the web client reads `VITE_USE_HEADSHOTS` while the backend keeps `USE_HEADSHOTS`
  (§8); `.env.example` documents both and either set to `false` forces the silhouette fallback.
- **D46 — The kitchen sink is the Playwright visual-regression surface.** Two committed baselines
  (default palette; eye-strain + comfortable density) snapshot every primitive in every state. The
  eye-strain snapshot drives the live store controls, so it also *exercises* the store→theme path
  rather than asserting the controls exist. Playwright owns `apps/web/e2e/`; Vitest is scoped to
  `src/` so the two runners never collide. Full happy-path E2E lands in Step 6.

### Step 4 — Vertical slice (caseload + edit drawer)
- **D47 — Local API transport is a zero-config dev server; the Vercel functions stay the deploy
  path.** There is no Vercel CLI locally and the spec forbids a long-running prod server, so
  `@finni/api` gains a Node-`http` dev server (`bun run dev`) that serves the same framework-agnostic
  route-core (`src/http/patientRoutes.ts`) the Vercel functions adapt. It uses Postgres when
  `DATABASE_URL` is set, else spins up an in-memory **pglite seeded on boot** — so `bun run dev` and
  the demo run with zero config or secrets. Vite proxies `/api` → the dev server. The HTTP contract
  (parse → validate → one service call → shape result) lives in exactly one place (§5).
- **D48 — pglite uses an ephemeral random PHI key; no key is ever committed.** pglite is always
  in-process and fresh, so the field cipher key only has to be consistent within the run. `@/db/pglite`
  honors `PHI_ENCRYPTION_KEY` from the environment if present, else generates a random 32-byte key at
  startup. Replaces the previously hardcoded test-key literal (tests + dev demo still exercise the real
  cipher; the repo holds no key).
- **D49 — `patientUpdateSchema` (shared) validates the edit form and the PATCH handler** — one rule
  set, two consumers (extends D15 to edits). The slice edits the core patient fields
  (name/**DOB**/status/insurance). DOB is editable via an antd `DatePicker` whose dayjs value is
  bridged through `DateTimeUtil.toDatePickerValue`/`fromDatePickerValue` (Form `getValueProps`/`normalize`),
  so the component stays dayjs-free (C8 holds — dayjs lives only in `DateTimeUtil`) and the form value
  remains a `YYYY-MM-DD` string; future dates are disabled and a live derived-age hint shows. Editable
  DOB is required because misentries happen. Addresses/contacts edit separately, later.
- **D50 — TanStack Query owns server data; react-router added for two routes.** `usePatientListQuery`
  /`useUpdatePatientMutation` with a key factory; a successful edit invalidates the list so it
  refreshes instantly (§9, the "rapid refresh" requirement, not hand-rolled). `react-router-dom`
  routes `/` → caseload (the app) and `/kitchen-sink` → the QA/visual-regression surface; the query
  client uses the shared cache TTL and disables refetch-on-window-focus.

### Step 5 — Parallelize views/features (foundation)
- **D51 — `RepositoryScope` moves to `@finni/shared`; it is now part of the HTTP contract.** Step 5
  surfaces scope as the `?scope=` query param (active / include-archived / include-deleted), so the web
  must send it and the API must validate it against ONE definition (the "shared package is the contract"
  rule). The const-object enum now lives in `packages/shared/src/enums/repositoryScope.ts`; the API's
  `@/enums/repositoryScope` re-exports it so existing API imports are untouched. Supersedes the
  API-local definition from Step 2.
- **D52 — One client-side hero filter + one shared filter/view store feeds all the views** (three at the
  time; two after the board was removed in D57). Scope is
  the only *server* dimension (it changes which rows return, so it is the query key → a scope change
  refetches). The hero facets — status (multi) × region × city × age range × **name search** — run
  **client-side** over the loaded scoped set as one pure function (`applyCaseloadFilters`), so they are
  general (never hardcoded to a query), unit-testable, and identical across card/table/board.
  `useCaseloadStore` (Zustand) owns filters + view mode; it is **deliberately not persisted** because
  `nameSearch` can hold PHI, which never touches localStorage (only prefs do — extends D44). The switcher
  owns loading/error/empty and renders the active view from the SAME filtered set, so switching views
  never refetches (§8). `CaseloadViewMode` is a web-only const-object enum (not in shared — not part of
  the API contract).
- **D53 — Write/lifecycle/demo HTTP surface as action sub-resources; Vercel functions restructured.**
  Create = `POST /api/patients`; lifecycle = `POST /api/patients/:id/{archive|unarchive|restore}` and
  `DELETE /api/patients/:id` (soft delete); demo = `POST /api/demo/{purge|reseed|blank-slate}`. The
  service methods already existed (Step 2); Step 5 only exposes them through the one route-core. The
  Vercel function tree became `patients/[id]/index.ts` + `patients/[id]/[action].ts` + `demo/[action].ts`
  (replacing `patients/[id].ts`) to avoid a file-vs-dynamic-directory routing collision. Each lifecycle
  route re-reads at the scope where the new state is visible and 404s a missing id.
- **D54 — `@dnd-kit/core` for the board view drag-and-drop.** The board (kanban) needs accessible
  drag-to-change-status; dnd-kit is the modern, lightweight (~10 kB gzip, no deps), keyboard-accessible
  choice (PointerSensor + KeyboardSensor) and is the library the parallelization plan named. Only
  `@dnd-kit/core` is added (not `sortable`/`utilities`) — columns are droppables and cards are draggables;
  no in-list reordering is needed. The drag/group logic is extracted to a pure, unit-tested helper
  (`caseloadBoard.ts`) since real pointer drag is not testable under jsdom.
- **D55 — Persistent `AppShell` template + shared `PageHeader`; one layout, not per-page headers.** The
  visual redesign frames every workspace page in a collapsible left sidebar (brand, nav with active
  left-accent, pinned Settings, the demo provider chip) beside one scrolling main column, wired once via
  an Outlet layout in `FinniRoot`. Pages now render only a `PageHeader` (uppercase "Provider Workspace"
  eyebrow + title + actions slot) and their content — the four duplicated header/nav blocks are gone. The
  kitchen-sink QA surface stays outside the shell so its visual baseline is undisturbed. **Naming was
  ambiguous (a prior verbal note said rename Caseload→Patients and Your day→Caseload); resolved with the
  user in favour of matching the reference screenshot — no rename, and the unbuilt Inbox/Reports nav items
  are omitted until they exist.** Sidebar collapse is persisted UI layout state on `usePreferencesStore`
  but kept out of the shared `UserPreferences` contract and untouched by `reset()` (layout ≠ preference).
  Sidebar/content sizing lives in a new `finniLayout` token group exposed as `--finni-*` CSS vars (D42).
- **D56 — Patient "attention" is derived, not stored.** The redesigned caseload table and the daily
  banner show a per-patient attention note, but no scheduling, contact-log, or authorization data exists
  in the domain yet. `derivePatientAttention` is a pure function that derives a plausible reason from real
  signals first (Inquiry → awaiting intake; Waitlisted → review placement; in-care without insurance →
  insurance not on file) and falls back to a **deterministic** id-hash bucket for an "auth expires this
  week" minority — never random, so a patient reads identically across renders and views. When real
  attention sources land (reauth dates, missed sessions), this helper is the single seam to replace.
  Avatar monograms (`patientInitials`) and the status-tinted `PatientAvatar` fallback are display-only.
- **D57 — Kanban board view removed; retires D54.** During the visual redesign the board view was judged
  not to earn its complexity, so it was deleted entirely: `CaseloadBoardView`, the pure `caseloadBoard`
  helper, the `Board` `CaseloadViewMode` value, the switcher option, and the `boardStatuses` column-chooser
  state. The caseload now offers Cards + Table over the one shared filter layer. The `@dnd-kit/core`
  dependency (added solely for board drag-and-drop in D54) was dropped, retiring D54.
- **D58 — Edit persists the primary address + contacts in one transaction.** The edit drawer became
  read-first with an editable mode, and the update contract grew to cover the primary address and the
  email/phone contacts (not just patient fields, superseding the "addresses/contacts edit separately,
  later" note on `patientUpdateSchema`). The patches are **optional** so patient-only updates still
  validate. `updatePatient` runs patient + address + contact writes in one `db.transaction` so a partial
  edit never persists; street-level address PHI and contact values are re-encrypted in the repository
  layer (D39). Phone is upsert/remove (cleared → deleted, absent → inserted). Contacts are matched by
  type (the primary email; the single phone) — the model stays one-email-one-phone for the edit form.
