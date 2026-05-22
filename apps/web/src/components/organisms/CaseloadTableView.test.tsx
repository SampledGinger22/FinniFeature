import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { DateTimeUtil, PatientStatus } from '@finni/shared';
import { renderWithProviders } from '@/test/renderWithProviders';
import { buildPatient } from '@/test/patientFixture';
import { CaseloadTableView } from '@/components/organisms/CaseloadTableView';

describe('CaseloadTableView', () => {
  it('renders both patient names in the table', () => {
    const patients = [
      buildPatient({ id: 'p1', firstName: 'Avery', lastName: 'Johnson' }),
      buildPatient({ id: 'p2', firstName: 'Mateo', lastName: 'Rivera' }),
    ];
    renderWithProviders(<CaseloadTableView patients={patients} onEditPatient={vi.fn()} />);

    expect(screen.getByText('Avery Johnson')).toBeInTheDocument();
    expect(screen.getByText('Mateo Rivera')).toBeInTheDocument();
  });

  it('shows a derived age for each patient', () => {
    const patient = buildPatient({ id: 'p1', dateOfBirth: '2000-01-01' });
    renderWithProviders(<CaseloadTableView patients={[patient]} onEditPatient={vi.fn()} />);

    const age = DateTimeUtil.calculateAge('2000-01-01');
    expect(screen.getByText(String(age))).toBeInTheDocument();
  });

  it('shows an insurance pill for insured and "Not on file" for uninsured', () => {
    const patients = [
      buildPatient({ id: 'p1', firstName: 'Insured', lastName: 'One', hasInsurance: true }),
      buildPatient({ id: 'p2', firstName: 'Uninsured', lastName: 'Two', hasInsurance: false }),
    ];
    renderWithProviders(<CaseloadTableView patients={patients} onEditPatient={vi.fn()} />);
    expect(screen.getByText('Insured')).toBeInTheDocument();
    expect(screen.getByText('Not on file')).toBeInTheDocument();
  });

  it('renders a derived attention reason for an inquiry patient', () => {
    const patient = buildPatient({ id: 'p1', status: PatientStatus.Inquiry });
    renderWithProviders(<CaseloadTableView patients={[patient]} onEditPatient={vi.fn()} />);
    expect(screen.getByText('Awaiting intake call')).toBeInTheDocument();
  });

  it('marks archived patients with an Archived flag', () => {
    const patient = buildPatient({ id: 'p1', firstName: 'Archie', lastName: 'Ved', archived: true });
    renderWithProviders(<CaseloadTableView patients={[patient]} onEditPatient={vi.fn()} />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('calls onEditPatient with the correct patient when a row is clicked', () => {
    const onEditPatient = vi.fn();
    const patientA = buildPatient({ id: 'p1', firstName: 'Avery', lastName: 'Johnson' });
    const patientB = buildPatient({ id: 'p2', firstName: 'Mateo', lastName: 'Rivera' });
    renderWithProviders(
      <CaseloadTableView patients={[patientA, patientB]} onEditPatient={onEditPatient} />,
    );

    // Click on the first patient's name cell — the row click handler fires.
    screen.getByText('Avery Johnson').click();
    expect(onEditPatient).toHaveBeenCalledWith(patientA);
    expect(onEditPatient).not.toHaveBeenCalledWith(patientB);
  });
});
