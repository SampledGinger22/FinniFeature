import { useMemo } from 'react';
import type { PatientWithRelations } from '@finni/shared';
import { useCaseloadStore } from '@/state/useCaseloadStore';
import { applyCaseloadFilters, deriveFilterFacets, sortCaseloadPatients } from '@/filtering/caseloadFiltering';
import type { CaseloadFacets } from '@/filtering/caseloadFiltering';

export interface FilteredCaseload {
  patients: PatientWithRelations[];
  facets: CaseloadFacets;
  totalLoaded: number;
  matchCount: number;
}

// The single read path every view and the filter bar use: apply the active filters to the loaded
// scoped set, memoized so view switches and unrelated re-renders never refilter. Live counts
// (totalLoaded vs matchCount) back the filter bar's result tally.
export function useFilteredPatients(loaded: PatientWithRelations[] | undefined): FilteredCaseload {
  const filters = useCaseloadStore((state) => state.filters);
  const sortField = useCaseloadStore((state) => state.sortField);
  const sortDirection = useCaseloadStore((state) => state.sortDirection);
  return useMemo(() => {
    const source = loaded ?? [];
    const patients = sortCaseloadPatients(applyCaseloadFilters(source, filters), sortField, sortDirection);
    return {
      patients,
      facets: deriveFilterFacets(source),
      totalLoaded: source.length,
      matchCount: patients.length,
    };
  }, [loaded, filters, sortField, sortDirection]);
}
