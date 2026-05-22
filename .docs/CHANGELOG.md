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

### Visual redesign — responsive layout (extends D55)
- **Fluid content width**: the main column no longer sits in a fixed, centered ~1180px cap; it fills
  the available width with fluid horizontal gutters (`clamp(...)`), so the caseload grows/scales with the
  viewport on both small and large screens. Dropped `--finni-content-max-w`/`finniLayout.contentMaxWidth`.
- **Sidebar auto-collapses** to the icon rail at/below `finniLayout.collapseBreakpoint` (1024px) so the
  data stays in view; the manual collapse toggle is hidden there (collapse is width-enforced). New generic
  `useMediaQuery` hook drives it. +2 hook tests, +1 AppShell test.
- **Pipeline pills wrap** into two rows on narrow/half-screen widths (`flex-wrap` + a segment flex-basis)
  instead of squashing or overflowing.

### Defaults
- Changed `DEFAULT_USER_PREFERENCES` (the appearance defaults before a user customizes): font family
  **Sans → Serif (Georgia)** and density **Compact → Comfortable**. Palette (Default) and text size
  (Medium) unchanged. Applies to fresh state; existing persisted prefs are unaffected until reset.

### Visual redesign — Add-patient bottom drawer
- **Restyled `PatientCreateDrawer`** to match the reference: a drag-handle pill, a "NEW RECORD" eyebrow +
  "Add a patient to your caseload" title + subtitle, then **IDENTITY / CONTACT / PRIMARY ADDRESS** sections
  of responsive field grids (`auto-fit` so they reflow narrow). Lifecycle status is now a color-dot pill
  selector; an optional **Phone** field was added (becomes a secondary contact); **State** is a searchable
  Select of US states. Sticky footer pairs a lock + "Stored encrypted at rest. PHI fields never appear in
  logs." note with Cancel / orange **Add patient**. The drawer mask now **blurs** the workspace behind it.
- New reusable `StatusPillSelect` atom (color-dot single-select, Form-control shaped) + `US_STATES` list.
  +2 atom tests; create-drawer tests updated for the new labels/controls.

### Visual redesign — View/Edit right drawer
- **`PatientEditDrawer` is now read-first** with two modes. VIEW: identity header (square status-tinted
  avatar, name, "Age · DOB · City, ST", status + insured pills, short ID), a **LIFECYCLE** stepper (antd
  Steps, current highlighted), **CONTACT** and **ADDRESS** cards, and a **RECENT** timeline derived from
  created/updated/status (no audit data exists, D56). EDIT: the patient form (now with the `StatusPillSelect`
  status control) reached via **Edit record**; Cancel returns to view.
- Footer adapts to lifecycle state: Archive/Reactivate + Delete (active) or Restore + Delete-permanently
  (Trash), plus Edit record — reusing the existing lifecycle mutations with confirms; success closes the
  drawer. The drawer mask **blurs** the workspace behind it (item 8). Edit-drawer tests updated for the
  view-first flow.
- Bottom Add drawer shape fix (feedback): it is now a **centered, inset, rounded** panel (not edge-to-edge)
  capped at `finniLayout.bottomDrawerMaxWidth`, with a **warm cream body and white section cards** matching
  the reference, instead of a full-width white sheet.
- Lifecycle stepper fix (feedback): replaced antd `Steps` with a **custom compact stepper** so all six
  statuses fit within the drawer width (no overflow/truncation, drawer not widened), connectors visually
  touch the circles, and spacing is tighter. Completed = check, current = filled, future = muted.

### Editable address + contacts in the View/Edit drawer
- **`patientUpdateSchema` extended** with an optional `primaryAddress` patch (`addressUpdateSchema`:
  line1/city/zip nullable, region required) plus optional `primaryEmail` and nullable `phone`. New
  `AddressUpdateInput` type. Patient-only updates still validate (the patches are optional). (D58)
- **`updatePatient` is now transactional** and applies the address + email/phone patches: it updates the
  primary address in place (re-encrypting street-level PHI), updates the primary email value, and
  updates/inserts/removes the phone contact (cleared → removed, none → inserted) — all in one transaction.
  New repo helpers: `updatePrimaryAddressRow`, `findContactIdByType`, `updateContactValueRow`,
  `deleteContactMethodRow`.
- **Edit drawer form** gains Primary email, Phone, Street, City, State (US-state Select), ZIP — seeded
  from the record and submitted with the patient fields; nested validation errors map back to their
  inputs. +5 shared, +4 api, +1 web tests.
- Lifecycle redesign (feedback): the VIEW drawer's lifecycle is now a row of **status pills** (current
  highlighted in its status color, the rest neutral) instead of a connected progress stepper — they are
  statuses, not steps. Removes the connector line that showed through the circles.

### Quick actions, archived view, pipeline pills (feedback)
- **Quick "Set status" submenu** added to the card/table three-dot menu, plus the existing
  archive/reactivate/delete/restore/purge — extracted into one shared `usePatientActions` builder so the
  kebab and the right-click menu share a single source. **Right-click** on a card or table row now opens
  that same menu (card wraps in a contextMenu `Dropdown`; the table wraps each row via
  `components.body.row`). Quick status re-sends the patient fields with the new status (D58).
- **"Show archived" now shows archived-only** (it was additive). The page narrows the loaded set to
  `archived === true` when the scope is IncludeArchived, so the list, facets, counts, and the **pipeline
  segment numbers** all reflect the archived-only view. The **Archived** flag is now a clear amber tag
  with an inbox icon on both card and table.
- **Pipeline pills are equal-width** (fill the row, wrap on narrow) — no longer sized by count/percentage.
- +3 web tests (`PatientActionsMenu`).

### Shared sort, curated timezones, Your-day hidden (feedback)
- **Shared caseload sort.** New web-only `CaseloadSortField` (Name/Age/Status) + `CaseloadSortDirection`
  const-object unions, `sortField`/`sortDirection` on `useCaseloadStore` (default Name ascending). A pure
  `sortCaseloadPatients` (+ shared `compareCaseloadPatients` comparator) runs in `useFilteredPatients`
  after filtering, so **card and table render the same order**. Status sorts by lifecycle rank, not
  alphabetically. New `CaseloadSortControl` (field Select + direction toggle) in the caseload header. The
  table's column sorters are now **controlled by the same store** (header click ↔ toolbar control stay in
  lockstep) and delegate to `compareCaseloadPatients` so the two can't drift. *Why:* the card view had no
  sort and the table's own sorter fought any shared order; one ordering, defined once. +6 web tests.
- **Timezone picker limited to US + Canada.** `SettingsPage` no longer enumerates every IANA zone at
  runtime; it reads a curated `config/timezones.ts` list (offset-named labels, searchable by label) plus
  the Auto-detect sentinel. *Why:* the full world-zone list was noise for a US/Canada provider tool.
- **"Your day" hidden for now.** Removed its sidebar nav item and route (`/your-day` falls through to the
  catch-all redirect to `/`); the page + tests stay in the repo for easy re-enable. *Why:* the feature is
  incomplete and not demo-ready.
- **Sort Select min-width** (`CaseloadSortControl.styles.ts`) so the option labels are not clipped inside
  the compact group with the direction toggle. *Why:* user reported the order-by dropdown cut off the words.

### Step 6 — E2E happy paths + accessibility (locked)
- **E2E rewritten + expanded for the redesigned UI** (the prior specs predated the read-first drawer and
  failed). New Playwright coverage, all run green against the dev pglite API: create via the bottom drawer
  → edit through the read-first right drawer; required-field validation; archive → Show-archived round
  trip; soft-delete → Trash → restore. Each mutating test creates its own uniquely-named subject
  (`e2e/support/patientFlows.ts`) so they are parallel-safe on the shared backend.
- **Accessibility, genuinely exercised** (`caseloadA11y.spec.ts`): switching card↔table preserves the
  active filters and issues **zero** new list GETs (network-counted); both drawers trap focus and the
  filter + view switcher are keyboard-operable.
- **A11y fixes surfaced by those tests:**
  - `PatientCard` was `role="button"` but a non-focusable `<div>` — now `tabIndex={0}` with an
    Enter/Space `onKeyDown` so the default card grid is keyboard-operable (WCAG 2.1.1). +1 web test.
  - New `useReturnFocus(open)` hook restores focus to the triggering control when either drawer closes
    (WCAG 2.4.3); wired into both `PatientCreateDrawer` and `PatientEditDrawer`. +2 web tests.
- Refreshed the stale `kitchen-sink` visual-regression baseline to the shipped redesign (the snapshot
  predated it). E2E: 10 passing. Unit: web 121 / api 31 / shared 40.

### Documentation reconciliation
- Swept all docs for drift against the shipped build and fixed it: `README.md`, `CLAUDE.md`, the product
  brief (§01) and technical spec (§08 + tech-stack table) no longer present the **board view** or
  **dnd-kit** as live (removed in D57 — now marked accordingly), and "Your day" is labelled **hidden in
  the current build**. `DECISIONS.md` D3 amended (Your day hidden) and D52 caveated (two views after D57).
- Fixed `README.md` "Running locally": leads with the real zero-config `bun run dev` (pglite, no Docker/
  secrets); the optional Postgres path now uses the correct `docker/docker-compose.yml`, `bun run db:push`,
  and `bun run seed` (the prior `docker/compose.yml`, `db:migrate`, `db:seed` never existed); E2E is run
  from `apps/web`. Lifecycle label aligned to "Waitlist". *Why:* docs must match reality for a buyer/
  reviewer; the decision log + this changelog remain the authoritative evolution record.
- Note: `.claude/agents/slice-parallelizer.md` still references building a Board view; editing agent files
  is harness-blocked as self-modification, so it is left for the user to update.

### Step 7 — Vercel deployment topology (D59)
- `apps/api/vercel.json` now defines the full single-project deploy: `installCommand`/`buildCommand` run
  from the repo root (`turbo run build --filter=@finni/web`) and copy `apps/web/dist` into
  `apps/api/public` (served as `outputDirectory`), keeping the functions at the conventional
  `apps/api/api/*`. Added a `/((?!api/).*) → /index.html` rewrite for the React-Router SPA fallback.
  *Why:* the client calls relative `/api/*`, so the SPA and functions must share one origin in
  production — a single project rooted at `apps/api` does this without a cross-project rewrite, and the
  conventional `api/` location preserves native dynamic-segment (`[id]`/`[action]`) routing. Deploy
  requires Root Directory `apps/api` and env vars `DATABASE_URL` (pooled), `PHI_ENCRYPTION_KEY`,
  `USE_HEADSHOTS`, and build-time `VITE_USE_HEADSHOTS`. `apps/api/public` is gitignored.
- `db/client.ts` now configures `postgres()` with `prepare: false` and `max: 1`. *Why:* the production
  `DATABASE_URL` is a pgbouncer transaction-mode pooler, which doesn't support named prepared statements;
  one connection per serverless instance avoids exhausting the pool. Safe for the local Postgres dev path
  too; tests use pglite and don't touch this client.
- Vercel build raises the Node heap (`NODE_OPTIONS=--max-old-space-size=6144` in `vercel.json`'s build
  command; `NODE_OPTIONS` added to `turbo.json` `globalPassThroughEnv` so strict-mode turbo forwards it to
  the vite child). *Why:* the first deploy was OOM-killed during rollup's "rendering chunks" step on the
  8 GB build box — the app bundles into one ~1.49 MB chunk. Build-only; the Windows local build is
  unaffected. Durable follow-up: code-split the bundle (manualChunks/route-level lazy) to cut peak memory
  and the >500 kB chunk.
- Pinned Node to `22.x` (`engines` in root + `apps/api/package.json`) and declared the runtime env vars
  (`DATABASE_URL`, `PHI_ENCRYPTION_KEY`, `USE_HEADSHOTS`) in `turbo.json` `globalPassThroughEnv`. *Why:*
  the deploy failed with "invalid Node.js Version 24.x" — Vercel fell back to the project's Node setting
  because the `apps/api` root package.json declared none; `22.x` is the supported runtime. The env
  declaration clears turbo's "set on Vercel but missing from turbo.json" build warning (`VITE_USE_HEADSHOTS`
  is auto-handled by turbo's Vite inference).
- Removed `"type": "module"` from `apps/api/package.json` (only — `@finni/shared` and `@finni/web` keep
  it). *Why:* deployed functions 500'd with `ReferenceError: exports is not defined in ES module scope` —
  `@vercel/node@5.1.0` bundles each function to CommonJS, but `type: module` made Node load the emitted
  `.js` as ESM. Safe: prod functions are self-contained CJS bundles, Bun runs the `.ts` dev server/scripts
  as ESM regardless of the field, and the type-check uses `module: ESNext` (not `NodeNext`) so it doesn't
  key on the `type` field. Verified: api type-check + 31 tests pass, dev server boots and seeds.
- Set `verbatimModuleSyntax: false` in `apps/api/tsconfig.json` (override of the base). *Why:* `@vercel/node`
  type-checks each function with a forced-CommonJS compile, which clashes with the base
  `verbatimModuleSyntax: true` and emitted `TS1295`/`TS1287` diagnostics on every function. They were
  non-fatal (the deploy still completed) but noisy and could become fatal; relaxing it only for the api
  package clears them. Local `tsc` is unaffected — it classifies modules via `module: ESNext`, not the
  flag, so it still passed before and after.
