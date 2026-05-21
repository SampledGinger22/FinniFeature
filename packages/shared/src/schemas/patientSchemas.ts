import { z } from 'zod';
import { AddressType, ContactLabel, ContactMethodType, PatientStatus } from '@/enums/domainEnums';
import { DEFAULT_COUNTRY } from '@/constants/appConstants';
import { DateTimeUtil } from '@/datetime/DateTimeUtil';
import { zodEnum } from '@/schemas/zodEnum';

// Shared validation contract (spec §6.5). The create form and the API handler both use
// these schemas, so the rule set lives in exactly one place.

const MIN_PHONE_DIGITS = 7;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
  dateOfBirth: z
    .string()
    .regex(DATE_ONLY_PATTERN, 'Date of birth must be YYYY-MM-DD')
    .refine((value) => DateTimeUtil.isValidDate(value), 'Invalid calendar date')
    .refine((value) => !DateTimeUtil.isFuture(value), 'Date of birth cannot be in the future'),
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

export type AddressCreateInput = z.infer<typeof addressCreateSchema>;
export type ContactMethodCreateInput = z.infer<typeof contactMethodCreateSchema>;
export type PatientCreateInput = z.infer<typeof patientCreateSchema>;
