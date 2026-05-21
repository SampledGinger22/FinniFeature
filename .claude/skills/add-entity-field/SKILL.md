---
name: add-entity-field
description: Add a field to a domain entity (patient/address/contact_method) in the correct order across every layer so nothing is left half-wired. Use whenever adding, renaming, or removing a column/field on a @finni entity.
---

# add-entity-field

Adding a field is the most-repeated multi-file change in this codebase and the one most
prone to half-completion (column added but type not updated; form updated but docs not).
Follow this exact order. Do not skip a step; a partial change is drift.

## Order (each step must be done before the next)

1. **Shared type** — `packages/shared/src/...`: add the field to the entity interface/type.
   This is the contract; everything else conforms to it.
2. **Enum (if the field is enumerated)** — add a const-object union (spec §6.4), never a
   native `enum`. Export it from `@finni/shared`.
3. **Zod schema** — update the creation/update schema in `@finni/shared`. The form and the
   API share this schema; update it once. Mark required vs optional per spec §6.5.
4. **Drizzle column + migration** — add the column with the correct type. If it is PHI
   (name/dob/contact value), it is encrypted in the repository layer — see
   `migration-guard`. Document any new index with its *why* (spec §6.3). Generate a
   reversible migration.
5. **Repository** — ensure every scoped find/insert/update handles the new field, and that
   PHI fields are encrypted on write / decrypted on read in this layer only.
6. **Service** — thread the field through create/update orchestration and transactions.
7. **UI form + display** — add the input to the create (bottom) / edit (right) drawer using
   the shared Zod schema for validation; render it in the relevant view(s).
8. **Tests** — extend the repository scope test and the Zod schema test.
9. **Docs + changelog (same commit)** — update the relevant `.docs/` file (usually
   `02-technical-spec.md` §6) AND append to `.docs/CHANGELOG.md` (what + why). The H3 hook
   blocks the commit otherwise.

## Guardrails
- No `any`; `@/` imports only; globally unique names; named exports.
- If the field is PHI, confirm encryption + that it is never logged (logs use patient UUID).
