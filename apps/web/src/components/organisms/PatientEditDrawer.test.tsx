import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { buildPatient } from '@/test/patientFixture';

vi.mock('@/api/patientsApi', () => ({
  fetchPatients: vi.fn(),
  updatePatientRequest: vi.fn(),
}));

import { updatePatientRequest } from '@/api/patientsApi';
import { PatientEditDrawer } from '@/components/organisms/PatientEditDrawer';

const mockedUpdate = vi.mocked(updatePatientRequest);

afterEach(() => {
  vi.clearAllMocks();
});

describe('PatientEditDrawer', () => {
  it('submits edited fields and closes on success', async () => {
    mockedUpdate.mockResolvedValue(buildPatient({ firstName: 'Averyl' }));
    const onClose = vi.fn();
    renderWithProviders(<PatientEditDrawer patient={buildPatient()} open onClose={onClose} />);

    const firstName = screen.getByLabelText('First name');
    await userEvent.clear(firstName);
    await userEvent.type(firstName, 'Averyl');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(mockedUpdate).toHaveBeenCalledWith('patient-1', expect.objectContaining({ firstName: 'Averyl' })),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('blocks submit and shows a field error when a required field is cleared', async () => {
    const onClose = vi.fn();
    renderWithProviders(<PatientEditDrawer patient={buildPatient()} open onClose={onClose} />);

    await userEvent.clear(screen.getByLabelText('First name'));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(screen.getByText(/at least 1 character/i)).toBeInTheDocument());
    expect(mockedUpdate).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
