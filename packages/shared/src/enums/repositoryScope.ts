// Read/list scope (spec §5) — const-object union, like the domain enums (§6.4). It is part of
// the HTTP contract (the ?scope= param), so it lives in the shared package: the web sends it
// and the API validates it against one definition. Default Active so PHI never leaks by default.
export const RepositoryScope = {
  Active: 'active', // live and non-archived (the default list)
  IncludeArchived: 'include-archived', // live, archived + non-archived
  IncludeDeleted: 'include-deleted', // everything, including soft-deleted
} as const;
export type RepositoryScope = (typeof RepositoryScope)[keyof typeof RepositoryScope];
