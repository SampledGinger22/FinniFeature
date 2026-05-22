import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { PageHeader } from '@/components/molecules/PageHeader';

describe('PageHeader', () => {
  it('renders the title as a heading and the default eyebrow', () => {
    renderWithProviders(<PageHeader title="Caseload" />);
    expect(screen.getByRole('heading', { name: 'Caseload' })).toBeInTheDocument();
    expect(screen.getByText(/provider workspace/i)).toBeInTheDocument();
  });

  it('renders a custom eyebrow when provided', () => {
    renderWithProviders(<PageHeader title="Trash" eyebrow="Maintenance" />);
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
  });

  it('renders the actions slot when provided', () => {
    renderWithProviders(<PageHeader title="Caseload" actions={<button type="button">Add patient</button>} />);
    expect(screen.getByRole('button', { name: 'Add patient' })).toBeInTheDocument();
  });
});
