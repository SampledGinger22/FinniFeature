import { defineConfig } from 'drizzle-kit';

// drizzle-kit reads this for `generate` (SQL migrations) and `push` (apply to a database).
// Default export is required by the drizzle-kit CLI (C5 tool-required exception).
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
});
