import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientStatus, RepositoryScope } from '@finni/shared';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useCaseloadStore } from '@/state/useCaseloadStore';
import { CaseloadFilterBar } from '@/components/organisms/CaseloadFilterBar';
import type { CaseloadFacets } from '@/filtering/caseloadFiltering';

const facets: CaseloadFacets = {
  regions: ['NY', 'TX'],
  cities: ['Buffalo', 'Austin'],
  ageBounds: { min: 10, max: 60 },
};

afterEach(() => {
  // Unmount before mutating the store so the reset does not re-render a live component (act noise).
  cleanup();
  useCaseloadStore.getState().resetFilters();
  useCaseloadStore.getState().setScope(RepositoryScope.Active);
});

describe('CaseloadFilterBar', () => {
  it('writes the typed search text into the store', async () => {
    renderWithProviders(<CaseloadFilterBar facets={facets} />);

    await userEvent.type(screen.getByLabelText('Search'), 'avery');

    expect(useCaseloadStore.getState().filters.searchText).toBe('avery');
  });

  it('writes a selected status into the store', async () => {
    renderWithProviders(<CaseloadFilterBar facets={facets} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Status' }));
    await userEvent.click(await screen.findByTitle('Onboarding'));

    expect(useCaseloadStore.getState().filters.statuses).toEqual([PatientStatus.Onboarding]);
  });

  it('writes a selected region from the provided facets', async () => {
    renderWithProviders(<CaseloadFilterBar facets={facets} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Region' }));
    await userEvent.click(await screen.findByTitle('TX'));

    expect(useCaseloadStore.getState().filters.region).toBe('TX');
  });

  it('writes min and max age into the store from the number inputs', async () => {
    renderWithProviders(<CaseloadFilterBar facets={facets} />);

    await userEvent.type(screen.getByRole('spinbutton', { name: 'Minimum age' }), '5');
    await userEvent.type(screen.getByRole('spinbutton', { name: 'Maximum age' }), '12');

    expect(useCaseloadStore.getState().filters.ageMin).toBe(5);
    expect(useCaseloadStore.getState().filters.ageMax).toBe(12);
  });

  it('writes the insurance facet into the store', async () => {
    renderWithProviders(<CaseloadFilterBar facets={facets} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Insurance' }));
    await userEvent.click(await screen.findByTitle('not insured'));

    expect(useCaseloadStore.getState().filters.insured).toBe(false);
  });

  it('toggles the scope to include archived via the Show archived checkbox', async () => {
    renderWithProviders(<CaseloadFilterBar facets={facets} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Show archived' });
    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);

    expect(useCaseloadStore.getState().scope).toBe(RepositoryScope.IncludeArchived);
  });

  it('clears every filter on reset', async () => {
    useCaseloadStore.getState().setSearchText('avery');
    useCaseloadStore.getState().setRegion('NY');
    renderWithProviders(<CaseloadFilterBar facets={facets} />);

    await userEvent.click(screen.getByRole('button', { name: 'Reset filters' }));

    const filters = useCaseloadStore.getState().filters;
    expect(filters.searchText).toBe('');
    expect(filters.region).toBeNull();
  });
});
