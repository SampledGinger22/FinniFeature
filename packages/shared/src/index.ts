// @finni/shared — the single source of truth for types, enums, Zod schemas, constants,
// and DateTimeUtil. Both @finni/web and @finni/api import from here (spec §3).
export * from '@/enums/domainEnums';
export * from '@/enums/preferenceEnums';
export * from '@/types/entities';
export * from '@/constants/appConstants';
export * from '@/datetime/DateTimeUtil';
export * from '@/schemas/zodEnum';
export * from '@/schemas/patientSchemas';

// Retained until the real app shell replaces the Step 0 placeholder (Step 3).
export const SHARED_PACKAGE_NAME = '@finni/shared';
