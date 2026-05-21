# Finni Patient CRM — Agent, Skill & Hook Proposal

> Audience: engineers evaluating the AI-augmented development process. This document
> proposes the Claude Code tooling that enforces the conventions in the technical spec —
> turning "no drift, no regression" from an aspiration into a mechanical guarantee. Each
> proposal states what it is, what it does, why it is necessary, and the expected effect,
> with sources.

## The governing idea: right tool, right layer

Claude Code offers three extensibility layers with distinct jobs. The single most common
failure mode is using the right tool in the wrong layer — a behavioral constraint written
as a prompt instead of a hook, a reusable workflow pasted into chat instead of packaged as
a skill, a context-heavy task left in the main session instead of delegated to a subagent.
Each misuse has a predictable cost: bloated context, unreliable enforcement, or wasted
tokens.

The three layers, per Anthropic's documentation and practitioner consensus:

- **Skills** — procedures loaded *on demand* when invoked, not before, so they don't bloat
  every session. Defined as a `SKILL.md` (YAML frontmatter + instructions) in
  `.claude/skills/`. Skills package reusable expertise with minimal token overhead;
  bundled files don't consume context until accessed.
- **Subagents** — isolated workers that run in their own context window and return only a
  summary, protecting the main session from intermediate output (logs, searches, reads).
  Defined in `.claude/agents/`. Up to ten can run simultaneously, enabling parallel work.
- **Hooks** — deterministic shell commands (or prompt/agent handlers) that fire at lifecycle
  events and run *every time, regardless of model behavior*. Configured in
  `.claude/settings.json`. The official guidance is explicit: unchanging instructions
  belong in `CLAUDE.md`; hooks are for guaranteed enforcement.

The distinction that matters most for this project: a rule in `CLAUDE.md` will *probably*
be followed; a hook *always* runs. As Anthropic's docs put it, if you tell Claude not to
modify a file it will probably listen, but a `PreToolUse` hook that blocks the write always
blocks it. For convention enforcement on a foundation meant to be iterated on, "probably"
is not good enough — hence the hook layer below.

> Sources: Claude Code hooks reference (code.claude.com/docs/en/hooks;
> docs.anthropic.com/en/docs/claude-code/hooks); Create custom subagents
> (code.claude.com/docs/en/sub-agents); "How and when to use subagents in Claude Code"
> (claude.com/blog/subagents-in-claude-code); choosing between skills/subagents/MCP
> (practitioner synthesis of the official model). Event counts vary across third-party
> write-ups (12–18+); this proposal relies only on the events documented officially and
> on the three-cadence model (per-session, per-turn, per-tool-call) from the reference.

---

## Hooks (the enforcement layer)

Hooks fire across three cadences: once per session (`SessionStart`/`SessionEnd`), once per
turn (`UserPromptSubmit`, `Stop`), and on every tool call (`PreToolUse`, `PostToolUse`).
Only `PreToolUse` can *block* an action before it runs — it is the enforcement primitive.
Command hooks signal a block via exit code 2 (exit 0 allows; exit 1 only warns). All hook
config is committed to `.claude/settings.json`, so every contributor — human or AI —
inherits identical gates.

### H1 — Pre-commit quality gate (`PreToolUse` on git commit)
- **What:** A `PreToolUse` hook matching the commit command that runs lint, type-check, and
  the affected unit tests; blocks the commit (exit 2) on any failure.
- **Why necessary:** The spec's conventions (no `any`, `@/` imports, no aliasing, unique
  names, no magic numbers) are only real if they can't be bypassed. Lint-as-documentation
  drifts; lint-as-gate does not.
- **Expected effect:** Zero commits that fail the project's own standards. Regressions are
  caught at the moment of commit, not in review or production.

### H2 — Dangerous-operation guard (`PreToolUse` on Bash/Write)
- **What:** A `PreToolUse` hook that blocks destructive or out-of-policy operations: writes
  to `.env`/secrets, force-push, direct commits to `main`, raw `DROP`/`TRUNCATE` outside
  migration files, and any `new Date()` or stray `dayjs` import outside `DateTimeUtil`.
- **Why necessary:** A healthcare-shaped codebase cannot tolerate accidental destructive
  commands or PHI-handling shortcuts. `PreToolUse` is the only layer that can stop the
  action *before* it happens.
- **Expected effect:** Whole categories of dangerous mistake become impossible rather than
  discouraged. This is the difference between a guideline and a guardrail.

### H3 — Documentation-sync gate (`PreToolUse` on git commit)
- **What:** A hook that detects changes to data shapes, enums, schema, or architectural
  rules and blocks the commit unless the matching `.docs/` file and `.docs/CHANGELOG.md`
  were updated in the same change, with a *why*.
- **Why necessary:** Docs that lag code are worse than no docs. The brief explicitly wants
  documentation to evolve *with* features (update a data object → update the docs → record
  the change and the reason). A hook makes that coupling structural.
- **Expected effect:** `.docs/` and the changelog stay continuously accurate, producing —
  for free — the decision timeline the README will draw on at v1.

### H4 — PHI-in-logs scan (`PostToolUse` on Write/Edit)
- **What:** A `PostToolUse` hook that scans newly written code for log statements that could
  emit PHI fields (name, dob, contact value) and flags them back to Claude for correction.
- **Why necessary:** "Never log PHI" is a rule a model can forget mid-flow. A
  post-write scan catches it immediately, while context is fresh. (`PostToolUse` can't undo
  the write but can prompt an immediate fix — the documented pattern.)
- **Expected effect:** The no-PHI-in-logs invariant holds in practice, not just in policy.

### H5 — Session context primer (`SessionStart`)
- **What:** A `SessionStart` hook that injects the current branch, the active build-order
  step (spec §15), and a one-line reminder of the non-negotiable rules.
- **Why necessary:** Cold-start context mismatch is a known cause of drift in long or
  resumed sessions. The model starts each session already oriented.
- **Expected effect:** Consistent behavior across sessions and contributors; less re-drift
  after compaction or a new session.

---

## Skills (the reusable-procedure layer)

Skills are invoked on demand and cost no context until used — ideal for the repeated,
structured procedures this codebase will run many times.

### S1 — `add-entity-field`
- **What:** A skill that walks the *correct order* for adding a field to an entity: shared
  type → Zod schema → Drizzle column + migration → repository scope handling → UI form +
  display → docs + changelog.
- **Why necessary:** This is the single most repeated multi-file change in the project, and
  the one most prone to half-completion (a field added to the table but not the type, or
  the form but not the docs). Encoding the sequence prevents partial changes that cause
  drift.
- **Expected effect:** Every field addition touches every required layer in the right order,
  consistently — no orphaned columns, no undocumented shape changes.

### S2 — `new-component`
- **What:** A skill that scaffolds a component the project's way: correct atomic tier,
  token-only styling (no magic values), named export, unique name, error/empty/loading
  states where applicable, a colocated test.
- **Why necessary:** Consistency across many components built over days — including in
  parallel — is exactly where hand-built UIs drift. The skill bakes the spec's UI rules
  into the starting point.
- **Expected effect:** Components are consistent *by construction*; the kitchen-sink page
  and visual-regression snapshots stay stable.

### S3 — `deep-review`
- **What:** A skill that runs three **parallel subagent reviews** of staged changes —
  security/PHI, performance (N+1 queries, needless re-renders), and convention conformance
  (the §4 rules) — and synthesizes a priority-ranked summary with file/line and fix.
- **Why necessary:** A single-pass review misses categories; parallel specialized passes
  catch more, and isolating each in a subagent keeps the main context clean. (This is the
  documented `deep-review` pattern.)
- **Expected effect:** Higher-quality review before commit/PR without polluting the main
  session — directly raising the code-quality signal the project is graded on.

---

## Subagents (the isolation + parallelism layer)

Subagents run in isolated context and return summaries; they enable the parallel build the
brief asks for without cross-contaminating context. They do **not** inherit parent skills —
required skills are preloaded explicitly in their frontmatter.

### A1 — `convention-reviewer`
- **What:** A read-only subagent (Read/Grep/Glob) that audits a diff against the §4
  conventions and the uniqueness/aliasing/`@/` rules, returning only violations.
- **Why necessary:** Some rules (global name uniqueness, no-alias intent) are hard to fully
  capture in lint; a focused agent pass closes that gap. Isolation keeps its grep output
  out of the main context.
- **Expected effect:** The conventions lint can't fully express are still enforced, cheaply.

### A2 — `slice-parallelizer`
- **What:** After the first vertical slice is approved (spec §15), this orchestration spawns
  parallel subagents to build the remaining views/features, each preloaded with the
  `new-component` skill and the slice as the reference pattern.
- **Why necessary:** The brief wants the build parallelized for speed — but only safely,
  after the pattern exists. Subagents give parallelism with context isolation so the
  workstreams don't drift into each other.
- **Expected effect:** Faster delivery to a dry run, with the parallel work converging on
  one proven pattern instead of diverging into several.

### A3 — `migration-guard`
- **What:** A subagent invoked when schema changes are detected, verifying the migration is
  reversible, indexes are documented (spec §6.3), and PHI columns retain field-level
  encryption.
- **Why necessary:** Schema mistakes are the most expensive to unwind in a system holding
  medical records. A specialized check at the moment of change is far cheaper than a
  data-loss incident later.
- **Expected effect:** Schema evolution stays safe and self-documenting as the foundation is
  iterated on.

---

## How the layers combine (the through-line)

- `CLAUDE.md` states the rules (probably-followed).
- **Skills** make the right procedure the easy procedure (followed when invoked).
- **Subagents** do focused, isolated, parallel work (followed without polluting context).
- **Hooks** make the critical rules unbreakable (followed every time, no exceptions).

Drift and regression are prevented in depth: a convention is documented (CLAUDE.md),
scaffolded correctly (skill), reviewed (subagent), and gated at commit (hook). No single
layer is load-bearing alone; together they make "no drift" the default state of the repo
rather than a thing maintained by attention.

---

## Implementation note
All of `.claude/` (agents, skills, `settings.json` with hooks) is committed to the repo, so
the enforcement travels with the codebase and applies identically to every contributor.
This is itself part of the demonstrated process: the project doesn't just *have* standards,
it ships the machinery that enforces them.
