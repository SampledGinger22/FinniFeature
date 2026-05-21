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
  Note: D32's matching removal of H2's main-commit block is pending (the harness blocks the
  agent from editing its own guard hooks — left for the human to apply).
