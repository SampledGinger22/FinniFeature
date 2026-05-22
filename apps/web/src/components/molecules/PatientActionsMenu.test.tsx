import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientStatus } from '@finni/shared';
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
import { PatientActionsMenu } from '@/components/molecules/PatientActionsMenu';

const mockedUpdate = vi.mocked(updatePatientRequest);

afterEach(() => {
  vi.clearAllMocks();
});

describe('PatientActionsMenu', () => {
  it('offers Set status, Archive, and Delete for an active patient', async () => {
    renderWithProviders(<PatientActionsMenu patient={buildPatient()} />);

    await userEvent.click(screen.getByRole('button', { name: /actions for/i }));

    expect(await screen.findByText('Set status')).toBeInTheDocument();
    expect(screen.getByText('Archive')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('quick-updates the status from the Set status submenu', async () => {
    mockedUpdate.mockResolvedValue(buildPatient({ status: PatientStatus.Active }));
    renderWithProviders(<PatientActionsMenu patient={buildPatient({ status: PatientStatus.Inquiry })} />);

    await userEvent.click(screen.getByRole('button', { name: /actions for/i }));
    await userEvent.hover(await screen.findByText('Set status'));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Active' }));

    expect(mockedUpdate).toHaveBeenCalledWith('patient-1', expect.objectContaining({ status: PatientStatus.Active }));
  });

  it('shows Reactivate instead of Archive for an archived patient', async () => {
    renderWithProviders(<PatientActionsMenu patient={buildPatient({ archived: true })} />);

    await userEvent.click(screen.getByRole('button', { name: /actions for/i }));

    expect(await screen.findByText('Reactivate')).toBeInTheDocument();
    expect(screen.queryByText('Archive')).not.toBeInTheDocument();
  });
});
