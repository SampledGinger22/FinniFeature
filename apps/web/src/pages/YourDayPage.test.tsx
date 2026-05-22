import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PatientStatus } from '@finni/shared';
import { renderWithProviders } from '@/test/renderWithProviders';
import { buildPatient } from '@/test/patientFixture';
import { summarizeCaseload } from '@/pages/yourDayStats';
import { YourDayPage } from '@/pages/YourDayPage';

// Controlled mock so tests never hit the network and can exercise all query states.
const mockRefetch = vi.fn();

vi.mock('@/queries/patientQueries', () => ({
  usePatientListQuery: vi.fn(),
}));

// Re-import after mock so vitest wires the mock correctly.
import { usePatientListQuery } from '@/queries/patientQueries';

// Cast to allow per-test configuration without losing type hints.
const mockUsePatientListQuery = usePatientListQuery as ReturnType<typeof vi.fn>;

function renderYourDayPage(): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(
    <MemoryRouter>
      <YourDayPage />
    </MemoryRouter>,
  );
}

// --- pure helper unit tests ---

describe('summarizeCaseload', () => {
  it('returns zeros for an empty list', () => {
    const result = summarizeCaseload([]);
    expect(result.total).toBe(0);
    expect(result.insured).toBe(0);
    expect(result.uninsured).toBe(0);
    expect(result.needsAttention).toHaveLength(0);
    expect(result.byStatus[PatientStatus.Active]).toBe(0);
  });

  it('counts totals and insurance correctly', () => {
    const patients = [
      buildPatient({ id: 'p1', status: PatientStatus.Active, hasInsurance: true }),
      buildPatient({ id: 'p2', status: PatientStatus.Active, hasInsurance: false }),
      buildPatient({ id: 'p3', status: PatientStatus.Inquiry, hasInsurance: true }),
    ];
    const result = summarizeCaseload(patients);
    expect(result.total).toBe(3);
    expect(result.insured).toBe(2);
    expect(result.uninsured).toBe(1);
  });

  it('groups patients into byStatus buckets', () => {
    const patients = [
      buildPatient({ id: 'p1', status: PatientStatus.Active }),
      buildPatient({ id: 'p2', status: PatientStatus.Active }),
      buildPatient({ id: 'p3', status: PatientStatus.Waitlisted }),
      buildPatient({ id: 'p4', status: PatientStatus.Churned }),
    ];
    const result = summarizeCaseload(patients);
    expect(result.byStatus[PatientStatus.Active]).toBe(2);
    expect(result.byStatus[PatientStatus.Waitlisted]).toBe(1);
    expect(result.byStatus[PatientStatus.Churned]).toBe(1);
    expect(result.byStatus[PatientStatus.Onboarding]).toBe(0);
  });

  it('flags inquiry and waitlisted patients as needsAttention', () => {
    const patients = [
      buildPatient({ id: 'p1', status: PatientStatus.Inquiry }),
      buildPatient({ id: 'p2', status: PatientStatus.Waitlisted }),
      buildPatient({ id: 'p3', status: PatientStatus.Active }),
    ];
    const result = summarizeCaseload(patients);
    expect(result.needsAttention).toHaveLength(2);
    const ids = result.needsAttention.map((p) => p.id);
    expect(ids).toContain('p1');
    expect(ids).toContain('p2');
  });

  it('returns no attention patients when all are in care-stage statuses', () => {
    const patients = [
      buildPatient({ id: 'p1', status: PatientStatus.Active }),
      buildPatient({ id: 'p2', status: PatientStatus.Onboarding }),
      buildPatient({ id: 'p3', status: PatientStatus.Paused }),
    ];
    const result = summarizeCaseload(patients);
    expect(result.needsAttention).toHaveLength(0);
  });
});

// --- page integration tests ---

describe('YourDayPage', () => {
  beforeEach(() => {
    mockRefetch.mockReset();
  });

  it('renders the page header with eyebrow and title', () => {
    mockUsePatientListQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });
    renderYourDayPage();
    expect(screen.getByRole('heading', { name: 'Your day' })).toBeInTheDocument();
    expect(screen.getByText(/provider workspace/i)).toBeInTheDocument();
  });

  it('shows a skeleton while loading', () => {
    mockUsePatientListQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: mockRefetch,
    });
    renderYourDayPage();
    // aria-busy signals the loading region to assistive tech
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('shows an error alert with retry on query failure', async () => {
    mockUsePatientListQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });
    renderYourDayPage();
    expect(screen.getByText('Could not load caseload')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    await userEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalledOnce();
  });

  it('shows an empty state when no patients exist', () => {
    mockUsePatientListQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });
    renderYourDayPage();
    expect(screen.getByText('No active patients in the caseload')).toBeInTheDocument();
  });

  it('renders summary statistics when data is loaded', () => {
    const patients = [
      buildPatient({ id: 'p1', status: PatientStatus.Active, hasInsurance: true }),
      buildPatient({ id: 'p2', status: PatientStatus.Active, hasInsurance: false }),
      buildPatient({ id: 'p3', status: PatientStatus.Inquiry, hasInsurance: true }),
    ];
    mockUsePatientListQuery.mockReturnValue({
      data: patients,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });
    renderYourDayPage();
    // Total active patients statistic
    expect(screen.getByText('Total active patients')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    // Insurance breakdown — getAllByText because the count "2" also appears in the byStatus grid.
    expect(screen.getByText('Insured')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Uninsured')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the needs-attention list for inquiry and waitlisted patients', () => {
    const patients = [
      buildPatient({ id: 'p1', status: PatientStatus.Inquiry, firstName: 'Avery', lastName: 'Johnson' }),
      buildPatient({ id: 'p2', status: PatientStatus.Active, firstName: 'Blair', lastName: 'Smith' }),
    ];
    mockUsePatientListQuery.mockReturnValue({
      data: patients,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });
    renderYourDayPage();
    expect(screen.getByText('Needs attention')).toBeInTheDocument();
    expect(screen.getByText('Avery Johnson')).toBeInTheDocument();
    // Blair is active — not in the attention list
    const attentionSection = screen.getByText('Needs attention').closest('div');
    expect(attentionSection).not.toHaveTextContent('Blair Smith');
  });
});
