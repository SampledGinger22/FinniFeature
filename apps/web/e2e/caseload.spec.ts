import { expect, test } from '@playwright/test';

// The vertical-slice happy path, exercised end-to-end against the dev API (pglite demo): the
// list loads from the server, the right drawer opens, an edit mutates, and the list refreshes.
test('caseload loads, and editing a patient updates the list', async ({ page }) => {
  await page.goto('/');

  // The seeded caseload renders as cards (deterministic seed → always populated).
  await expect(page.getByRole('heading', { name: 'Caseload' })).toBeVisible();
  const firstCard = page.getByRole('button', { name: /^Edit / }).first();
  await expect(firstCard).toBeVisible();

  // Open the right edit drawer.
  await firstCard.click();
  const drawer = page.getByRole('dialog', { name: 'Edit patient' });
  await expect(drawer).toBeVisible();

  // Change status to Churned and save (open the antd select via its selector surface).
  await drawer.locator('.ant-select-selector').click();
  await page.getByTitle('Churned').click();
  await drawer.getByRole('button', { name: 'Save changes' }).click();

  // Toast confirms, drawer closes, and the invalidated list refetches with a Churned tag.
  await expect(page.getByText('Patient updated')).toBeVisible();
  await expect(drawer).toBeHidden();
  await expect(page.getByText('Churned').first()).toBeVisible();
});

// Validation comes from the shared Zod schema (D15): clearing a required field blocks the save.
test('clearing a required field surfaces a validation error', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Edit / }).first().click();
  const drawer = page.getByRole('dialog', { name: 'Edit patient' });
  await expect(drawer).toBeVisible();

  await drawer.getByLabel('First name').fill('');
  await drawer.getByRole('button', { name: 'Save changes' }).click();

  await expect(drawer.getByText('String must contain at least 1 character(s)')).toBeVisible();
  await expect(drawer).toBeVisible();
});
