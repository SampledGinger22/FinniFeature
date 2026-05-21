import type { AppDatabase } from '@/db/client';
import { blankSlate, purgeExpired, reseedDemoData } from '@/services/demoService';
import type { RouteResult } from '@/http/patientRoutes';

// Route-core for the demo controls (spec §12). Both transports adapt to these; the HTTP
// contract lives in one place, exactly like the patient routes.

export async function purgeExpiredRoute(db: AppDatabase): Promise<RouteResult> {
  const purged = await purgeExpired(db);
  return { status: 200, body: { purged } };
}

export async function reseedRoute(db: AppDatabase): Promise<RouteResult> {
  const result = await reseedDemoData(db);
  return { status: 200, body: result };
}

export async function blankSlateRoute(db: AppDatabase): Promise<RouteResult> {
  const result = await blankSlate(db);
  return { status: 200, body: result };
}
