import { boolean, date, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { AddressType, ContactLabel, ContactMethodType, PatientStatus } from '@finni/shared';

// Drizzle schema (spec §6). UUID v7 PKs are app-generated in the service layer (no DB
// default). PHI free-text columns hold ciphertext (D39); date_of_birth/region/city stay
// queryable. Enum columns are typed via $type<> from @finni/shared — no native pg enum.

export const patient = pgTable(
  'patient',
  {
    id: uuid('id').primaryKey(),
    // Encrypted at the repository layer (D39).
    firstName: text('first_name').notNull(),
    middleName: text('middle_name'),
    lastName: text('last_name').notNull(),
    // Zoneless date; kept queryable for exact age range + sort (D39, §6.2).
    dateOfBirth: date('date_of_birth', { mode: 'string' }).notNull(),
    status: text('status').$type<PatientStatus>().notNull(),
    hasInsurance: boolean('has_insurance').notNull().default(false),
    archived: boolean('archived').notNull().default(false),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    // Default list query (live, non-archived, by status) + purge sweep (deleted_at prefix):
    // equality predicates first, so one index serves both (§6.3). Avoids a redundant index.
    index('patient_scope_idx').on(table.deletedAt, table.archived, table.status),
    // Age-range filtering (the hero filter) hits this directly (§6.3).
    index('patient_dob_idx').on(table.dateOfBirth),
  ],
);

export const address = pgTable(
  'address',
  {
    id: uuid('id').primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patient.id, { onDelete: 'cascade' }),
    type: text('type').$type<AddressType>().notNull(),
    isPrimary: boolean('is_primary').notNull().default(false),
    // Street-level identifiers are encrypted (D39).
    line1: text('line1'),
    line2: text('line2'),
    // Location filter columns — queryable plaintext (D39).
    city: text('city'),
    region: text('region').notNull(),
    postalCode: text('postal_code'),
    country: text('country').notNull().default('US'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    // Join from patient to its addresses (§6.3).
    index('address_patient_id_idx').on(table.patientId),
    // Location filter on state and city — headline filter (§6.3).
    index('address_region_idx').on(table.region),
    index('address_city_idx').on(table.city),
  ],
);

export const contactMethod = pgTable(
  'contact_method',
  {
    id: uuid('id').primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patient.id, { onDelete: 'cascade' }),
    type: text('type').$type<ContactMethodType>().notNull(),
    // Direct identifier — encrypted at the repository layer (D39).
    value: text('value').notNull(),
    label: text('label').$type<ContactLabel>().notNull(),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    // Join from patient to its contact methods (sibling to address_patient_id_idx).
    index('contact_method_patient_id_idx').on(table.patientId),
  ],
);
