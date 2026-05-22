import { expect, type Page } from '@playwright/test';

export interface CreatedPatient {
  firstName: string;
  lastName: string;
  fullName: string;
}

// The dev backend (pglite demo) is shared across parallel workers, so every test creates its own
// uniquely-named subject and operates only on that row. This keeps mutating flows independent and
// parallel-safe instead of fighting over "the first card".
export async function createUniquePatient(page: Page, state = 'New York'): Promise<CreatedPatient> {
  const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const firstName = 'Testford';
  const lastName = `Subject${unique}`;
  const fullName = `${firstName} ${lastName}`;

  await page.getByRole('button', { name: 'Add patient' }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer.getByRole('heading', { name: 'Add a patient to your caseload' })).toBeVisible();

  await drawer.getByLabel('First name').fill(firstName);
  await drawer.getByLabel('Last name').fill(lastName);

  const dob = drawer.locator('.ant-picker input');
  await dob.click();
  await dob.fill('Jan 1, 1990');
  await dob.press('Enter');

  await drawer.getByLabel('Primary email').fill(`subject${unique}@example.com`);

  // State is the bottom drawer's only antd Select. Open it, type to filter to a single option, then
  // press Enter to select the highlighted match — robust against the dropdown's position in the
  // tall bottom sheet (clicking the floating option can land off-viewport).
  await drawer.locator('.ant-select').click();
  const stateSearch = drawer.getByLabel('State');
  await stateSearch.pressSequentially(state);
  await stateSearch.press('Enter');

  await drawer.getByRole('button', { name: 'Add patient' }).click();
  await expect(page.getByText('Patient created')).toBeVisible();
  await expect(drawer).toBeHidden();
  return { firstName, lastName, fullName };
}

// Narrows the caseload to a single known patient via the hero search filter, then returns the card
// locator. Search is client-side over the loaded set, so this never refetches.
export async function findPatientCard(page: Page, fullName: string) {
  await page.getByRole('textbox', { name: 'Search' }).fill(fullName);
  const card = page.getByRole('button', { name: `Edit ${fullName}` });
  await expect(card).toBeVisible();
  return card;
}
