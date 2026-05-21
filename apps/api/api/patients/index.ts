import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '@/db/client';
import { listPatientsRoute } from '@/http/patientRoutes';

// Thin Vercel handler (spec §5): adapt the request, delegate to route-core, shape the response.
// Default export is required by the Vercel functions runtime (C5 tool-required exception).
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const scope = typeof req.query.scope === 'string' ? req.query.scope : undefined;
  const result = await listPatientsRoute(getDb(), scope);
  res.status(result.status).json(result.body);
}
