import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/molecules/ErrorBoundary';

function Boom(): JSX.Element {
  throw new Error('boom');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <span>Healthy content</span>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Healthy content')).toBeInTheDocument();
  });

  it('renders the fallback instead of blanking when a child throws', () => {
    // React logs caught render errors; silence the expected noise for a clean run.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary fallbackTitle="This widget hit a snag">
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('This widget hit a snag')).toBeInTheDocument();
  });
});
