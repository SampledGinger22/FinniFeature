import { beforeEach, describe, expect, it } from 'vitest';
import type { AppDatabase } from '@/db/client';
import { createMigratedPgliteDb } from '@/test/testDb';
import { seedPatients } from '@/seed/seedData';
import { listPatientsRoute } from '@/http/patientRoutes';
import { blankSlateRoute, purgeExpiredRoute, reseedRoute } from '@/http/demoRoutes';

let db: AppDatabase;

beforeEach(async () => {
  db = await createMigratedPgliteDb();
  await seedPatients(db);
});

function activeCount(result: { body: unknown }): number {
  return (result.body as { patients: unknown[] }).patients.length;
}

describe('blankSlateRoute', () => {
  it('removes every patient so the active list is empty', async () => {
    const before = activeCount(await listPatientsRoute(db));
    expect(before).toBeGreaterThan(0);

    const result = await blankSlateRoute(db);
    expect(result.status).toBe(200);
    expect((result.body as { removed: number }).removed).toBe(36);
    expect(activeCount(await listPatientsRoute(db))).toBe(0);
  });
});

describe('reseedRoute', () => {
  it('regenerates the deterministic dataset after a wipe', async () => {
    await blankSlateRoute(db);
    expect(activeCount(await listPatientsRoute(db))).toBe(0);

    const result = await reseedRoute(db);
    expect(result.status).toBe(200);
    // 36 total seeded; the active list excludes the one archived + one soft-deleted example.
    expect((result.body as { total: number }).total).toBe(36);
    expect(activeCount(await listPatientsRoute(db))).toBe(34);
  });
});

describe('purgeExpiredRoute', () => {
  it('runs without error and reports a purge count on the seeded set', async () => {
    const result = await purgeExpiredRoute(db);
    expect(result.status).toBe(200);
    // The seeded soft-delete is fresh (not past the 30-day window), so nothing is purged yet.
    expect((result.body as { purged: number }).purged).toBe(0);
  });
});
