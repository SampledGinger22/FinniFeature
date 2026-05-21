// The pglite bootstrap now lives in @/db/pglite (the dev server uses it too); re-exported here
// so existing tests keep importing it from the test helper.
export { createMigratedPgliteDb } from '@/db/pglite';
