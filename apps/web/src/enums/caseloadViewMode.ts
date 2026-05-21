// The three caseload presentations (§8) share ONE data + filter layer; the view mode only
// changes rendering, never the data, so switching views never refetches. Const-object union
// per the project enum rule (never native enum). Web-only UI state, so it lives here, not in
// @finni/shared (it is not part of the API contract).
export const CaseloadViewMode = {
  Card: 'card',
  Table: 'table',
  Board: 'board',
} as const;
export type CaseloadViewMode = (typeof CaseloadViewMode)[keyof typeof CaseloadViewMode];
