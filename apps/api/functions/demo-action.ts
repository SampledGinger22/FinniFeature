import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '@/db/client';
import { blankSlateRoute, purgeExpiredRoute, reseedRoute } from '@/http/demoRoutes';
import type { RouteResult } from '@/http/patientRoutes';

// Demo controls: POST /api/demo/{purge|reseed|blank-slate} (§12). Would not exist in production.
// Default export required by the Vercel functions runtime (C5 exception).
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const action = typeof req.query.action === 'string' ? req.query.action : '';
  const db = getDb();

  let result: RouteResult;
  if (action === 'purge') result = await purgeExpiredRoute(db);
  else if (action === 'reseed') result = await reseedRoute(db);
  else if (action === 'blank-slate') result = await blankSlateRoute(db);
  else {
    res.status(404).json({ error: 'Unknown action' });
    return;
  }
  res.status(result.status).json(result.body);
}
