import { expect, test } from '@playwright/test';

// The kitchen sink is the visual-regression surface (§14): a full-page snapshot guards every
// primitive in every state against unintended visual drift. Animations are auto-disabled.
test('kitchen sink renders the full primitive surface', async ({ page }) => {
  await page.goto('/kitchen-sink');

  await expect(page.getByText('Status lifecycle')).toBeVisible();
  await expect(page.getByText('Per-widget resilience')).toBeVisible();
  await expect(page.getByText('Inquiry')).toBeVisible();

  await expect(page).toHaveScreenshot('kitchen-sink.png', { fullPage: true });
});

// Exercises the live store → theme path: switching palette + density must restyle the whole
// page (not just assert the controls exist). Confirms the eye-strain palette stays clean.
test('eye-strain palette and comfortable density restyle the page', async ({ page }) => {
  await page.goto('/kitchen-sink');
  await page.getByText('Eye-strain').click();
  await page.getByText('Comfortable').click();
  await expect(page.getByText('Status lifecycle')).toBeVisible();
  await expect(page).toHaveScreenshot('kitchen-sink-eye-strain.png', { fullPage: true });
});
