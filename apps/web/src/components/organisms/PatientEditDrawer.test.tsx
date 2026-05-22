import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { buildPatient } from '@/test/patientFixture';

vi.mock('@/api/patientsApi', () => ({
  fetchPatients: vi.fn(),
  updatePatientRequest: vi.fn(),
  archivePatientRequest: vi.fn(),
  unarchivePatientRequest: vi.fn(),
  restorePatientRequest: vi.fn(),
  softDeletePatientRequest: vi.fn(),
  purgePatientRequest: vi.fn(),
}));

import { updatePatientRequest } from '@/api/patientsApi';
import { PatientEditDrawer } from '@/components/organisms/PatientEditDrawer';

const mockedUpdate = vi.mocked(updatePatientRequest);

afterEach(() => {
  vi.clearAllMocks();
});

describe('PatientEditDrawer', () => {
  it('opens read-first and shows the patient detail before editing', () => {
    const onClose = vi.fn();
    renderWithProviders(<PatientEditDrawer patient={buildPatient()} open onClose={onClose} />);

    // View mode: identity + lifecycle are shown; the edit form is not yet present.
    expect(screen.getByRole('heading', { name: 'Avery Johnson' })).toBeInTheDocument();
    expect(screen.getByText('Lifecycle')).toBeInTheDocument();
    expect(screen.queryByLabelText('First name')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit record/i })).toBeInTheDocument();
  });

  it('submits edited fields and closes on success', async () => {
    mockedUpdate.mockResolvedValue(buildPatient({ firstName: 'Averyl' }));
    const onClose = vi.fn();
    renderWithProviders(<PatientEditDrawer patient={buildPatient()} open onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: /edit record/i }));
    const firstName = screen.getByLabelText('First name');
    await userEvent.clear(firstName);
    await userEvent.type(firstName, 'Averyl');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(mockedUpdate).toHaveBeenCalledWith('patient-1', expect.objectContaining({ firstName: 'Averyl' })),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('submits the primary address and contacts alongside the patient fields', async () => {
    mockedUpdate.mockResolvedValue(buildPatient());
    const onClose = vi.fn();
    renderWithProviders(<PatientEditDrawer patient={buildPatient()} open onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: /edit record/i }));
    const email = screen.getByLabelText('Primary email');
    await userEvent.clear(email);
    await userEvent.type(email, 'new@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(mockedUpdate).toHaveBeenCalled());
    const input = mockedUpdate.mock.calls[0]![1];
    expect(input.primaryEmail).toBe('new@example.com');
    expect(input.primaryAddress?.region).toBe('NY');
  });

  it('blocks submit and shows a field error when a required field is cleared', async () => {
    const onClose = vi.fn();
    renderWithProviders(<PatientEditDrawer patient={buildPatient()} open onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: /edit record/i }));
    await userEvent.clear(screen.getByLabelText('First name'));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(screen.getByText(/at least 1 character/i)).toBeInTheDocument());
    expect(mockedUpdate).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
