import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { FinniThemeProvider } from '@/theme/FinniThemeProvider';
import { queryClient } from '@/queries/queryClient';
import { AppShell } from '@/components/templates/AppShell';
import { CaseloadPage } from '@/pages/CaseloadPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TrashPage } from '@/pages/TrashPage';
import { KitchenSinkPage } from '@/pages/KitchenSinkPage';

// Wraps every real workspace page in the shared sidebar shell via an Outlet; pages supply only
// their own PageHeader and content.
function ShellLayout(): JSX.Element {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

// App root: server-state (TanStack Query) and theme wrap the router. The workspace pages share
// the AppShell; the kitchen sink stays bare as the QA/visual-regression surface.
export function FinniRoot(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <FinniThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<ShellLayout />}>
              <Route path="/" element={<CaseloadPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/trash" element={<TrashPage />} />
            </Route>
            <Route path="/kitchen-sink" element={<KitchenSinkPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </FinniThemeProvider>
    </QueryClientProvider>
  );
}
