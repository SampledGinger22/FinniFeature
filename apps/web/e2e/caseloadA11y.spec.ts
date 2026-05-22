import { expect, test } from '@playwright/test';

// One data + filter layer (§8): switching card↔table is presentation-only. It must keep the active
// filters AND never trigger a server refetch. We count GET /api/patients to prove the latter.
test('switching views preserves filters and never refetches the list', async ({ page }) => {
  let listGets = 0;
  await page.route('**/api/patients**', (route) => {
    if (route.request().method() === 'GET') listGets += 1;
    return route.continue();
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Caseload' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Edit / }).first()).toBeVisible();
  const getsAfterLoad = listGets;
  expect(getsAfterLoad).toBeGreaterThan(0);

  // Apply a client-side filter, then switch to Table and back to Cards. The antd Segmented control
  // hides its radio inputs visually, so we click the visible segment labels.
  await page.getByRole('textbox', { name: 'Search' }).fill('a');
  await page.locator('.ant-segmented-item-label').filter({ hasText: 'Table' }).click();
  await expect(page.getByRole('table')).toBeVisible();
  expect(await page.getByRole('textbox', { name: 'Search' }).inputValue()).toBe('a'); // filter survived the switch
  await page.locator('.ant-segmented-item-label').filter({ hasText: 'Cards' }).click();
  await expect(page.getByRole('button', { name: /^Edit / }).first()).toBeVisible();
  expect(await page.getByRole('textbox', { name: 'Search' }).inputValue()).toBe('a');

  // Neither the filter keystroke nor the two view switches issued a new list GET.
  expect(listGets).toBe(getsAfterLoad);
});

// WCAG focus management: the right (edit) drawer traps focus while open and returns focus to the
// triggering control on close. Driven by keyboard (Escape) to confirm keyboard operability.
test('the edit drawer returns focus to its trigger on close', async ({ page }) => {
  await page.goto('/');
  const card = page.getByRole('button', { name: /^Edit / }).first();
  await card.focus();
  await page.keyboard.press('Enter');

  const drawer = page.getByRole('dialog', { name: 'Patient detail' });
  await expect(drawer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(card).toBeFocused();
});

// The bottom (create) drawer: focus stays trapped inside while open, and returns to the Add button
// on close.
test('the create drawer traps focus and restores it to the Add button', async ({ page }) => {
  await page.goto('/');
  const addButton = page.getByRole('button', { name: 'Add patient' });
  await addButton.focus();
  await page.keyboard.press('Enter');

  const drawer = page.getByRole('dialog');
  await expect(drawer.getByRole('heading', { name: 'Add a patient to your caseload' })).toBeVisible();

  // Tabbing repeatedly must keep focus inside the dialog (no escape to the page behind the mask).
  for (let press = 0; press < 10; press += 1) {
    await page.keyboard.press('Tab');
  }
  const trapped = await drawer.evaluate((node) => node.contains(document.activeElement));
  expect(trapped).toBe(true);

  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(addButton).toBeFocused();
});

// Keyboard operability of the hero toolbar: the search filter takes typed input and the view
// switcher is operable by arrow keys (no mouse), restyling the page to the table presentation.
test('the filter and view switcher are operable by keyboard alone', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Edit / }).first()).toBeVisible();

  const search = page.getByRole('textbox', { name: 'Search' });
  await search.focus();
  await page.keyboard.type('zzzznomatch');
  await expect(page.getByText('No patients match these filters')).toBeVisible();

  await page.keyboard.press('Control+a');
  await page.keyboard.press('Backspace');
  await expect(page.getByRole('button', { name: /^Edit / }).first()).toBeVisible();

  // Arrow-key the segmented view switcher from Cards to Table.
  await page.getByRole('radio', { name: 'Cards' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('table')).toBeVisible();
});
