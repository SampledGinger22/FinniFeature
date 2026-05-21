import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '@/db/client';
import { getPatientRoute, updatePatientRoute } from '@/http/patientRoutes';

// Thin Vercel handler for a single patient: GET reads, PATCH updates (spec §5). Default export
// is required by the Vercel functions runtime (C5 tool-required exception).
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const id = typeof req.query.id === 'string' ? req.query.id : '';

  if (req.method === 'GET') {
    const result = await getPatientRoute(getDb(), id);
    res.status(result.status).json(result.body);
    return;
  }
  if (req.method === 'PATCH') {
    const result = await updatePatientRoute(getDb(), id, req.body);
    res.status(result.status).json(result.body);
    return;
  }
  res.status(405).json({ error: 'Method not allowed' });
}
