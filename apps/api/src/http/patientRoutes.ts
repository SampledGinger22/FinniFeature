import { patientUpdateSchema } from '@finni/shared';
import type { AppDatabase } from '@/db/client';
import { RepositoryScope } from '@/enums/repositoryScope';
import { getPatientDetail, getPatientList, updatePatient } from '@/services/patientService';

// Framework-agnostic route handlers: parse → validate → call one service → shape a result.
// Both the Vercel functions (prod) and the dev server (local) adapt their transport to these,
// so the HTTP contract lives in exactly one place (spec §5, thin handlers).

export interface RouteResult {
  status: number;
  body: unknown;
}

// Default to Active so PHI never leaks by default (§5); only widen on an explicit scope param.
function resolveScope(raw: string | undefined): RepositoryScope {
  if (raw === RepositoryScope.IncludeArchived) return RepositoryScope.IncludeArchived;
  if (raw === RepositoryScope.IncludeDeleted) return RepositoryScope.IncludeDeleted;
  return RepositoryScope.Active;
}

export async function listPatientsRoute(db: AppDatabase, scopeParam?: string): Promise<RouteResult> {
  const patients = await getPatientList(resolveScope(scopeParam), db);
  return { status: 200, body: { patients } };
}

export async function getPatientRoute(db: AppDatabase, id: string): Promise<RouteResult> {
  const found = await getPatientDetail(id, RepositoryScope.IncludeArchived, db);
  if (!found) return { status: 404, body: { error: 'Patient not found' } };
  return { status: 200, body: { patient: found } };
}

export async function updatePatientRoute(db: AppDatabase, id: string, rawBody: unknown): Promise<RouteResult> {
  const parsed = patientUpdateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { status: 422, body: { error: 'Validation failed', issues: parsed.error.issues } };
  }
  const updated = await updatePatient(id, parsed.data, db);
  if (!updated) return { status: 404, body: { error: 'Patient not found' } };
  return { status: 200, body: { patient: updated } };
}
