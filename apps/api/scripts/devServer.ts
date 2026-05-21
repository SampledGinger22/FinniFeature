import { startDevApiServer } from '@/http/devServer';

// Local dev entry. The server logic lives in src/ (type-checked); this just starts it.
startDevApiServer().catch((error: unknown) => {
  console.error('[api] failed to start dev server:', error);
  process.exit(1);
});
