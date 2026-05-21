// H1 — Pre-commit quality gate. On any `git commit`, run lint + type-check and block
// the commit (exit 2) on failure. The same gate Husky runs at git level; this catches
// it earlier, before the Bash tool call reaches git.
import { execSync } from 'node:child_process';
import { readHookInput, allow, block } from './util.mjs';

const input = await readHookInput();
const command = input?.tool_input?.command ?? '';
if (!/\bgit\s+commit\b/.test(command)) allow();

try {
  execSync('bun run lint && bun run type-check', { stdio: 'pipe' });
  allow();
} catch (error) {
  const output = `${error.stdout?.toString() ?? ''}${error.stderr?.toString() ?? ''}`;
  block(`H1 quality gate failed — commit blocked. Fix these before committing:\n${output}`);
}
