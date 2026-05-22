import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getHealthStatus } from '@/services/health.service';

// Thin Vercel handler: no business logic, delegates to the service layer (spec §5).
// Default export is required by the Vercel functions runtime (C5 tool-required exception).
export default function handler(_req: VercelRequest, res: VercelResponse): void {
  res.status(200).json(getHealthStatus());
}
