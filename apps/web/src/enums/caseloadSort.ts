// Shared caseload ordering (web-only UI state, like CaseloadViewMode). One sort drives BOTH card
// and table views so they always agree; default is name A→Z. Const-object union per the project
// enum rule (never native enum). Not part of the API contract, so it lives here, not in shared.
export const CaseloadSortField = {
  Name: 'name',
  Age: 'age',
  Status: 'status',
} as const;
export type CaseloadSortField = (typeof CaseloadSortField)[keyof typeof CaseloadSortField];

export const CaseloadSortDirection = {
  Asc: 'asc',
  Desc: 'desc',
} as const;
export type CaseloadSortDirection = (typeof CaseloadSortDirection)[keyof typeof CaseloadSortDirection];
