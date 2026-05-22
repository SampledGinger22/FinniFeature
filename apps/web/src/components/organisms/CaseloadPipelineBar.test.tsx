import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientStatus } from '@finni/shared';
import { renderWithProviders } from '@/test/renderWithProviders';
import { buildPatient } from '@/test/patientFixture';
import { useCaseloadStore } from '@/state/useCaseloadStore';
import { CaseloadPipelineBar } from '@/components/organisms/CaseloadPipelineBar';
import { derivePipelineSegments } from '@/components/organisms/caseloadPipeline';

afterEach(() => {
  cleanup();
  useCaseloadStore.getState().resetFilters();
});

describe('derivePipelineSegments', () => {
  it('counts each status in lifecycle order, including zeros', () => {
    const segments = derivePipelineSegments([
      buildPatient({ id: 'a', status: PatientStatus.Inquiry }),
      buildPatient({ id: 'b', status: PatientStatus.Inquiry }),
      buildPatient({ id: 'c', status: PatientStatus.Active }),
    ]);
    expect(segments).toHaveLength(Object.values(PatientStatus).length);
    expect(segments[0]).toEqual({ status: PatientStatus.Inquiry, count: 2 });
    const active = segments.find((segment) => segment.status === PatientStatus.Active);
    const churned = segments.find((segment) => segment.status === PatientStatus.Churned);
    expect(active?.count).toBe(1);
    expect(churned?.count).toBe(0);
  });
});

describe('CaseloadPipelineBar', () => {
  const patients = [
    buildPatient({ id: 'a', status: PatientStatus.Inquiry }),
    buildPatient({ id: 'b', status: PatientStatus.Active }),
  ];

  it('renders the match/total count', () => {
    renderWithProviders(<CaseloadPipelineBar patients={patients} matchCount={2} />);
    expect(screen.getByText('2 match · 2 total')).toBeInTheDocument();
  });

  it('toggles the status filter when a segment is clicked', async () => {
    renderWithProviders(<CaseloadPipelineBar patients={patients} matchCount={2} />);

    await userEvent.click(screen.getByRole('button', { name: 'Active, 1 patients' }));

    expect(useCaseloadStore.getState().filters.statuses).toEqual([PatientStatus.Active]);
  });

  it('reflects an active status filter via aria-pressed', () => {
    useCaseloadStore.getState().setStatuses([PatientStatus.Inquiry]);
    renderWithProviders(<CaseloadPipelineBar patients={patients} matchCount={1} />);

    expect(screen.getByRole('button', { name: 'Inquiry, 1 patients' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Active, 1 patients' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders nothing when the loaded set is empty', () => {
    renderWithProviders(<CaseloadPipelineBar patients={[]} matchCount={0} />);
    expect(screen.queryByRole('region', { name: 'Caseload pipeline' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Filter by status' })).not.toBeInTheDocument();
  });
});
