import { DateTimeUtil, PatientStatus } from '@finni/shared';
import type { PatientWithRelations } from '@finni/shared';
import type { CaseloadFilters } from '@/state/useCaseloadStore';
import { CaseloadSortDirection, CaseloadSortField } from '@/enums/caseloadSort';

// The hero filter, implemented as one pure function over the already-loaded scoped set (spec §8,
// §9). Pure so it is unit-testable and so card/table/board share identical results. Each facet is
// independent and general — no facet special-cases any particular value.

export function patientFullName(patient: PatientWithRelations): string {
  return [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
}

// Two-letter monogram (first + last initial) for the avatar fallback in dense rows.
export function patientInitials(patient: PatientWithRelations): string {
  const first = patient.firstName.trim().charAt(0);
  const last = patient.lastName.trim().charAt(0);
  return `${first}${last}`.toUpperCase();
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

// Free-text search across every human-meaningful field on the loaded (decrypted) record: name,
// address parts, and contact values. Client-side over the loaded set, like the other facets.
function patientSearchHaystack(patient: PatientWithRelations): string {
  const addressParts = patient.addresses.flatMap((address) => [
    address.line1,
    address.line2,
    address.city,
    address.region,
    address.postalCode,
    address.country,
  ]);
  const contactParts = patient.contactMethods.map((method) => method.value);
  return [patientFullName(patient), ...addressParts, ...contactParts]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function matchesInsurance(patient: PatientWithRelations, insured: boolean | null): boolean {
  return insured === null || patient.hasInsurance === insured;
}

function matchesSearch(patient: PatientWithRelations, searchText: string): boolean {
  const needle = searchText.trim().toLowerCase();
  return needle === '' || patientSearchHaystack(patient).includes(needle);
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
      matchesInsurance(patient, filters.insured) &&
      matchesSearch(patient, filters.searchText),
  );
}

// Status ranks by lifecycle order (the enum's declared order), not alphabetically, so a status
// sort reads as care progression rather than A→Z label noise.
const STATUS_RANK: Record<PatientStatus, number> = Object.values(PatientStatus).reduce(
  (rank, status, index) => ({ ...rank, [status]: index }),
  {} as Record<PatientStatus, number>,
);

// The single ascending comparator for a field, shared by the data layer and the table's column
// sorters so the two can never drift (one ordering, defined once).
export function compareCaseloadPatients(
  field: CaseloadSortField,
  a: PatientWithRelations,
  b: PatientWithRelations,
): number {
  if (field === CaseloadSortField.Age) {
    return DateTimeUtil.calculateAge(a.dateOfBirth) - DateTimeUtil.calculateAge(b.dateOfBirth);
  }
  if (field === CaseloadSortField.Status) {
    return STATUS_RANK[a.status] - STATUS_RANK[b.status];
  }
  return patientFullName(a).localeCompare(patientFullName(b));
}

// One shared ordering applied after filtering so card and table render the SAME sequence (spec
// §8). Pure and stable — returns a new array, leaving the source untouched. Name is the default.
export function sortCaseloadPatients(
  patients: PatientWithRelations[],
  field: CaseloadSortField,
  direction: CaseloadSortDirection,
): PatientWithRelations[] {
  const factor = direction === CaseloadSortDirection.Desc ? -1 : 1;
  return [...patients].sort((a, b) => compareCaseloadPatients(field, a, b) * factor);
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
