// Domain enums — const-object union pattern (spec §6.4). Reads like an enum at call sites,
// compiles to a plain string, satisfies Zod and Drizzle without shims. Never native `enum`.

// Six-stage patient lifecycle (D9). Order reflects care progression.
export const PatientStatus = {
  Inquiry: 'inquiry',
  Waitlisted: 'waitlisted',
  Onboarding: 'onboarding',
  Active: 'active',
  Paused: 'paused',
  Churned: 'churned',
} as const;
export type PatientStatus = (typeof PatientStatus)[keyof typeof PatientStatus];

export const AddressType = {
  Home: 'home',
  Billing: 'billing',
  Other: 'other',
} as const;
export type AddressType = (typeof AddressType)[keyof typeof AddressType];

// Email/phone only for v1 (D17); fax/other deferred as a schema-safe addition.
export const ContactMethodType = {
  Email: 'email',
  Phone: 'phone',
} as const;
export type ContactMethodType = (typeof ContactMethodType)[keyof typeof ContactMethodType];

export const ContactLabel = {
  Mobile: 'mobile',
  Home: 'home',
  Work: 'work',
} as const;
export type ContactLabel = (typeof ContactLabel)[keyof typeof ContactLabel];
