import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, within } from '@testing-library/react';
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';
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
    renderWithProviders(<CaseloadFilterBar facets={facets} totalLoaded={5} matchCount={5} />);

    await userEvent.type(screen.getByLabelText('Search'), 'avery');

    expect(useCaseloadStore.getState().filters.searchText).toBe('avery');
  });

  it('writes a selected status into the store', async () => {
    renderWithProviders(<CaseloadFilterBar facets={facets} totalLoaded={5} matchCount={5} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Status' }));
    await userEvent.click(await screen.findByTitle('Onboarding'));

    expect(useCaseloadStore.getState().filters.statuses).toEqual([PatientStatus.Onboarding]);
  });

  it('writes a selected region from the provided facets', async () => {
    renderWithProviders(<CaseloadFilterBar facets={facets} totalLoaded={5} matchCount={5} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Region' }));
    await userEvent.click(await screen.findByTitle('TX'));

    expect(useCaseloadStore.getState().filters.region).toBe('TX');
  });

  it('switches the scope to include archived (trash lives on its own page, not here)', async () => {
    // antd Segmented disables pointer-events on its hidden radios; skip the jsdom check.
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    renderWithProviders(<CaseloadFilterBar facets={facets} totalLoaded={5} matchCount={5} />);

    expect(screen.queryByRole('radio', { name: 'Trash' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Archived' }));

    expect(useCaseloadStore.getState().scope).toBe(RepositoryScope.IncludeArchived);
  });

  it('renders the live count and clears every filter on reset', async () => {
    useCaseloadStore.getState().setSearchText('avery');
    useCaseloadStore.getState().setRegion('NY');
    renderWithProviders(<CaseloadFilterBar facets={facets} totalLoaded={5} matchCount={2} />);

    expect(screen.getByText('2 of 5')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reset filters' }));

    const filters = useCaseloadStore.getState().filters;
    expect(filters.searchText).toBe('');
    expect(filters.region).toBeNull();
  });

  it('omits the age control when no age bounds are present', () => {
    const noAgeFacets: CaseloadFacets = { regions: ['NY'], cities: ['Buffalo'], ageBounds: null };
    const { container } = renderWithProviders(
      <CaseloadFilterBar facets={noAgeFacets} totalLoaded={1} matchCount={1} />,
    );

    expect(within(container).queryByText('Age')).not.toBeInTheDocument();
  });
});
