import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { PatientCreateInput, PatientUpdateInput, PatientWithRelations } from '@finni/shared';
import {
  archivePatientRequest,
  blankSlateDemoRequest,
  createPatientRequest,
  fetchPatientsByScope,
  purgeExpiredDemoRequest,
  reseedDemoRequest,
  restorePatientRequest,
  softDeletePatientRequest,
  unarchivePatientRequest,
  updatePatientRequest,
} from '@/api/patientsApi';
import type { DemoSeedSummary } from '@/api/patientsApi';

// Query key factory so reads and invalidations reference the same keys (no stringly-typed drift).
// Scope is the one server-side dimension (it changes which rows are returned); the hero filters
// run client-side over the loaded set, so they are deliberately NOT part of the key.
export const patientQueryKeys = {
  all: ['patients'] as const,
  list: (scope: string) => [...patientQueryKeys.all, 'list', scope] as const,
};

export function usePatientListQuery(scope: string): UseQueryResult<PatientWithRelations[], Error> {
  return useQuery({ queryKey: patientQueryKeys.list(scope), queryFn: () => fetchPatientsByScope(scope) });
}

// Every mutation invalidates the whole patients tree so all scopes/views refresh (§9, rapid
// refresh — not hand-rolled). A shared helper keeps the onSuccess identical across mutations.
function useInvalidateOnSuccess(): () => void {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: patientQueryKeys.all });
}

export function useCreatePatientMutation(): UseMutationResult<PatientWithRelations, Error, PatientCreateInput> {
  const invalidate = useInvalidateOnSuccess();
  return useMutation({ mutationFn: createPatientRequest, onSuccess: invalidate });
}

interface UpdatePatientVariables {
  id: string;
  input: PatientUpdateInput;
}

export function useUpdatePatientMutation(): UseMutationResult<PatientWithRelations, Error, UpdatePatientVariables> {
  const invalidate = useInvalidateOnSuccess();
  return useMutation({
    mutationFn: ({ id, input }: UpdatePatientVariables) => updatePatientRequest(id, input),
    onSuccess: invalidate,
  });
}

export function useArchivePatientMutation(): UseMutationResult<PatientWithRelations, Error, string> {
  const invalidate = useInvalidateOnSuccess();
  return useMutation({ mutationFn: archivePatientRequest, onSuccess: invalidate });
}

export function useUnarchivePatientMutation(): UseMutationResult<PatientWithRelations, Error, string> {
  const invalidate = useInvalidateOnSuccess();
  return useMutation({ mutationFn: unarchivePatientRequest, onSuccess: invalidate });
}

export function useSoftDeletePatientMutation(): UseMutationResult<PatientWithRelations, Error, string> {
  const invalidate = useInvalidateOnSuccess();
  return useMutation({ mutationFn: softDeletePatientRequest, onSuccess: invalidate });
}

export function useRestorePatientMutation(): UseMutationResult<PatientWithRelations, Error, string> {
  const invalidate = useInvalidateOnSuccess();
  return useMutation({ mutationFn: restorePatientRequest, onSuccess: invalidate });
}

export function useReseedDemoMutation(): UseMutationResult<DemoSeedSummary, Error, void> {
  const invalidate = useInvalidateOnSuccess();
  return useMutation({ mutationFn: reseedDemoRequest, onSuccess: invalidate });
}

export function useBlankSlateDemoMutation(): UseMutationResult<{ removed: number }, Error, void> {
  const invalidate = useInvalidateOnSuccess();
  return useMutation({ mutationFn: blankSlateDemoRequest, onSuccess: invalidate });
}

export function usePurgeExpiredDemoMutation(): UseMutationResult<{ purged: number }, Error, void> {
  const invalidate = useInvalidateOnSuccess();
  return useMutation({ mutationFn: purgeExpiredDemoRequest, onSuccess: invalidate });
}
