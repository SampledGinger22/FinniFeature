import { describe, it, expect, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { useCaseloadStore } from '@/state/useCaseloadStore';
import { CaseloadSortDirection, CaseloadSortField } from '@/enums/caseloadSort';
import { CaseloadSortControl } from '@/components/molecules/CaseloadSortControl';

// Reset the shared caseload sort after each case so state never bleeds between tests.
afterEach(() => {
  useCaseloadStore.getState().setSort(CaseloadSortField.Name, CaseloadSortDirection.Asc);
});

describe('CaseloadSortControl', () => {
  it('defaults to sorting by Name ascending', () => {
    renderWithProviders(<CaseloadSortControl />);
    expect(screen.getByRole('combobox', { name: 'Sort patients by' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sort ascending' })).toBeInTheDocument();
  });

  it('writes the chosen field to the shared store', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CaseloadSortControl />);

    await user.click(screen.getByRole('combobox', { name: 'Sort patients by' }));
    await user.click(await screen.findByText('Age'));

    expect(useCaseloadStore.getState().sortField).toBe(CaseloadSortField.Age);
    expect(useCaseloadStore.getState().sortDirection).toBe(CaseloadSortDirection.Asc);
  });

  it('toggles direction without changing the field', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CaseloadSortControl />);

    await user.click(screen.getByRole('button', { name: 'Sort ascending' }));

    expect(useCaseloadStore.getState().sortDirection).toBe(CaseloadSortDirection.Desc);
    expect(useCaseloadStore.getState().sortField).toBe(CaseloadSortField.Name);
    expect(screen.getByRole('button', { name: 'Sort descending' })).toBeInTheDocument();
  });
});
