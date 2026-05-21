import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { AppDatabase } from '@/db/client';
import { getDb } from '@/db/client';
import { createMigratedPgliteDb } from '@/db/pglite';
import { seedPatients } from '@/seed/seedData';
import { getHealthStatus } from '@/services/health.service';
import {
  archivePatientRoute,
  createPatientRoute,
  getPatientRoute,
  listPatientsRoute,
  restorePatientRoute,
  softDeletePatientRoute,
  unarchivePatientRoute,
  updatePatientRoute,
} from '@/http/patientRoutes';
import type { RouteResult } from '@/http/patientRoutes';
import { blankSlateRoute, purgeExpiredRoute, reseedRoute } from '@/http/demoRoutes';

const DEFAULT_PORT = 3001;
const PATIENT_ID_PATTERN = /^\/api\/patients\/([^/]+)\/?$/;
const PATIENT_ACTION_PATTERN = /^\/api\/patients\/([^/]+)\/(archive|unarchive|restore)\/?$/;
const DEMO_ACTION_PATTERN = /^\/api\/demo\/(purge|reseed|blank-slate)\/?$/;

// Local dev transport for the same route-core the Vercel functions use. Not the deploy path —
// production runs the serverless functions in apps/api/api (spec §2 deployment reality).

// Resolve the db once: real Postgres when DATABASE_URL is set, else a fresh in-memory pglite
// seeded with the deterministic dataset, so `bun run dev` works with zero config or secrets.
async function resolveDevDatabase(): Promise<AppDatabase> {
  if (process.env.DATABASE_URL) {
    console.log('[api] DATABASE_URL set — using Postgres.');
    return getDb();
  }
  console.log('[api] No DATABASE_URL — starting in-memory pglite demo and seeding…');
  const db = await createMigratedPgliteDb();
  const result = await seedPatients(db);
  console.log(`[api] Seeded ${result.total} patients (${result.archived} archived, ${result.softDeleted} soft-deleted).`);
  return db;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : undefined;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

// Map a lifecycle action segment to its route-core; the regex already constrained the values.
async function runPatientAction(db: AppDatabase, id: string, action: string): Promise<RouteResult> {
  if (action === 'archive') return archivePatientRoute(db, id);
  if (action === 'unarchive') return unarchivePatientRoute(db, id);
  return restorePatientRoute(db, id);
}

async function runDemoAction(db: AppDatabase, action: string): Promise<RouteResult> {
  if (action === 'purge') return purgeExpiredRoute(db);
  if (action === 'reseed') return reseedRoute(db);
  return blankSlateRoute(db);
}

async function handleRequest(db: AppDatabase, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname;
  const method = req.method ?? 'GET';

  if (path === '/api/health' && method === 'GET') {
    sendJson(res, 200, getHealthStatus());
    return;
  }
  if (path === '/api/patients' && method === 'GET') {
    const result = await listPatientsRoute(db, url.searchParams.get('scope') ?? undefined);
    sendJson(res, result.status, result.body);
    return;
  }
  if (path === '/api/patients' && method === 'POST') {
    const result = await createPatientRoute(db, await readJsonBody(req));
    sendJson(res, result.status, result.body);
    return;
  }
  const actionMatch = PATIENT_ACTION_PATTERN.exec(path);
  if (actionMatch && method === 'POST') {
    const id = decodeURIComponent(actionMatch[1]!);
    const result = await runPatientAction(db, id, actionMatch[2]!);
    sendJson(res, result.status, result.body);
    return;
  }
  const demoMatch = DEMO_ACTION_PATTERN.exec(path);
  if (demoMatch && method === 'POST') {
    const result = await runDemoAction(db, demoMatch[1]!);
    sendJson(res, result.status, result.body);
    return;
  }
  const idMatch = PATIENT_ID_PATTERN.exec(path);
  if (idMatch) {
    const id = decodeURIComponent(idMatch[1]!);
    if (method === 'GET') {
      const result = await getPatientRoute(db, id);
      sendJson(res, result.status, result.body);
      return;
    }
    if (method === 'PATCH') {
      const result = await updatePatientRoute(db, id, await readJsonBody(req));
      sendJson(res, result.status, result.body);
      return;
    }
    if (method === 'DELETE') {
      const result = await softDeletePatientRoute(db, id);
      sendJson(res, result.status, result.body);
      return;
    }
  }
  sendJson(res, 404, { error: 'Not found' });
}

export async function startDevApiServer(port = Number(process.env.PORT) || DEFAULT_PORT): Promise<Server> {
  const db = await resolveDevDatabase();
  const server = createServer((req, res) => {
    void handleRequest(db, req, res).catch((error: unknown) => {
      console.error('[api] request failed:', error);
      sendJson(res, 500, { error: 'Internal server error' });
    });
  });
  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`[api] dev server listening on http://localhost:${port}`);
      resolve(server);
    });
  });
}
