import { expect, test } from '@playwright/test';
import { createUniquePatient, findPatientCard } from './support/patientFlows';

// Archive is reversible hiding (not deletion): the patient leaves the active caseload and reappears
// only under the "Show archived" view. Exercised end-to-end through the drawer + the filter scope.
test('archiving a patient hides them from active and surfaces them under Show archived', async ({ page }) => {
  await page.goto('/');
  const { fullName } = await createUniquePatient(page);

  const card = await findPatientCard(page, fullName);
  await card.click();
  const drawer = page.getByRole('dialog', { name: 'Patient detail' });
  await drawer.getByRole('button', { name: 'Archive' }).click();

  await expect(page.getByText('Patient archived')).toBeVisible();
  await expect(drawer).toBeHidden();

  // Still filtered to the subject by search: the active list no longer contains them.
  await expect(page.getByRole('button', { name: `Edit ${fullName}` })).toBeHidden();

  // Show archived flips the scope to archived-only, where the subject reappears with its flag.
  await page.getByLabel('Caseload filters').getByText('Show archived').click();
  const archivedCard = page.getByRole('button', { name: `Edit ${fullName}` });
  await expect(archivedCard).toBeVisible();
  await expect(archivedCard.getByText('Archived')).toBeVisible();
});

// Soft delete moves the patient to Trash (purged after 30 days); restore brings them back. The full
// reversible round-trip, including the confirm modal and the Trash page.
test('soft-deleting a patient moves them to Trash, and restore brings them back', async ({ page }) => {
  await page.goto('/');
  const { fullName } = await createUniquePatient(page);

  const card = await findPatientCard(page, fullName);
  await card.click();
  await page.getByRole('dialog', { name: 'Patient detail' }).getByRole('button', { name: 'Delete' }).click();

  // Confirm modal guards the soft delete; its OK button is labelled "Delete".
  const confirm = page.getByRole('dialog').filter({ hasText: `Delete ${fullName}?` });
  await confirm.getByRole('button', { name: 'Delete' }).click();

  await expect(page.getByText('Patient moved to Trash')).toBeVisible();
  await expect(page.getByRole('button', { name: `Edit ${fullName}` })).toBeHidden();

  // The patient is now in Trash; opening their row offers Restore.
  await page.goto('/trash');
  await expect(page.getByRole('heading', { name: 'Trash' })).toBeVisible();
  await page.getByText(fullName).click();
  const trashDrawer = page.getByRole('dialog', { name: 'Patient detail' });
  await trashDrawer.getByRole('button', { name: 'Restore' }).click();

  await expect(page.getByText('Patient restored')).toBeVisible();
  await expect(trashDrawer).toBeHidden();
  await expect(page.getByText(fullName)).toBeHidden();
});
