import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { FinniThemeProvider } from '@/theme/FinniThemeProvider';
import { queryClient } from '@/queries/queryClient';
import { CaseloadPage } from '@/pages/CaseloadPage';
import { KitchenSinkPage } from '@/pages/KitchenSinkPage';

// App root: server-state (TanStack Query) and theme wrap the router. The caseload is the app;
// the kitchen sink stays reachable as the QA/visual-regression surface.
export function FinniRoot(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <FinniThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CaseloadPage />} />
            <Route path="/kitchen-sink" element={<KitchenSinkPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </FinniThemeProvider>
    </QueryClientProvider>
  );
}
