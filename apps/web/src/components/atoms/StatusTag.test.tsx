import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PatientStatus } from '@finni/shared';
import { StatusTag } from '@/components/atoms/StatusTag';

const expectedLabels: Record<string, string> = {
  [PatientStatus.Inquiry]: 'Inquiry',
  [PatientStatus.Waitlisted]: 'Waitlisted',
  [PatientStatus.Onboarding]: 'Onboarding',
  [PatientStatus.Active]: 'Active',
  [PatientStatus.Paused]: 'Paused',
  [PatientStatus.Churned]: 'Churned',
};

describe('StatusTag', () => {
  it('renders a human label for each of the six statuses', () => {
    for (const [status, label] of Object.entries(expectedLabels)) {
      const view = render(<StatusTag status={status as PatientStatus} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      view.unmount();
    }
  });
});
