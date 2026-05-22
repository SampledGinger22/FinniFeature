import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { buildPatient } from '@/test/patientFixture';

vi.mock('@/api/patientsApi', () => ({
  fetchPatients: vi.fn(),
  createPatientRequest: vi.fn(),
}));

import { createPatientRequest } from '@/api/patientsApi';
import { PatientCreateDrawer } from '@/components/organisms/PatientCreateDrawer';

const mockedCreate = vi.mocked(createPatientRequest);

afterEach(() => {
  vi.clearAllMocks();
});

describe('PatientCreateDrawer', () => {
  it('blocks submit and shows validation errors when required fields are missing', async () => {
    const onClose = vi.fn();
    renderWithProviders(<PatientCreateDrawer open onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: /add patient/i }));

    await waitFor(() => expect(screen.getAllByText(/at least 1 character/i).length).toBeGreaterThan(0));
    expect(mockedCreate).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('assembles the nested input, submits, and closes on success', async () => {
    mockedCreate.mockResolvedValue(buildPatient());
    const onClose = vi.fn();
    renderWithProviders(<PatientCreateDrawer open onClose={onClose} />);

    await userEvent.type(screen.getByLabelText('First name'), 'Avery');
    await userEvent.type(screen.getByLabelText('Last name'), 'Johnson');
    await userEvent.type(screen.getByLabelText('Primary email'), 'avery@example.com');
    // State is a searchable Select; open it, filter by name, and pick the option (stores 'NY').
    await userEvent.click(screen.getByRole('combobox', { name: 'State' }));
    await userEvent.type(screen.getByRole('combobox', { name: 'State' }), 'New York');
    await userEvent.click(await screen.findByText('New York'));
    // DOB via the picker's text input, bridged through DateTimeUtil to a YYYY-MM-DD form value.
    const dob = screen.getByLabelText('Date of birth');
    await userEvent.type(dob, 'May 20, 1996');
    await userEvent.keyboard('{Enter}');

    await userEvent.click(screen.getByRole('button', { name: /add patient/i }));

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledTimes(1));
    const submitted = mockedCreate.mock.calls[0]![0];
    expect(submitted.firstName).toBe('Avery');
    expect(submitted.lastName).toBe('Johnson');
    expect(submitted.dateOfBirth).toBe('1996-05-20');
    expect(submitted.addresses[0]?.region).toBe('NY');
    expect(submitted.contactMethods[0]?.value).toBe('avery@example.com');
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
