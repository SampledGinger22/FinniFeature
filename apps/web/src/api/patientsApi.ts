import type { PatientUpdateInput, PatientWithRelations } from '@finni/shared';

// Typed transport to the API (proxied to the @finni/api dev server in dev, Vercel functions in
// prod). Throws on non-2xx so TanStack Query surfaces the error state.
const PATIENTS_ENDPOINT = '/api/patients';

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

export async function updatePatientRequest(id: string, input: PatientUpdateInput): Promise<PatientWithRelations> {
  const response = await fetch(`${PATIENTS_ENDPOINT}/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ patient: PatientWithRelations }>(response);
  return data.patient;
}
