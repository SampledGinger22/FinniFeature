// Re-export the scope contract from @finni/shared (D51): it is now part of the HTTP contract,
// so it is defined once in shared. This local path stays valid for existing API imports, and
// the single name carries both the value and the union type (declaration merging in shared).
export { RepositoryScope } from '@finni/shared';
