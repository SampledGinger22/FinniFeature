// Service layer holds business logic; handlers call exactly one service method (spec §5).
// Placeholder until the patient service lands in Step 2.
export interface HealthStatus {
  status: 'ok';
  package: string;
}

export function getHealthStatus(): HealthStatus {
  return { status: 'ok', package: '@finni/api' };
}
