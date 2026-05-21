import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { PatientStatus } from '@finni/shared';
import { renderWithProviders } from '@/test/renderWithProviders';
import { buildPatient } from '@/test/patientFixture';
import { CaseloadBoardView } from '@/components/organisms/CaseloadBoardView';
import {
  caseloadBoardColumns,
  groupPatientsByStatus,
  resolveStatusChange,
} from '@/components/organisms/caseloadBoard';

describe('caseloadBoard helpers', () => {
  const inquiry = buildPatient({ id: 'p-inquiry', status: PatientStatus.Inquiry });
  const active = buildPatient({ id: 'p-active', status: PatientStatus.Active });

  it('orders columns by the shared lifecycle enum', () => {
    expect(caseloadBoardColumns).toEqual(Object.values(PatientStatus));
  });

  it('groups patients into a bucket per status, empty columns included', () => {
    const groups = groupPatientsByStatus([inquiry, active]);
    expect(groups[PatientStatus.Inquiry]).toEqual([inquiry]);
    expect(groups[PatientStatus.Active]).toEqual([active]);
    expect(groups[PatientStatus.Paused]).toEqual([]);
  });

  it('resolves a drop onto a different column into a status change', () => {
    const change = resolveStatusChange('p-inquiry', PatientStatus.Active, [inquiry, active]);
    expect(change).toEqual({ patient: inquiry, newStatus: PatientStatus.Active });
  });

  it('returns null when dropped onto its own column (no-op)', () => {
    expect(resolveStatusChange('p-inquiry', PatientStatus.Inquiry, [inquiry, active])).toBeNull();
  });

  it('returns null with no drop target, unknown patient, or unknown status', () => {
    expect(resolveStatusChange('p-inquiry', null, [inquiry])).toBeNull();
    expect(resolveStatusChange('missing', PatientStatus.Active, [inquiry])).toBeNull();
    expect(resolveStatusChange('p-inquiry', 'not-a-status', [inquiry])).toBeNull();
  });
});

describe('CaseloadBoardView', () => {
  const inquiry = buildPatient({ id: 'p-inquiry', firstName: 'Ivy', lastName: 'Inq', status: PatientStatus.Inquiry });
  const activeOne = buildPatient({ id: 'p-a1', firstName: 'Al', lastName: 'One', status: PatientStatus.Active });
  const activeTwo = buildPatient({ id: 'p-a2', firstName: 'Bea', lastName: 'Two', status: PatientStatus.Active });

  it('renders each status column with its patients and counts', () => {
    renderWithProviders(
      <CaseloadBoardView patients={[inquiry, activeOne, activeTwo]} onEditPatient={vi.fn()} />,
    );

    const activeColumn = screen.getByLabelText('Active column');
    expect(within(activeColumn).getByText('2')).toBeInTheDocument();
    expect(within(activeColumn).getByText('Al One')).toBeInTheDocument();
    expect(within(activeColumn).getByText('Bea Two')).toBeInTheDocument();

    const inquiryColumn = screen.getByLabelText('Inquiry column');
    expect(within(inquiryColumn).getByText('1')).toBeInTheDocument();
    expect(within(inquiryColumn).getByText('Ivy Inq')).toBeInTheDocument();

    const pausedColumn = screen.getByLabelText('Paused column');
    expect(within(pausedColumn).getByText('0')).toBeInTheDocument();
    expect(within(pausedColumn).getByText('No patients')).toBeInTheDocument();
  });

  it('calls onEditPatient when a card is clicked', () => {
    const onEditPatient = vi.fn();
    renderWithProviders(<CaseloadBoardView patients={[inquiry]} onEditPatient={onEditPatient} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit Ivy Inq' }));
    expect(onEditPatient).toHaveBeenCalledWith(inquiry);
  });
});
