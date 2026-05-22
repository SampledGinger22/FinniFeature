import { getDb } from '@/db/client';
import { runMigrations } from '@/db/migrator';
import { seedIfEmpty } from '@/seed/seedData';

// Deploy-time DB step (wired into vercel.json build): bring schema up to date, then seed once if
// the database is empty. Makes a fresh database schema-ready and demo-populated with no manual step.
async function runDeployCli(): Promise<void> {
  await runMigrations();
  const result = await seedIfEmpty(getDb());
  console.log(result ? `Seeded ${result.total} patients on a fresh database.` : 'Patients already present; skipped seed.');
  process.exit(0);
}

runDeployCli().catch((error: unknown) => {
  console.error('DB deploy step failed:', error);
  process.exit(1);
});
