import { z } from 'zod';
import { AddressType, ContactLabel, ContactMethodType, PatientStatus } from '@/enums/domainEnums';
import { DEFAULT_COUNTRY } from '@/constants/appConstants';
import { DateTimeUtil } from '@/datetime/DateTimeUtil';
import { zodEnum } from '@/schemas/zodEnum';

// Shared validation contract (spec §6.5). The create form and the API handler both use
// these schemas, so the rule set lives in exactly one place.

const MIN_PHONE_DIGITS = 7;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// DOB rule, shared by create and update so the calendar/future checks live in one place.
const dateOfBirthSchema = z
  .string()
  .regex(DATE_ONLY_PATTERN, 'Date of birth must be YYYY-MM-DD')
  .refine((value) => DateTimeUtil.isValidDate(value), 'Invalid calendar date')
  .refine((value) => !DateTimeUtil.isFuture(value), 'Date of birth cannot be in the future');

export const addressCreateSchema = z.object({
  type: zodEnum(AddressType).default(AddressType.Home),
  isPrimary: z.boolean().default(false),
  line1: z.string().trim().min(1).optional(),
  line2: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  // State — the required minimum that powers the location filter (§6.3).
  region: z.string().trim().min(1, 'State is required'),
  postalCode: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).default(DEFAULT_COUNTRY),
});

export const contactMethodCreateSchema = z
  .object({
    type: zodEnum(ContactMethodType),
    value: z.string().trim().min(1),
    label: zodEnum(ContactLabel).default(ContactLabel.Mobile),
    isPrimary: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.type === ContactMethodType.Email) {
      if (!z.string().email().safeParse(data.value).success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['value'], message: 'Invalid email address' });
      }
      return;
    }
    // Phone: require enough digits, ignoring spaces/dashes/parens.
    const digitCount = (data.value.match(/\d/g) ?? []).length;
    if (digitCount < MIN_PHONE_DIGITS) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['value'], message: 'Invalid phone number' });
    }
  });

export const patientCreateSchema = z.object({
  firstName: z.string().trim().min(1),
  middleName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1),
  dateOfBirth: dateOfBirthSchema,
  status: zodEnum(PatientStatus).default(PatientStatus.Inquiry),
  hasInsurance: z.boolean().default(false),
  addresses: z.array(addressCreateSchema).min(1, 'At least one address is required'),
  contactMethods: z
    .array(contactMethodCreateSchema)
    .min(1, 'At least one contact method is required')
    .refine(
      (methods) => methods.some((method) => method.type === ContactMethodType.Email),
      'At least one email contact is required',
    ),
});

// Primary-address patch carried by the edit drawer. region (state) stays required; the
// street/city/zip can be cleared (null). City/region remain queryable; line1/zip are PHI.
export const addressUpdateSchema = z.object({
  line1: z.string().trim().min(1).nullable(),
  city: z.string().trim().min(1).nullable(),
  region: z.string().trim().min(1, 'State is required'),
  postalCode: z.string().trim().min(1).nullable(),
});

// Email is validated like the create email; phone reuses the digit-count rule and may be null
// (cleared → the phone contact is removed).
const emailValueSchema = z.string().trim().email('Invalid email address');
const phoneValueSchema = z
  .string()
  .trim()
  .refine((value) => (value.match(/\d/g) ?? []).length >= MIN_PHONE_DIGITS, 'Invalid phone number');

// Edit-drawer contract: core patient fields plus the optional primary address and contacts. The
// same schema validates the edit form and the PATCH handler. middleName nullable so it can be
// cleared; the address/contact patches are optional so patient-only updates still validate.
export const patientUpdateSchema = z.object({
  firstName: z.string().trim().min(1),
  middleName: z.string().trim().min(1).nullable(),
  lastName: z.string().trim().min(1),
  dateOfBirth: dateOfBirthSchema,
  status: zodEnum(PatientStatus),
  hasInsurance: z.boolean(),
  primaryAddress: addressUpdateSchema.optional(),
  primaryEmail: emailValueSchema.optional(),
  phone: phoneValueSchema.nullable().optional(),
});

export type AddressCreateInput = z.infer<typeof addressCreateSchema>;
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;
export type ContactMethodCreateInput = z.infer<typeof contactMethodCreateSchema>;
export type PatientCreateInput = z.infer<typeof patientCreateSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;
