import { describe, expect, it } from 'vitest';
import { PatientStatus } from '@finni/shared';
import { buildPatient } from '@/test/patientFixture';
import { EMPTY_FILTERS } from '@/state/useCaseloadStore';
import type { CaseloadFilters } from '@/state/useCaseloadStore';
import { applyCaseloadFilters, deriveFilterFacets, patientFullName } from '@/filtering/caseloadFiltering';

// Birth years chosen far apart so age assertions hold regardless of the day the suite runs.
const young = buildPatient({
  id: 'young',
  firstName: 'Maria',
  middleName: 'Elena',
  lastName: 'Nguyen',
  dateOfBirth: '2010-03-01',
  status: PatientStatus.Inquiry,
  addresses: [{ ...buildPatient().addresses[0]!, id: 'a-young', patientId: 'young', city: 'Buffalo', region: 'NY' }],
});
const older = buildPatient({
  id: 'older',
  firstName: 'George',
  middleName: null,
  lastName: 'Park',
  dateOfBirth: '1968-09-15',
  status: PatientStatus.Active,
  addresses: [{ ...buildPatient().addresses[0]!, id: 'a-older', patientId: 'older', city: 'Austin', region: 'TX' }],
});
const sample = [young, older];

function filters(overrides: Partial<CaseloadFilters>): CaseloadFilters {
  return { ...EMPTY_FILTERS, ...overrides };
}

function ids(result: { id: string }[]): string[] {
  return result.map((entry) => entry.id);
}

describe('applyCaseloadFilters', () => {
  it('returns the whole set when no facet is constrained', () => {
    expect(ids(applyCaseloadFilters(sample, EMPTY_FILTERS))).toEqual(['young', 'older']);
  });

  it('filters by status (multi-select, empty means all)', () => {
    expect(ids(applyCaseloadFilters(sample, filters({ statuses: [PatientStatus.Active] })))).toEqual(['older']);
  });

  it('filters by region against any address', () => {
    expect(ids(applyCaseloadFilters(sample, filters({ region: 'NY' })))).toEqual(['young']);
  });

  it('filters by city case-insensitively', () => {
    expect(ids(applyCaseloadFilters(sample, filters({ city: 'austin' })))).toEqual(['older']);
  });

  it('filters by an upper and lower age bound', () => {
    expect(ids(applyCaseloadFilters(sample, filters({ ageMax: 30 })))).toEqual(['young']);
    expect(ids(applyCaseloadFilters(sample, filters({ ageMin: 40 })))).toEqual(['older']);
  });

  it('filters by insurance status (null means no constraint)', () => {
    const insured = buildPatient({ id: 'ins', hasInsurance: true });
    const uninsured = buildPatient({ id: 'unins', hasInsurance: false });
    const set = [insured, uninsured];
    expect(ids(applyCaseloadFilters(set, filters({ insured: true })))).toEqual(['ins']);
    expect(ids(applyCaseloadFilters(set, filters({ insured: false })))).toEqual(['unins']);
    expect(ids(applyCaseloadFilters(set, filters({ insured: null })))).toEqual(['ins', 'unins']);
  });

  it('searches case-insensitively across name AND location (not name-only)', () => {
    expect(ids(applyCaseloadFilters(sample, filters({ searchText: 'elena' })))).toEqual(['young']); // middle name
    expect(ids(applyCaseloadFilters(sample, filters({ searchText: 'park' })))).toEqual(['older']); // last name
    expect(ids(applyCaseloadFilters(sample, filters({ searchText: 'austin' })))).toEqual(['older']); // city
    expect(ids(applyCaseloadFilters(sample, filters({ searchText: 'buffalo' })))).toEqual(['young']); // city
  });

  it('composes arbitrary facets (the litmus example is just one combination, not special-cased)', () => {
    const result = applyCaseloadFilters(
      sample,
      filters({ statuses: [PatientStatus.Inquiry], region: 'NY', ageMax: 29 }),
    );
    expect(ids(result)).toEqual(['young']);
  });

  it('returns no matches when facets exclude everyone', () => {
    expect(applyCaseloadFilters(sample, filters({ region: 'NY', statuses: [PatientStatus.Active] }))).toHaveLength(0);
  });
});

describe('deriveFilterFacets', () => {
  it('returns sorted unique regions and cities plus age bounds from the loaded set', () => {
    const facets = deriveFilterFacets(sample);
    expect(facets.regions).toEqual(['NY', 'TX']);
    expect(facets.cities).toEqual(['Austin', 'Buffalo']);
    expect(facets.ageBounds?.min).toBeLessThan(facets.ageBounds?.max ?? 0);
  });

  it('reports null age bounds for an empty set', () => {
    expect(deriveFilterFacets([]).ageBounds).toBeNull();
  });
});

describe('patientFullName', () => {
  it('joins present name parts and skips a null middle name', () => {
    expect(patientFullName(young)).toBe('Maria Elena Nguyen');
    expect(patientFullName(older)).toBe('George Park');
  });
});
