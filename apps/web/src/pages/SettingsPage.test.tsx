import { describe, it, expect, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemePalette } from '@finni/shared';
import { renderWithProviders } from '@/test/renderWithProviders';
import { usePreferencesStore } from '@/state/usePreferencesStore';
import { SettingsPage } from '@/pages/SettingsPage';

// Resets prefs after every test so store state never bleeds between cases.
afterEach(() => {
  usePreferencesStore.getState().reset();
});

function renderSettingsPage(): ReturnType<typeof renderWithProviders> {
  return renderWithProviders(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

describe('SettingsPage', () => {
  it('renders the page header with eyebrow and title', () => {
    renderSettingsPage();
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByText(/provider workspace/i)).toBeInTheDocument();
  });

  it('renders all preference card headings', () => {
    renderSettingsPage();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Date & time')).toBeInTheDocument();
    expect(screen.getByText('Demo controls')).toBeInTheDocument();
  });

  it('renders a Reset to defaults button', () => {
    renderSettingsPage();
    expect(screen.getByRole('button', { name: /reset to defaults/i })).toBeInTheDocument();
  });

  it('shows the effective timezone derived from the store', () => {
    renderSettingsPage();
    // resolveTimezone(null) returns the runtime IANA zone; just assert it's visible.
    expect(screen.getByText(/effective timezone:/i)).toBeInTheDocument();
  });

  it('updates themePalette in the store when a new palette is selected', async () => {
    const user = userEvent.setup();
    renderSettingsPage();

    // Open the Theme palette Select dropdown (target the combobox role; antd spreads the
    // aria-label across internal nodes, so getByLabelText would match more than one).
    const paletteSelect = screen.getByRole('combobox', { name: 'Theme palette' });
    await user.click(paletteSelect);

    // Pick "Low glare (eye strain)" option.
    const eyeStrainOption = await screen.findByText(/low glare/i);
    await user.click(eyeStrainOption);

    expect(usePreferencesStore.getState().themePalette).toBe(ThemePalette.EyeStrain);
  });

  it('clears the timezone override to auto when Auto-detect is chosen', async () => {
    const user = userEvent.setup();
    // Pre-set a timezone so we have something to clear.
    usePreferencesStore.getState().setTimezone('America/New_York');
    renderSettingsPage();

    const timezone = screen.getByRole('combobox', { name: 'Timezone' });
    await user.click(timezone);
    // Filter the long zone list down so the virtual dropdown renders the option in jsdom.
    await user.type(timezone, 'Auto');
    await user.click(await screen.findByText('Auto-detect'));

    expect(usePreferencesStore.getState().timezone).toBeNull();
  });

  it('resets all preferences when the Reset to defaults button is clicked', async () => {
    const user = userEvent.setup();
    usePreferencesStore.getState().setThemePalette(ThemePalette.EyeStrain);
    renderSettingsPage();

    await user.click(screen.getByRole('button', { name: /reset to defaults/i }));

    expect(usePreferencesStore.getState().themePalette).toBe(ThemePalette.Default);
  });
});
