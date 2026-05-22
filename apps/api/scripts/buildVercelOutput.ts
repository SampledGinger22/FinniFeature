import { build } from 'esbuild';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Build Output API (v3) generator: @vercel/node does not resolve TS path aliases, so we
// bundle each function ourselves (esbuild resolves @/ + inlines @finni/shared) and emit a
// prebuilt .vercel/output that Vercel serves verbatim — keeping @/ in source (C2/D60).
const scriptDir = dirname(fileURLToPath(import.meta.url));
const apiDir = resolve(scriptDir, '..');
const repoRoot = resolve(apiDir, '..', '..');
const webDist = join(repoRoot, 'apps', 'web', 'dist');
const outputRoot = join(apiDir, '.vercel', 'output');
const functionsRoot = join(outputRoot, 'functions');
const staticRoot = join(outputRoot, 'static');

// Sources live in functions/ (not api/) so Vercel's zero-config does not also auto-compile
// them; out is the deployed function path that config.json routes map clean URLs onto.
const FUNCTIONS = [
  { entry: 'functions/health.ts', out: 'api/health' },
  { entry: 'functions/patients.ts', out: 'api/patients' },
  { entry: 'functions/patients-item.ts', out: 'api/patients-item' },
  { entry: 'functions/patients-action.ts', out: 'api/patients-action' },
  { entry: 'functions/demo-action.ts', out: 'api/demo-action' },
];

// shouldAddHelpers wires the @vercel/node req.query/req.body/res.json helpers the handlers use.
const vcConfig = JSON.stringify(
  { runtime: 'nodejs22.x', handler: 'index.js', launcherType: 'Nodejs', shouldAddHelpers: true },
  null,
  2,
);

// Dynamic URLs rewrite to the bracket-free functions, passing path segments as query params;
// filesystem then serves them and static; unmatched /api is 404, everything else is the SPA.
const routingConfig = JSON.stringify(
  {
    version: 3,
    routes: [
      { src: '^/api/patients/([^/]+)/([^/]+)/?$', dest: '/api/patients-action?id=$1&action=$2' },
      { src: '^/api/patients/([^/]+)/?$', dest: '/api/patients-item?id=$1' },
      { src: '^/api/demo/([^/]+)/?$', dest: '/api/demo-action?action=$1' },
      { handle: 'filesystem' },
      { src: '^/api/.*$', status: 404 },
      { src: '/(.*)', dest: '/index.html' },
    ],
  },
  null,
  2,
);

async function main(): Promise<void> {
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(functionsRoot, { recursive: true });
  await cp(webDist, staticRoot, { recursive: true });

  for (const fn of FUNCTIONS) {
    const funcDir = join(functionsRoot, `${fn.out}.func`);
    await mkdir(funcDir, { recursive: true });
    await build({
      entryPoints: [join(apiDir, fn.entry)],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node22',
      outfile: join(funcDir, 'index.js'),
      absWorkingDir: apiDir,
      tsconfig: join(apiDir, 'tsconfig.json'),
      logLevel: 'warning',
    });
    await writeFile(join(funcDir, '.vc-config.json'), vcConfig);
  }

  await writeFile(join(outputRoot, 'config.json'), routingConfig);
  console.log(`[vercel-build] wrote ${FUNCTIONS.length} functions + static to ${outputRoot}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
