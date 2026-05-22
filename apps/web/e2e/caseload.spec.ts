import { expect, test } from '@playwright/test';
import { createUniquePatient, findPatientCard } from './support/patientFlows';

// The vertical-slice happy path against the dev API (pglite demo): create a patient via the bottom
// drawer, then open the read-first right drawer, flip to Edit, mutate, and confirm the list refreshes.
test('create a patient, then edit them through the read-first drawer', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Caseload' })).toBeVisible();

  const { fullName } = await createUniquePatient(page);

  // The new record is findable via the hero search and opens read-first (VIEW mode).
  const card = await findPatientCard(page, fullName);
  await card.click();
  const viewDrawer = page.getByRole('dialog', { name: 'Patient detail' });
  await expect(viewDrawer).toBeVisible();
  await expect(viewDrawer.getByRole('heading', { name: fullName })).toBeVisible();

  // Flip to EDIT, change the lifecycle status (radio pills), and save.
  await viewDrawer.getByRole('button', { name: 'Edit record' }).click();
  const editDrawer = page.getByRole('dialog', { name: 'Edit record' });
  await editDrawer.getByRole('radio', { name: 'Churned' }).click();
  await editDrawer.getByRole('button', { name: 'Save changes' }).click();

  // Toast confirms, drawer closes, and the invalidated list refetches with the new status.
  await expect(page.getByText('Patient updated')).toBeVisible();
  await expect(editDrawer).toBeHidden();
  await expect(page.getByRole('button', { name: `Edit ${fullName}` }).getByText('Churned')).toBeVisible();
});

// Validation comes from the shared Zod schema (D15): clearing a required field blocks the save and
// surfaces the error inline, keeping the drawer open.
test('clearing a required field in edit mode surfaces a validation error', async ({ page }) => {
  await page.goto('/');
  const { fullName } = await createUniquePatient(page);

  const card = await findPatientCard(page, fullName);
  await card.click();
  await page.getByRole('dialog', { name: 'Patient detail' }).getByRole('button', { name: 'Edit record' }).click();

  const editDrawer = page.getByRole('dialog', { name: 'Edit record' });
  await editDrawer.getByLabel('First name').fill('');
  await editDrawer.getByRole('button', { name: 'Save changes' }).click();

  await expect(editDrawer.getByText('String must contain at least 1 character(s)')).toBeVisible();
  await expect(editDrawer).toBeVisible();
});
