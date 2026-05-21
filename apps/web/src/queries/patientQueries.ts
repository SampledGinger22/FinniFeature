import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { PatientUpdateInput, PatientWithRelations } from '@finni/shared';
import { fetchPatients, updatePatientRequest } from '@/api/patientsApi';

// Query key factory so reads and invalidations reference the same keys (no stringly-typed drift).
export const patientQueryKeys = {
  all: ['patients'] as const,
  list: () => [...patientQueryKeys.all, 'list'] as const,
};

export function usePatientListQuery(): UseQueryResult<PatientWithRelations[], Error> {
  return useQuery({ queryKey: patientQueryKeys.list(), queryFn: fetchPatients });
}

interface UpdatePatientVariables {
  id: string;
  input: PatientUpdateInput;
}

// On success, invalidate the patient list so the edited record refreshes instantly (§9, the
// "rapid UI refresh" requirement — not hand-rolled).
export function useUpdatePatientMutation(): UseMutationResult<PatientWithRelations, Error, UpdatePatientVariables> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: UpdatePatientVariables) => updatePatientRequest(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: patientQueryKeys.all });
    },
  });
}
