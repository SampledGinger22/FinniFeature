import { SHARED_PACKAGE_NAME } from '@finni/shared';

// Step 0 placeholder shell — proves cross-package (@finni/shared) + @/ resolution.
// Real app (theme, router, dashboard) lands from Step 3 onward.
export function App(): JSX.Element {
  return (
    <main>
      <h1>Finni — Patient CRM</h1>
      <p>Scaffolding online. Contract package: {SHARED_PACKAGE_NAME}</p>
    </main>
  );
}
