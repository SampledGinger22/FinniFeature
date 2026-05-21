---
name: deep-review
description: Run three parallel specialized reviews of staged changes (security/PHI, performance, convention conformance) and synthesize a priority-ranked summary with file/line and fix. Use before a commit or PR on non-trivial changes.
---

# deep-review

A single-pass review misses categories. Run three specialized passes in parallel, each in
an isolated subagent (so their grep/read output never pollutes the main context), then
synthesize.

## Procedure

1. Identify the staged diff (`git diff --cached`). Scope the review to it.
2. Spawn these three subagents **in parallel** (one message, multiple Agent calls):
   - **Security / PHI** — field-level encryption present on PHI columns; no PHI in logs or
     client storage (logs use patient UUID only); scoped repository queries; no secrets in
     code. (Spec §11.)
   - **Performance** — N+1 queries (the patient→address/contact joins), needless React
     re-renders, missing query keys/invalidation, unindexed filter paths (spec §6.3).
   - **Convention conformance** — the §4 rules C1–C9: no `any`, `@/` imports, no aliasing,
     globally unique names, named exports, token-only styles, comment discipline, dates via
     DateTimeUtil. Delegate to the `convention-reviewer` agent.
3. **Synthesize** the three reports into one priority-ranked list: Critical → High → Medium
   → Low, each with `file:line` and a concrete fix. Deduplicate overlaps.

## Output
A single ranked summary. Do not dump the subagents' raw output into the main context —
report only the synthesized findings.
