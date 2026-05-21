import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FinniThemeProvider } from '@/theme/FinniThemeProvider';

// Wraps a component in the providers it needs under test: a fresh QueryClient (retries off so
// errors surface immediately) and the theme/antd App context (createStyles, message).
export function renderWithProviders(ui: ReactElement): RenderResult {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return (
      <QueryClientProvider client={client}>
        <FinniThemeProvider>{children}</FinniThemeProvider>
      </QueryClientProvider>
    );
  }
  return render(ui, { wrapper: Wrapper });
}
