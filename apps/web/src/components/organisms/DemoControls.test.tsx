import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';

// Mock the network layer before importing the component so mutations use stubs, not real fetch.
vi.mock('@/api/patientsApi', () => ({
  reseedDemoRequest: vi.fn(),
  blankSlateDemoRequest: vi.fn(),
  purgeExpiredDemoRequest: vi.fn(),
  fetchPatientsByScope: vi.fn(),
}));

import {
  blankSlateDemoRequest,
  purgeExpiredDemoRequest,
  reseedDemoRequest,
} from '@/api/patientsApi';
import { DemoControls } from '@/components/organisms/DemoControls';

const mockedReseed = vi.mocked(reseedDemoRequest);
const mockedBlankSlate = vi.mocked(blankSlateDemoRequest);
const mockedPurgeExpired = vi.mocked(purgeExpiredDemoRequest);

afterEach(() => {
  vi.clearAllMocks();
});

// antd's Modal.confirm renders its title text into more than one node under jsdom, and the OK
// button can share a label with the panel button — so match all and act on the modal's (last) node.
async function expectModalTitle(text: RegExp): Promise<void> {
  expect((await screen.findAllByText(text)).length).toBeGreaterThan(0);
}

async function clickModalButton(name: string): Promise<void> {
  const buttons = await screen.findAllByRole('button', { name });
  await userEvent.click(buttons[buttons.length - 1]!);
}

describe('DemoControls', () => {
  it('renders the panel title and disclaimer', () => {
    renderWithProviders(<DemoControls />);

    expect(screen.getByText('Demo controls')).toBeInTheDocument();
    expect(screen.getByText(/would not exist in production/i)).toBeInTheDocument();
  });

  it('confirms then calls the API when Reseed is run', async () => {
    mockedReseed.mockResolvedValue({ total: 42, archived: 3, softDeleted: 1 });
    renderWithProviders(<DemoControls />);

    await userEvent.click(screen.getByRole('button', { name: 'Reseed' }));
    await expectModalTitle(/reseed the demo dataset\?/i);

    await clickModalButton('Reseed');

    await waitFor(() => expect(mockedReseed).toHaveBeenCalledTimes(1));
  });

  it('confirms then calls the API when Purge expired is run', async () => {
    mockedPurgeExpired.mockResolvedValue({ purged: 7 });
    renderWithProviders(<DemoControls />);

    await userEvent.click(screen.getByRole('button', { name: 'Purge expired' }));
    await expectModalTitle(/purge expired soft-deleted patients\?/i);

    await clickModalButton('Purge');

    await waitFor(() => expect(mockedPurgeExpired).toHaveBeenCalledTimes(1));
  });

  it('shows a firm danger confirm for Blank slate and calls the API on confirm', async () => {
    mockedBlankSlate.mockResolvedValue({ removed: 55 });
    renderWithProviders(<DemoControls />);

    await userEvent.click(screen.getByRole('button', { name: 'Blank slate' }));
    await expectModalTitle(/wipe all patients\?/i);
    expect((await screen.findAllByText(/there is no undo/i)).length).toBeGreaterThan(0);

    await clickModalButton('Wipe everything');

    await waitFor(() => expect(mockedBlankSlate).toHaveBeenCalledTimes(1));
  });

  it('does NOT call the API when the confirm modal is cancelled', async () => {
    renderWithProviders(<DemoControls />);

    await userEvent.click(screen.getByRole('button', { name: 'Reseed' }));
    await expectModalTitle(/reseed the demo dataset\?/i);

    await clickModalButton('Cancel');

    expect(mockedReseed).not.toHaveBeenCalled();
  });
});
