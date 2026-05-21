import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { buildPatient } from '@/test/patientFixture';
import { CaseloadView } from '@/components/organisms/CaseloadView';

const noop = (): void => undefined;

describe('CaseloadView', () => {
  it('shows an error alert with a retry action', () => {
    const onRetry = vi.fn();
    renderWithProviders(
      <CaseloadView patients={undefined} isLoading={false} isError onRetry={onRetry} onEditPatient={noop} />,
    );
    expect(screen.getByText('Could not load patients')).toBeInTheDocument();
    screen.getByRole('button', { name: 'Retry' }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows the empty state when there are no patients', () => {
    renderWithProviders(
      <CaseloadView patients={[]} isLoading={false} isError={false} onRetry={noop} onEditPatient={noop} />,
    );
    expect(screen.getByText('No patients in this view yet')).toBeInTheDocument();
  });

  it('renders a card per patient when data is present', () => {
    const patients = [buildPatient({ id: 'p1', firstName: 'Avery' }), buildPatient({ id: 'p2', firstName: 'Mateo' })];
    renderWithProviders(
      <CaseloadView patients={patients} isLoading={false} isError={false} onRetry={noop} onEditPatient={noop} />,
    );
    expect(screen.getByText('Avery Johnson')).toBeInTheDocument();
    expect(screen.getByText('Mateo Johnson')).toBeInTheDocument();
  });
});
