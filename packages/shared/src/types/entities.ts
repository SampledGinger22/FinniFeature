import type { AddressType, ContactLabel, ContactMethodType, PatientStatus } from '@/enums/domainEnums';
import type { Density, FontFamily, FontScale, ThemePalette } from '@/enums/preferenceEnums';

// Entity transport shapes (spec §6.1). TS uses camelCase; the Drizzle layer maps to the
// snake_case columns (D35). Timestamps are ISO-8601 UTC strings; DOB is a zoneless date.

export interface Patient {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  // Zoneless YYYY-MM-DD; age is derived via DateTimeUtil.calculateAge, never stored (§6.2).
  dateOfBirth: string;
  status: PatientStatus;
  hasInsurance: boolean;
  archived: boolean;
  // null = live; an ISO-UTC timestamp = soft-deleted, purged after SOFT_DELETE_PURGE_DAYS.
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  patientId: string;
  type: AddressType;
  isPrimary: boolean;
  line1: string | null;
  line2: string | null;
  city: string | null;
  // State — required minimum and indexed; drives the location filter (§6.3).
  region: string;
  postalCode: string | null;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMethod {
  id: string;
  patientId: string;
  type: ContactMethodType;
  value: string;
  label: ContactLabel;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

// Patient with its normalized children — the shape the list/detail views consume.
export interface PatientWithRelations extends Patient {
  addresses: Address[];
  contactMethods: ContactMethod[];
}

// Device-local UI preferences (spec §10). timezone null = resolve to the browser default.
export interface UserPreferences {
  fontFamily: FontFamily;
  fontScale: FontScale;
  themePalette: ThemePalette;
  density: Density;
  timezone: string | null;
}
