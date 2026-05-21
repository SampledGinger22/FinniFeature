import { z } from 'zod';

// Build a Zod enum from a const-object enum (§6.4) so the enum stays the single source —
// the schema can't drift from the values it validates.
export function zodEnum<T extends Record<string, string>>(enumObject: T) {
  const values = Object.values(enumObject) as [T[keyof T], ...T[keyof T][]];
  return z.enum(values);
}
