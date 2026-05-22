import { describe, expect, it } from 'vitest';
import { patientCreateSchema, patientUpdateSchema } from '@/schemas/patientSchemas';
import { AddressType, ContactLabel, ContactMethodType, PatientStatus } from '@/enums/domainEnums';

// A minimal valid payload; tests clone and mutate it to isolate one rule at a time.
// The return type widens `type` to ContactMethodType so tests can push phone contacts.
function validPayload(): {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  addresses: Array<{ region: string }>;
  contactMethods: Array<{ type: ContactMethodType; value: string }>;
} {
  return {
    firstName: 'Ada',
    lastName: 'Lovelace',
    dateOfBirth: '1990-12-10',
    addresses: [{ region: 'NY' }],
    contactMethods: [{ type: ContactMethodType.Email, value: 'ada@example.com' }],
  };
}

describe('patientCreateSchema — happy path', () => {
  it('accepts a minimal valid payload', () => {
    expect(patientCreateSchema.safeParse(validPayload()).success).toBe(true);
  });

  it('applies defaults: Inquiry status, US country, hasInsurance false, primary flags', () => {
    const parsed = patientCreateSchema.parse(validPayload());
    expect(parsed.status).toBe(PatientStatus.Inquiry);
    expect(parsed.hasInsurance).toBe(false);
    expect(parsed.addresses[0]?.country).toBe('US');
    expect(parsed.addresses[0]?.type).toBe(AddressType.Home);
    expect(parsed.contactMethods[0]?.label).toBe(ContactLabel.Mobile);
  });

  it('accepts a phone contact alongside the required email', () => {
    const payload = validPayload();
    payload.contactMethods.push({ type: ContactMethodType.Phone, value: '+1 (212) 555-0142' });
    expect(patientCreateSchema.safeParse(payload).success).toBe(true);
  });
});

describe('patientCreateSchema — required fields', () => {
  it('rejects an empty first name', () => {
    const payload = { ...validPayload(), firstName: '' };
    expect(patientCreateSchema.safeParse(payload).success).toBe(false);
  });

  it('rejects when there is no address', () => {
    const payload = { ...validPayload(), addresses: [] };
    expect(patientCreateSchema.safeParse(payload).success).toBe(false);
  });

  it('rejects an address with no region (state)', () => {
    const payload = { ...validPayload(), addresses: [{ region: '' }] };
    expect(patientCreateSchema.safeParse(payload).success).toBe(false);
  });

  it('rejects when no contact method is an email', () => {
    const payload = {
      ...validPayload(),
      contactMethods: [{ type: ContactMethodType.Phone, value: '212-555-0142' }],
    };
    expect(patientCreateSchema.safeParse(payload).success).toBe(false);
  });
});

describe('patientCreateSchema — date of birth', () => {
  it('rejects a future date of birth', () => {
    const payload = { ...validPayload(), dateOfBirth: '3000-01-01' };
    expect(patientCreateSchema.safeParse(payload).success).toBe(false);
  });

  it('rejects an impossible calendar date', () => {
    const payload = { ...validPayload(), dateOfBirth: '2001-02-29' };
    expect(patientCreateSchema.safeParse(payload).success).toBe(false);
  });

  it('rejects a non-YYYY-MM-DD format', () => {
    const payload = { ...validPayload(), dateOfBirth: '12/10/1990' };
    expect(patientCreateSchema.safeParse(payload).success).toBe(false);
  });
});

describe('patientCreateSchema — contact value validation', () => {
  it('rejects an invalid email value', () => {
    const payload = {
      ...validPayload(),
      contactMethods: [{ type: ContactMethodType.Email, value: 'not-an-email' }],
    };
    expect(patientCreateSchema.safeParse(payload).success).toBe(false);
  });

  it('rejects a phone with too few digits', () => {
    const payload = validPayload();
    payload.contactMethods.push({ type: ContactMethodType.Phone, value: '123' });
    expect(patientCreateSchema.safeParse(payload).success).toBe(false);
  });
});

describe('patientUpdateSchema', () => {
  const base = {
    firstName: 'Ada',
    middleName: null,
    lastName: 'Lovelace',
    dateOfBirth: '1990-12-10',
    status: PatientStatus.Active,
    hasInsurance: true,
  };

  it('accepts patient-only updates (address/contacts optional)', () => {
    expect(patientUpdateSchema.safeParse(base).success).toBe(true);
  });

  it('accepts a primary address, email, and phone patch', () => {
    const payload = {
      ...base,
      primaryAddress: { line1: '1 Test St', city: 'Albany', region: 'NY', postalCode: '12207' },
      primaryEmail: 'ada@example.com',
      phone: '+1 212 555 0142',
    };
    expect(patientUpdateSchema.safeParse(payload).success).toBe(true);
  });

  it('allows phone to be null (cleared)', () => {
    expect(patientUpdateSchema.safeParse({ ...base, phone: null }).success).toBe(true);
  });

  it('rejects a primary address with no region (state)', () => {
    const payload = { ...base, primaryAddress: { line1: null, city: null, region: '', postalCode: null } };
    expect(patientUpdateSchema.safeParse(payload).success).toBe(false);
  });

  it('rejects an invalid primary email', () => {
    expect(patientUpdateSchema.safeParse({ ...base, primaryEmail: 'not-an-email' }).success).toBe(false);
  });
});
