import { faker } from '@faker-js/faker';
import { AddressType, ContactMethodType, DateTimeUtil, PatientStatus, patientCreateSchema } from '@finni/shared';
import type { AppDatabase } from '@/db/client';
import { patient } from '@/db/schema';
import { archivePatient, createPatient, softDeletePatient } from '@/services/patientService';

// Deterministic seed (spec §13): fixed faker seed → identical dataset each run. Represents all
// six statuses across multiple US states with a has_insurance + email/phone mix, and guarantees
// the headline query ("intake / New York / under 30") returns rows. Takes an injected db so it
// backs both the CLI (Postgres) and the zero-config dev server (in-memory pglite).

const FAKER_SEED = 20240521;
const STATES = ['NY', 'CA', 'TX', 'FL', 'WA', 'IL', 'MA', 'GA'];
const PATIENTS_PER_STATUS = 6;
const STATUSES = Object.values(PatientStatus);
const currentYear = Number(DateTimeUtil.nowUtc().slice(0, 4));

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

// Build one patient's raw input; Zod applies defaults + validation before the service call.
function buildPatientInput(statusIndex: number, withinStatus: number) {
  const globalIndex = statusIndex * PATIENTS_PER_STATUS + withinStatus;
  const status = STATUSES[statusIndex] ?? PatientStatus.Inquiry;
  // Force the first inquiry patients to NY + under-30 so the hero filter always has signal.
  const isHeadline = status === PatientStatus.Inquiry && withinStatus < 3;
  const region = isHeadline ? 'NY' : (STATES[globalIndex % STATES.length] ?? 'NY');
  const age = isHeadline ? 20 + withinStatus * 3 : 8 + ((globalIndex * 7) % 62);
  const birthYear = currentYear - age;
  const month = 1 + (globalIndex % 12);
  const day = 1 + (globalIndex % 28);

  return patientCreateSchema.parse({
    firstName: faker.person.firstName(),
    middleName: globalIndex % 2 === 0 ? faker.person.middleName() : undefined,
    lastName: faker.person.lastName(),
    dateOfBirth: `${birthYear}-${pad(month)}-${pad(day)}`,
    status,
    hasInsurance: globalIndex % 3 !== 0,
    addresses: [
      {
        type: AddressType.Home,
        line1: faker.location.streetAddress(),
        city: faker.location.city(),
        region,
        postalCode: faker.location.zipCode(),
      },
    ],
    contactMethods: [
      { type: ContactMethodType.Email, value: faker.internet.email() },
      { type: ContactMethodType.Phone, value: faker.phone.number() },
    ],
  });
}

export interface SeedResult {
  total: number;
  archived: number;
  softDeleted: number;
}

export async function seedPatients(db: AppDatabase): Promise<SeedResult> {
  faker.seed(FAKER_SEED);

  // Wipe (cascade clears addresses + contacts) so the seed is idempotent.
  await db.delete(patient);

  const createdIds: string[] = [];
  for (let statusIndex = 0; statusIndex < STATUSES.length; statusIndex += 1) {
    for (let withinStatus = 0; withinStatus < PATIENTS_PER_STATUS; withinStatus += 1) {
      const record = await createPatient(buildPatientInput(statusIndex, withinStatus), db);
      createdIds.push(record.id);
    }
  }

  // Exercise the lifecycle states so the demo has archived + soft-deleted examples.
  const archivedId = createdIds[5];
  const deletedId = createdIds[11];
  if (archivedId) await archivePatient(archivedId, db);
  if (deletedId) await softDeletePatient(deletedId, db);

  return { total: createdIds.length, archived: archivedId ? 1 : 0, softDeleted: deletedId ? 1 : 0 };
}
