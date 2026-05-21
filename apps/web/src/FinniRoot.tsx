import { FinniThemeProvider } from '@/theme/FinniThemeProvider';
import { KitchenSinkPage } from '@/pages/KitchenSinkPage';

// App root: theme wiring wraps the page. The kitchen sink is the Step 3 surface; feature routing
// and the dashboard land from Step 4 onward.
export function FinniRoot(): JSX.Element {
  return (
    <FinniThemeProvider>
      <KitchenSinkPage />
    </FinniThemeProvider>
  );
}
