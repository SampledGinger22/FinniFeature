import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// tsconfigPaths wires the @/ alias for dev, build, and tests from one source (tsconfig).
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  // Dev: proxy /api to the local @finni/api dev server (zero-config pglite or Postgres).
  server: { proxy: { '/api': 'http://localhost:3001' } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Vitest owns src unit/component tests only; Playwright (./e2e) owns E2E + snapshots.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
