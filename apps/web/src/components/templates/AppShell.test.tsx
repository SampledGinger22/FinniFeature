import { describe, it, expect, afterEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import { usePreferencesStore } from '@/state/usePreferencesStore';
import { AppShell } from '@/components/templates/AppShell';

const realMatchMedia = window.matchMedia;

// Collapse state lives on the persisted store; reset it (and force expanded) between cases. Also
// restore matchMedia in case a narrow-viewport case stubbed it.
afterEach(() => {
  usePreferencesStore.setState({ sidebarCollapsed: false });
  window.matchMedia = realMatchMedia;
});

// Forces the auto-collapse media query to report a narrow viewport.
function stubNarrowViewport(): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
}

function renderShell(initialPath: string): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppShell>
        <p>page content</p>
      </AppShell>
    </MemoryRouter>,
  );
}

describe('AppShell', () => {
  it('renders the working nav items, Settings, and the provider chip', () => {
    renderShell('/');
    expect(screen.getByRole('button', { name: 'Caseload' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Your day' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Dr. Jamie Kim')).toBeInTheDocument();
  });

  it('omits the unbuilt Inbox and Reports items', () => {
    renderShell('/');
    expect(screen.queryByRole('button', { name: 'Inbox' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reports' })).not.toBeInTheDocument();
  });

  it('marks the nav item for the current route as the active page', () => {
    renderShell('/your-day');
    expect(screen.getByRole('button', { name: 'Your day' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Caseload' })).not.toHaveAttribute('aria-current');
  });

  it('keeps Settings active while viewing Trash', () => {
    renderShell('/trash');
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-current', 'page');
  });

  it('collapses the sidebar and hides labels when the toggle is clicked', async () => {
    const user = userEvent.setup();
    renderShell('/');
    // Expanded: the visible label text is present alongside the aria-labelled button.
    expect(screen.getByText('Caseload')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /collapse sidebar/i }));

    expect(usePreferencesStore.getState().sidebarCollapsed).toBe(true);
    // Collapsed: visible labels gone (icon-only), the toggle now offers to expand, but the
    // buttons keep their accessible names via aria-label.
    expect(screen.queryByText('Caseload')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Caseload' })).toBeInTheDocument();
  });

  it('renders its children in the main content area', () => {
    renderShell('/');
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('auto-collapses on a narrow viewport and hides the manual toggle', () => {
    stubNarrowViewport();
    renderShell('/');
    // Forced collapse: labels hidden and the collapse/expand toggle is gone (width-enforced).
    expect(screen.queryByText('Caseload')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /collapse sidebar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /expand sidebar/i })).not.toBeInTheDocument();
    // Nav is still reachable via the aria-labelled icon buttons.
    expect(screen.getByRole('button', { name: 'Caseload' })).toBeInTheDocument();
  });
});
