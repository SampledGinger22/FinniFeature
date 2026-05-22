import { create } from 'zustand';
import { PatientStatus, RepositoryScope } from '@finni/shared';
import { CaseloadViewMode } from '@/enums/caseloadViewMode';

// The hero compound filter (§9). Empty/null means "no constraint on this facet" — it is general,
// never hardcoded to a specific query. Scope is the one server dimension; the rest run client-side
// over the loaded set. Deliberately NOT persisted: searchText can hold PHI (it matches names,
// emails, phones, addresses), which never touches localStorage (only prefs do).
export interface CaseloadFilters {
  statuses: PatientStatus[];
  region: string | null;
  city: string | null;
  ageMin: number | null;
  ageMax: number | null;
  searchText: string;
}

export const EMPTY_FILTERS: CaseloadFilters = {
  statuses: [],
  region: null,
  city: null,
  ageMin: null,
  ageMax: null,
  searchText: '',
};

// Default board layout shows every status column; the chooser lets a provider hide ones they
// don't track (e.g. waitlisted, churned). Separate from filters so resetFilters never clears it.
const ALL_STATUSES: PatientStatus[] = Object.values(PatientStatus);

interface CaseloadState {
  viewMode: CaseloadViewMode;
  scope: RepositoryScope;
  filters: CaseloadFilters;
  boardStatuses: PatientStatus[];
  setViewMode: (mode: CaseloadViewMode) => void;
  setScope: (scope: RepositoryScope) => void;
  setBoardStatuses: (statuses: PatientStatus[]) => void;
  setStatuses: (statuses: PatientStatus[]) => void;
  toggleStatus: (status: PatientStatus) => void;
  setRegion: (region: string | null) => void;
  setCity: (city: string | null) => void;
  setAgeRange: (min: number | null, max: number | null) => void;
  setSearchText: (value: string) => void;
  resetFilters: () => void;
}

export const useCaseloadStore = create<CaseloadState>()((set) => ({
  viewMode: CaseloadViewMode.Card,
  scope: RepositoryScope.Active,
  filters: EMPTY_FILTERS,
  boardStatuses: ALL_STATUSES,
  setViewMode: (viewMode) => set({ viewMode }),
  setScope: (scope) => set({ scope }),
  setBoardStatuses: (boardStatuses) => set({ boardStatuses }),
  setStatuses: (statuses) => set((state) => ({ filters: { ...state.filters, statuses } })),
  toggleStatus: (status) =>
    set((state) => {
      const present = state.filters.statuses.includes(status);
      const statuses = present
        ? state.filters.statuses.filter((entry) => entry !== status)
        : [...state.filters.statuses, status];
      return { filters: { ...state.filters, statuses } };
    }),
  setRegion: (region) => set((state) => ({ filters: { ...state.filters, region } })),
  setCity: (city) => set((state) => ({ filters: { ...state.filters, city } })),
  setAgeRange: (ageMin, ageMax) => set((state) => ({ filters: { ...state.filters, ageMin, ageMax } })),
  setSearchText: (searchText) => set((state) => ({ filters: { ...state.filters, searchText } })),
  resetFilters: () => set({ filters: EMPTY_FILTERS }),
}));
