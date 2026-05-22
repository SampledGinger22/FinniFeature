import type { PatientCreateInput, PatientUpdateInput, PatientWithRelations } from '@finni/shared';

// Typed transport to the API (proxied to the @finni/api dev server in dev, Vercel functions in
// prod). Throws on non-2xx so TanStack Query surfaces the error state.
const PATIENTS_ENDPOINT = '/api/patients';
const DEMO_ENDPOINT = '/api/demo';

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Request failed (${response.status}) ${detail || response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchPatients(): Promise<PatientWithRelations[]> {
  const data = await parseJson<{ patients: PatientWithRelations[] }>(await fetch(PATIENTS_ENDPOINT));
  return data.patients;
}

export async function fetchPatientsByScope(scope: string): Promise<PatientWithRelations[]> {
  const data = await parseJson<{ patients: PatientWithRelations[] }>(
    await fetch(`${PATIENTS_ENDPOINT}?scope=${encodeURIComponent(scope)}`),
  );
  return data.patients;
}

export async function createPatientRequest(input: PatientCreateInput): Promise<PatientWithRelations> {
  const response = await fetch(PATIENTS_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ patient: PatientWithRelations }>(response);
  return data.patient;
}

export async function updatePatientRequest(id: string, input: PatientUpdateInput): Promise<PatientWithRelations> {
  const response = await fetch(`${PATIENTS_ENDPOINT}/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ patient: PatientWithRelations }>(response);
  return data.patient;
}

// Lifecycle transitions hit the action sub-resources; each returns the post-transition record.
async function postPatientAction(id: string, action: string): Promise<PatientWithRelations> {
  const response = await fetch(`${PATIENTS_ENDPOINT}/${id}/${action}`, { method: 'POST' });
  const data = await parseJson<{ patient: PatientWithRelations }>(response);
  return data.patient;
}

export async function archivePatientRequest(id: string): Promise<PatientWithRelations> {
  return postPatientAction(id, 'archive');
}

export async function unarchivePatientRequest(id: string): Promise<PatientWithRelations> {
  return postPatientAction(id, 'unarchive');
}

export async function restorePatientRequest(id: string): Promise<PatientWithRelations> {
  return postPatientAction(id, 'restore');
}

export async function softDeletePatientRequest(id: string): Promise<PatientWithRelations> {
  const response = await fetch(`${PATIENTS_ENDPOINT}/${id}`, { method: 'DELETE' });
  const data = await parseJson<{ patient: PatientWithRelations }>(response);
  return data.patient;
}

// Permanent delete — returns no patient (the record is gone), only the purge outcome.
export async function purgePatientRequest(id: string): Promise<{ purged: boolean }> {
  return parseJson<{ purged: boolean }>(await fetch(`${PATIENTS_ENDPOINT}/${id}/purge`, { method: 'POST' }));
}

export interface DemoSeedSummary {
  total: number;
  archived: number;
  softDeleted: number;
}

async function postDemoAction<T>(action: string): Promise<T> {
  return parseJson<T>(await fetch(`${DEMO_ENDPOINT}/${action}`, { method: 'POST' }));
}

export async function reseedDemoRequest(): Promise<DemoSeedSummary> {
  return postDemoAction<DemoSeedSummary>('reseed');
}

export async function blankSlateDemoRequest(): Promise<{ removed: number }> {
  return postDemoAction<{ removed: number }>('blank-slate');
}

export async function purgeExpiredDemoRequest(): Promise<{ purged: number }> {
  return postDemoAction<{ purged: number }>('purge');
}
