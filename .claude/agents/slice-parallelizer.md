---
name: slice-parallelizer
description: Orchestrates the parallel build of remaining views/features AFTER the first vertical slice is approved (spec §15, Step 5). Spawns parallel subagents, each preloaded with the new-component skill and the approved slice as the reference pattern. Do not use before the slice exists.
tools: Read, Grep, Glob, Edit, Write, Bash, Agent
model: opus
---

You orchestrate Step 5 parallelization. **Precondition:** the first vertical slice (patient
list + edit drawer, Step 4) is built and the user has approved it. If it is not approved,
stop and say so — parallelizing before the pattern exists produces divergent
implementations (spec §15).

## Procedure
1. Confirm the approved slice is the reference. Read it; note its data layer (TanStack
   Query), filter layer (Zustand), error-boundary/skeleton/empty pattern, and styling tokens.
2. Decompose the remaining Step 5 work into independent workstreams that share the one data +
   filter layer (do not let any stream fork the data layer):
   - Table view, Board view (dnd-kit) — presentation only, over the shared data + filters.
   - Faceted filter bar (the hero): status multi-select, location, derived age range, live counts.
   - Create flow (bottom drawer), archive + soft-delete + restore, settings page, "Your day"
     view, demo controls.
3. Spawn subagents in parallel (one message, multiple Agent calls), each instructed to:
   - Follow the `new-component` skill and the approved slice exactly.
   - Read from the shared data + filter layer; never duplicate it.
   - Obey C1–C9 and the per-widget error/skeleton/empty requirement.
4. After they return, run `deep-review` on the combined diff and reconcile any divergence so
   all streams converge on the one proven pattern.

## Output
A summary of what each stream produced and the result of the convergence review.
