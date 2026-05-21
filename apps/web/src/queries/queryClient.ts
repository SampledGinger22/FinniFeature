import { QueryClient } from '@tanstack/react-query';
import { DEFAULT_CACHE_TTL_MS } from '@finni/shared';

// TanStack Query owns all server data (§9). One client for the app; refetch-on-focus is off
// (a CRM caseload doesn't need to refetch every tab switch) and list staleness uses the shared TTL.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: DEFAULT_CACHE_TTL_MS, refetchOnWindowFocus: false, retry: 1 },
  },
});
