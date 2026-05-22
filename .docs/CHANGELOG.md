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

### Design system, atoms, kitchen sink (Step 3)
- Added the design-token system in `@finni/web`: a single token source (`theme/finniTokens.ts`)
  for the two palettes (default warm cream, eye-strain dim) — brand orange `#ed762f`, slate text,
  six AA status colors, brighter warm semantic colors, radii/spacing/font scales/font-family stacks.
  `theme/finniTheme.ts` maps preferences → antd `ThemeConfig` (compact composes over default; primary
  button carries dark ink, D22); `theme/cssVariables.ts` bridges status/radius/spacing tokens to
  `:root` vars for custom primitives. *Why:* implements the locked design (D21–D24) as one source so
  styles can't drift.
- Added `D42` lint exemption for the token-source file (antd seeds need real hex/numbers; a `var()`
  can't seed antd's ramp and numeric tokens can't be strings without `any`). Every other style/theme
  file stays fully C6-linted. *Why:* the token source *is* the token; C6's component-style intent is
  unchanged. (Amends D31's scope.)
- Added `usePreferencesStore` (Zustand + `persist` → localStorage, prefs only) and
  `FinniThemeProvider` (store → antd-style `ThemeProvider` + runtime `:root` CSS-var injection +
  base document styles). *Why:* Zustand owns global UI state and prefs persist client-side (§9/§10, D44).
- Added atoms `BrandLogo` (real mark + neutral fallback + light plate on dark, D27), `PatientAvatar`
  (deterministic colored silhouette + `VITE_USE_HEADSHOTS` flag, D26/D45), `StatusTag` (six statuses via
  per-status CSS vars), and the `ErrorBoundary` molecule (per-widget resilience, §8). Each has a
  colocated test (24 web tests).
- Added `a11y/statusColorContrast.test.ts`: codifies D23 — every status fg/bg pair is ≥4.5:1 (WCAG AA)
  across both palettes, and the D22 orange-ink button passes while white-on-orange fails. *Why:* a
  palette edit that breaks contrast now fails CI instead of shipping.
- Added the kitchen-sink page (`pages/KitchenSinkPage.tsx`) rendering every primitive in every state
  (loading/empty/error/disabled) with live palette/density/font controls, plus two committed Playwright
  baselines (default; eye-strain + comfortable) as the visual-regression surface (D46, §14). Replaced the
  Step 0 placeholder shell (`FinniRoot`), removed the now-unused `SHARED_PACKAGE_NAME` export, and added
  a `window.matchMedia` test stub for antd under jsdom.
- Tooling: added `antd`, `antd-style`, `zustand` (deps) and `@playwright/test`,
  `@testing-library/user-event` (dev) to `@finni/web`; `test:e2e` script; Vitest scoped to `src/`.

### Vertical slice — caseload + edit drawer (Step 4)
- Added `patientUpdateSchema` + `PatientUpdateInput` to `@finni/shared` (extracted a shared
  `dateOfBirthSchema`): the same schema validates the edit form and the PATCH handler (D49, extends D15).
- Added the API HTTP layer: framework-agnostic route-core (`src/http/patientRoutes.ts` — list/get/update,
  Active scope by default so PHI never leaks), thin Vercel functions (`api/patients/index.ts`,
  `api/patients/[id].ts`), and a zero-config dev server (`src/http/devServer.ts` + `scripts/devServer.ts`,
  `dev` script) that serves the same route-core over Node `http` — Postgres when `DATABASE_URL` is set,
  else an in-memory pglite seeded on boot (D47). 5 route-core tests on pglite.
- Refactored the seed into a reusable `seedPatients(db)` (`src/seed/seedData.ts`); the CLI is now a thin
  entry. Moved the pglite bootstrap to `@/db/pglite` and switched its PHI key to an **ephemeral random
  key** (no key committed; honors env if set) — replacing the hardcoded test-key literal (D48).
- Added the web data layer: TanStack Query client (shared cache TTL, refetch-on-focus off), typed API
  client (`api/patientsApi.ts`), and query hooks with a key factory; a successful edit invalidates the
  list so it refreshes instantly (D50, §9).
- Added components: `PatientCard` (avatar, derived age, status, locality, insurance), `CaseloadView`
  (organism with explicit loading/error/empty/data states, §8), and `PatientEditDrawer` (right drawer,
  shared-Zod validation, mutation + toast; DOB read-only for now). Wired `CaseloadPage`; `FinniRoot` now
  routes `/` → caseload and `/kitchen-sink` → the QA surface via react-router (D50).
- Added 8 web component tests (card/view/drawer) + 2 Playwright caseload E2E (edit happy-path through the
  dev API; shared-schema validation). Kitchen-sink snapshots moved to `/kitchen-sink` (unchanged pixels).
- Tooling: added `@tanstack/react-query`, `react-router-dom` (web deps); `@finni/api` `dev` script; Vite
  dev proxy `/api` → the dev server; Playwright starts both dev servers.
- Made the drawer DOB **editable** (misentries happen): added `DateTimeUtil.toDatePickerValue`/
  `fromDatePickerValue` (the dayjs⇄`YYYY-MM-DD` bridge, +2 shared tests) so the antd `DatePicker` is wired
  via Form `getValueProps`/`normalize` without the component importing dayjs (C8 holds). Future dates are
  disabled; a live derived-age hint shows. The caseload E2E now also edits DOB through the calendar (D49).

### Parallelize views/features — foundation (Step 5)
- Moved `RepositoryScope` to `@finni/shared` (`enums/repositoryScope.ts`); it is now part of the HTTP
  contract (`?scope=`). The API enum re-exports it so existing imports are unchanged (D51).
- Exposed the remaining patient operations through the route-core (the services existed since Step 2):
  `createPatientRoute` (POST, 201), `archive`/`unarchive`/`restore` (POST action sub-resources),
  `softDeletePatientRoute` (DELETE), and a new `demoRoutes.ts` + `demoService.ts` for `purge`/`reseed`/
  `blank-slate`. Wired into the dev server and the restructured Vercel functions (`patients/[id]/index.ts`,
  `patients/[id]/[action].ts`, `demo/[action].ts`) (D53). +13 api route-core tests (now 25).
- Added the shared data + filter layer: `useCaseloadStore` (Zustand — filters + view mode + scope, not
  persisted since name search can be PHI), the pure `applyCaseloadFilters`/`deriveFilterFacets`
  (`filtering/caseloadFiltering.ts`), and `useFilteredPatients` (memoized, with live counts). The hero
  facets — status × region × city × age × name search — run client-side over the loaded scoped set; scope
  is the only server dimension (keyed query) (D52). +11 web filter tests.
- Reworked the caseload UI around one filter layer: `CaseloadView` is now a switcher (owns
  loading/error/empty, delegates the data state to card/table/board by view mode); extracted
  `CaseloadCardView`; added `CaseloadViewSwitcher`, the shared `PatientActionsMenu` (archive/unarchive/
  delete/restore via mutations), and the `PatientCollectionViewProps` contract. `CaseloadPage` now drives
  scope → query → filter → active view, with an Add-patient button and nav. Added query mutation hooks
  for create/lifecycle/demo. Added `/your-day` and `/settings` routes.
- Placeholders pending the parallel streams: `CaseloadFilterBar` (hero filter UI), `CaseloadTableView`,
  `CaseloadBoardView`, `PatientCreateDrawer` (bottom), `DemoControls`, `SettingsPage`, `YourDayPage` —
  each implements its final contract so the foundation type-checks; the streams fill them in.

### Parallelize views/features — streams (Step 5)
- Built the seven placeholder components in parallel against the foundation contract, each over the one
  shared data + filter layer:
  - **Hero filter bar** (`CaseloadFilterBar`): name search + status multi-select + region + city + age
    range slider + scope ("Show: Active/Archived/Trash"), with live `${matchCount} of ${totalLoaded}`
    and reset. General/customizable — options come only from the loaded facets, nothing hardcoded.
  - **Table view** (`CaseloadTableView`): antd Table (avatar+name, age, status, location, insurance,
    actions); row click edits.
  - **Board view** (`CaseloadBoardView` + pure `caseloadBoard.ts`): dnd-kit kanban, one column per status;
    dragging a card changes status via the update mutation; click edits. Pure move/group helpers unit-tested.
  - **Create flow** (`PatientCreateDrawer`): bottom drawer, shared `patientCreateSchema`, the DateTimeUtil
    DOB bridge, atomic create via the mutation.
  - **Settings** (`SettingsPage`): wires `usePreferencesStore` (palette/font/scale/density/timezone) so the
    theme updates live; hosts the demo controls.
  - **Your day** (`YourDayPage` + `YourDaySummary` + pure `yourDayStats.ts`): at-a-glance caseload stats
    over the active scope with its own loading/error/empty states and an error boundary.
  - **Demo controls** (`DemoControls`): confirm-gated Purge / Reseed / Blank slate via the demo mutations.
- Added `@dnd-kit/core` (web dep) for the board drag-and-drop (D54).
- Convergence: ran the three-pass deep-review (security/PHI, performance, conventions). Security clean
  (filter store stays unpersisted; no PHI in logs/storage). Applied the performance findings — memoized the
  table columns, board grouping, filter-bar options, and your-day summary, and hoisted the static settings
  option arrays. +49 web tests (now 84). Lint/type-check/test green; web production build verified.

### Post-Step-5 UX tweaks (batch 1)
- Per-patient permanent delete: `deletePatientRow` repo + `purgePatient` service + `purgePatientRoute`
  (`POST /api/patients/:id/purge`), wired into the dev server + Vercel action handler. API client
  `purgePatientRequest` + `usePurgePatientMutation`. +2 api tests (now 27). Extends D53.
- Hero search broadened from name-only to **all human fields** (name + address parts + email/phone),
  still client-side over the loaded set; renamed `filters.nameSearch` → `searchText`; placeholder is now
  "Search" and the field is wider. Updates the intent of D52 / the name-search note.
- `PatientActionsMenu`: "Unarchive" → "Reactivate"; deleted patients now get Restore + "Delete
  permanently" (irreversible, warning-gated via the purge mutation).
- Dedicated **Trash page** (`/trash`, table-only, soft-deleted only) reached from Settings; removed Trash
  from the caseload filter scope (Active/Archived only there).
- Nav: Your Day + Settings (gear icon) became buttons; "Back to caseload" became a button on the sub-pages.
  Added `@ant-design/icons` (already a transitive antd dep). Settings timezone is now a searchable Select
  of IANA zones (auto-detect sentinel) instead of free text.
- Board: columns now hold a fixed height with internal scroll (no collapse when sparse) and a multi-select
  **column chooser** (`boardStatuses` in the caseload store) to hide status columns a provider doesn't track.
- NOTE: a larger visual redesign is queued next (left sidebar nav, rename Caseload→Patients, redesigned
  table rows + patient drawer with lifecycle stepper + background blur, caseload pipeline bar, provider-
  workspace eyebrow). Tracked in memory with reference-screenshot paths.

### Visual redesign — app shell (foundation)
- **Persistent `AppShell` layout** (`components/templates/AppShell.tsx`) replaces the per-page header/nav
  blocks every page used to carry. A collapsible left sidebar holds the brand mark, the working nav items
  (Caseload, Your day) with active left-accent highlighting, a pinned Settings item, and the demo provider
  chip; the main column scrolls beside it, centered at a content max-width. Wired once via an Outlet layout
  in `FinniRoot`; the kitchen-sink QA surface stays bare. *Why:* matches Finni's real product frame and
  removes four copies of the same header. **Naming resolved with the user: keep "Caseload"/"Your day"
  (match the screenshot, no rename); omit the unbuilt Inbox/Reports items.** (D55)
- New shared `PageHeader` molecule: a "Provider Workspace" uppercase eyebrow above the page title with an
  optional right-aligned actions slot (the caseload's view switcher + Add patient now live there).
- New `ProviderIdentityChip` atom + `DEMO_PROVIDER` constant (Dr. Jamie Kim · BCBA · Lead) — the no-auth
  signed-in clinician stand-in (D7).
- `sidebarCollapsed` added to `usePreferencesStore` as persisted layout state, kept **out** of the shared
  `UserPreferences` contract and untouched by `reset()` (it is layout, not a themeable preference).
- New layout tokens (`finniLayout`: sidebar widths + content max-width) exposed as `--finni-sidebar-w`,
  `--finni-sidebar-w-collapsed`, `--finni-content-max-w`. +9 web tests (AppShell 6, PageHeader 3 → 93).
- Sidebar polish (user feedback): nav buttons now `font-family: inherit` so labels use the app font
  tokens (native buttons were resetting the family); collapsed items are consistent squares (no awkward
  scale-down) and the collapse toggle + provider chip center to align with the nav icon column.

### Visual redesign — caseload table rows
- **Redesigned `CaseloadTableView`** to match the reference: a status-tinted circular initials avatar,
  a bold name with an inline **Archived** flag, a sortable "Patient" header (default A→Z), the status
  pill, City/ST location, an **Insurance** pill (Insured / "Not on file"), a derived **Attention** column
  (warning dot + reason), and a trailing chevron with the row actions menu revealed on hover/focus.
- `PatientAvatar` extended (backward-compatible) with optional `initials` + `status` tint + `shape`;
  with no `initials` it still renders the deterministic silhouette, so cards/board/drawer are unchanged.
- New `derivePatientAttention` pure helper + `patientInitials` helper. Attention is **derived** from real
  signals (status, insurance) plus a stable id-hash — no scheduling/audit data exists yet (D56). +9 web
  tests (attention 5, avatar 1, table 3 → 102).

### Visual redesign — sentence-style filter bar
- **`CaseloadFilterBar` restyled into a sentence** in a rounded panel: "Show me [status] patients in
  [region] [city] aged [min]–[max] [insurance]", with the name search + a **Show archived** checkbox +
  live count + Reset on a second row. Same store wiring; all three views still share one filter layer.
- **Age** control swapped from a range `Slider` to two integer `InputNumber` fields (min/max, min 0) so a
  single exact age is filterable; the store already used nullable int `ageMin`/`ageMax`.
- **Scope** control swapped from an Active/Archived `Segmented` to a single **Show archived** checkbox
  (default off → `RepositoryScope.Active`; checked → `IncludeArchived`). Trash stays on its own page.
- **New insurance filter facet** (`filters.insured: boolean | null`; any / insured / not insured) added to
  `applyCaseloadFilters` + the store — a general facet, extends D52. +1 filtering test; filter-bar tests
  updated for the new controls.

### Visual redesign — caseload pipeline bar
- **New `CaseloadPipelineBar` organism**: an eyebrow + live "N match · N total" count above a row of
  status-tinted segments (one per status, widths proportional to count). Clicking a segment toggles that
  status filter in the shared store (reuses `toggleStatus`); the active segment shows `aria-pressed`. Pure,
  unit-tested `derivePipelineSegments` helper (parallels `caseloadBoard.ts`) counts the loaded set so the
  bar shows the caseload's shape while filters narrow the rows. Sits between the filter bar and the views.
- The live count moved here from `CaseloadFilterBar` (matches the reference); the filter bar no longer
  takes `totalLoaded`/`matchCount`. +5 web tests (pipeline 4, helper 1).

### Visual redesign — board view removed
- **Removed the kanban board view** (user call: it didn't earn its complexity). Deleted `CaseloadBoardView`
  + its styles/tests, the pure `caseloadBoard.ts` helper, the `Board` value from the `CaseloadViewMode`
  enum, the Board switcher option, and the `boardStatuses`/`setBoardStatuses` column-chooser state from
  `useCaseloadStore`. The caseload now offers Cards + Table over the same one filter layer.
- **Dropped the `@dnd-kit/core` dependency** (its only consumer was the board) — retires D54. (D57)

### Copy
- Renamed the **Waitlisted** status *label* to **Waitlist** across the app (centralized in
  `patientStatusLabels`, so table/pipeline/filter/drawers all update). The stored enum value
  (`'waitlisted'`) and the API/DB contract are unchanged — display-only.
