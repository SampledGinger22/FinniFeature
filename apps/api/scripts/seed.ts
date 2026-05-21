import { getDb } from '@/db/client';
import { seedPatients } from '@/seed/seedData';

// CLI entry: seed the configured Postgres (DATABASE_URL). The reusable logic lives in
// src/seed/seedData.ts so the dev server can seed its in-memory db with the same dataset.
async function runSeedCli(): Promise<void> {
  const result = await seedPatients(getDb());
  console.log(`Seeded ${result.total} patients (${result.archived} archived, ${result.softDeleted} soft-deleted).`);
  process.exit(0);
}

runSeedCli().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
