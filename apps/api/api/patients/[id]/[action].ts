import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '@/db/client';
import {
  archivePatientRoute,
  purgePatientRoute,
  restorePatientRoute,
  unarchivePatientRoute,
} from '@/http/patientRoutes';
import type { RouteResult } from '@/http/patientRoutes';

// Lifecycle actions for one patient: POST /api/patients/:id/{archive|unarchive|restore|purge} (§12).
// Default export required by the Vercel functions runtime (C5 exception).
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  const action = typeof req.query.action === 'string' ? req.query.action : '';
  const db = getDb();

  let result: RouteResult;
  if (action === 'archive') result = await archivePatientRoute(db, id);
  else if (action === 'unarchive') result = await unarchivePatientRoute(db, id);
  else if (action === 'restore') result = await restorePatientRoute(db, id);
  else if (action === 'purge') result = await purgePatientRoute(db, id);
  else {
    res.status(404).json({ error: 'Unknown action' });
    return;
  }
  res.status(result.status).json(result.body);
}
