import { DateTimeUtil } from '@finni/shared';
import type { PatientWithRelations } from '@finni/shared';
import type { CaseloadFilters } from '@/state/useCaseloadStore';

// The hero filter, implemented as one pure function over the already-loaded scoped set (spec §8,
// §9). Pure so it is unit-testable and so card/table/board share identical results. Each facet is
// independent and general — no facet special-cases any particular value.

export function patientFullName(patient: PatientWithRelations): string {
  return [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
}

function matchesStatus(patient: PatientWithRelations, filters: CaseloadFilters): boolean {
  return filters.statuses.length === 0 || filters.statuses.includes(patient.status);
}

function matchesRegion(patient: PatientWithRelations, region: string | null): boolean {
  return region === null || patient.addresses.some((address) => address.region === region);
}

function matchesCity(patient: PatientWithRelations, city: string | null): boolean {
  if (city === null) return true;
  const needle = city.toLowerCase();
  return patient.addresses.some((address) => (address.city ?? '').toLowerCase() === needle);
}

function matchesAge(patient: PatientWithRelations, filters: CaseloadFilters): boolean {
  if (filters.ageMin === null && filters.ageMax === null) return true;
  const age = DateTimeUtil.calculateAge(patient.dateOfBirth);
  if (filters.ageMin !== null && age < filters.ageMin) return false;
  if (filters.ageMax !== null && age > filters.ageMax) return false;
  return true;
}

function matchesName(patient: PatientWithRelations, nameSearch: string): boolean {
  const needle = nameSearch.trim().toLowerCase();
  return needle === '' || patientFullName(patient).toLowerCase().includes(needle);
}

export function applyCaseloadFilters(
  patients: PatientWithRelations[],
  filters: CaseloadFilters,
): PatientWithRelations[] {
  return patients.filter(
    (patient) =>
      matchesStatus(patient, filters) &&
      matchesRegion(patient, filters.region) &&
      matchesCity(patient, filters.city) &&
      matchesAge(patient, filters) &&
      matchesName(patient, filters.nameSearch),
  );
}

export interface CaseloadFacets {
  regions: string[];
  cities: string[];
  ageBounds: { min: number; max: number } | null;
}

// Derive the selectable options from the loaded set so the filter bar is general (it offers
// exactly the regions/cities/ages present, never a hardcoded list).
export function deriveFilterFacets(patients: PatientWithRelations[]): CaseloadFacets {
  const regions = new Set<string>();
  const cities = new Set<string>();
  const ages: number[] = [];
  for (const patient of patients) {
    for (const address of patient.addresses) {
      regions.add(address.region);
      if (address.city) cities.add(address.city);
    }
    ages.push(DateTimeUtil.calculateAge(patient.dateOfBirth));
  }
  return {
    regions: [...regions].sort((a, b) => a.localeCompare(b)),
    cities: [...cities].sort((a, b) => a.localeCompare(b)),
    ageBounds: ages.length > 0 ? { min: Math.min(...ages), max: Math.max(...ages) } : null,
  };
}
