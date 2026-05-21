// H3 — Documentation-sync gate. On `git commit`, if the staged change touches a data
// shape, enum, schema, or architectural rule, block (exit 2) unless .docs/CHANGELOG.md
// is staged in the same commit. Keeps code and docs moving together.
import { execSync } from 'node:child_process';
import { readHookInput, allow, block } from './util.mjs';

const input = await readHookInput();
const command = input?.tool_input?.command ?? '';
if (!/\bgit\s+commit\b/.test(command)) allow();

let staged = [];
try {
  staged = execSync('git diff --cached --name-only', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
} catch {
  allow();
}

// A change to any of these implies a shape/enum/schema/architecture change.
const shapeChanged = staged.some(
  (file) =>
    /^packages\/shared\/src\/.*\.ts$/.test(file) ||
    /schema.*\.ts$/.test(file) ||
    /\.enum\.ts$/.test(file) ||
    file === 'CLAUDE.md' ||
    file === '.docs/02-technical-spec.md',
);
if (!shapeChanged) allow();

if (!staged.includes('.docs/CHANGELOG.md')) {
  block(
    'H3: a data-shape/enum/schema/architecture change is staged, but .docs/CHANGELOG.md is not. ' +
      'Append a changelog entry (what + why) and stage it in the same commit.',
  );
}
allow();
