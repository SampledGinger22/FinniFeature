import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientStatus } from '@finni/shared';
import { StatusPillSelect } from '@/components/atoms/StatusPillSelect';

describe('StatusPillSelect', () => {
  it('renders a radio for each status and marks the selected one', () => {
    render(<StatusPillSelect value={PatientStatus.Active} />);
    expect(screen.getAllByRole('radio')).toHaveLength(Object.values(PatientStatus).length);
    expect(screen.getByRole('radio', { name: 'Active' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Inquiry' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with the clicked status', async () => {
    const onChange = vi.fn();
    render(<StatusPillSelect value={PatientStatus.Inquiry} onChange={onChange} />);

    await userEvent.click(screen.getByRole('radio', { name: 'Onboarding' }));

    expect(onChange).toHaveBeenCalledWith(PatientStatus.Onboarding);
  });
});
