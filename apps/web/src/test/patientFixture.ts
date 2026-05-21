import { AddressType, ContactLabel, ContactMethodType, PatientStatus } from '@finni/shared';
import type { PatientWithRelations } from '@finni/shared';

// Builds a complete PatientWithRelations for component tests; override any field per case.
export function buildPatient(overrides: Partial<PatientWithRelations> = {}): PatientWithRelations {
  const timestamp = '2024-01-01T00:00:00.000Z';
  return {
    id: 'patient-1',
    firstName: 'Avery',
    middleName: null,
    lastName: 'Johnson',
    dateOfBirth: '1996-05-20',
    status: PatientStatus.Inquiry,
    hasInsurance: true,
    archived: false,
    deletedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    addresses: [
      {
        id: 'address-1',
        patientId: 'patient-1',
        type: AddressType.Home,
        isPrimary: true,
        line1: null,
        line2: null,
        city: 'Buffalo',
        region: 'NY',
        postalCode: null,
        country: 'US',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    contactMethods: [
      {
        id: 'contact-1',
        patientId: 'patient-1',
        type: ContactMethodType.Email,
        value: 'avery@example.com',
        label: ContactLabel.Mobile,
        isPrimary: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    ...overrides,
  };
}
