import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientStatus } from '@finni/shared';
import { renderWithProviders } from '@/test/renderWithProviders';
import { buildPatient } from '@/test/patientFixture';
import { PatientCard } from '@/components/molecules/PatientCard';

describe('PatientCard', () => {
  it('renders name, locality, status, and the insured flag', () => {
    const patient = buildPatient({ status: PatientStatus.Active, hasInsurance: true });
    renderWithProviders(<PatientCard patient={patient} onEdit={vi.fn()} />);

    expect(screen.getByText('Avery Johnson')).toBeInTheDocument();
    expect(screen.getByText(/Buffalo, NY/)).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Insured')).toBeInTheDocument();
  });

  it('omits the insured flag when there is no insurance on file', () => {
    renderWithProviders(<PatientCard patient={buildPatient({ hasInsurance: false })} onEdit={vi.fn()} />);
    expect(screen.queryByText('Insured')).not.toBeInTheDocument();
  });

  it('calls onEdit with the patient when clicked', () => {
    const onEdit = vi.fn();
    const patient = buildPatient();
    renderWithProviders(<PatientCard patient={patient} onEdit={onEdit} />);
    screen.getByRole('button', { name: 'Edit Avery Johnson' }).click();
    expect(onEdit).toHaveBeenCalledWith(patient);
  });

  it('is keyboard-operable: focusable and activated by Enter and Space (WCAG 2.1.1)', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const patient = buildPatient();
    renderWithProviders(<PatientCard patient={patient} onEdit={onEdit} />);

    const card = screen.getByRole('button', { name: 'Edit Avery Johnson' });
    await user.tab();
    expect(card).toHaveFocus();

    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onEdit).toHaveBeenCalledTimes(2);
    expect(onEdit).toHaveBeenCalledWith(patient);
  });
});
