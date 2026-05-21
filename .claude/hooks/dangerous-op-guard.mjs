// H2 — Dangerous-operation guard. Blocks destructive or out-of-policy actions before
// they run: force-push, raw DROP/TRUNCATE, writes to secrets, and dayjs/raw-Date usage
// outside DateTimeUtil (rule C8). Runs for Bash and Write/Edit.
// Direct commits to main are allowed by decision D32 (solo demo; commit messages stand in
// for PRs), so no branch guard here.
import { readHookInput, allow, block } from './util.mjs';

const input = await readHookInput();
const tool = input?.tool_name ?? '';
const toolInput = input?.tool_input ?? {};

if (tool === 'Bash') {
  const command = toolInput.command ?? '';

  if (/git\s+push\b[^\n]*(--force(?!-with-lease)|\s-f\b)/.test(command)) {
    block('H2: force-push is blocked. Use --force-with-lease intentionally, or rebase/merge instead.');
  }
  if (/\b(DROP|TRUNCATE)\s+(TABLE|DATABASE|SCHEMA)\b/i.test(command)) {
    block('H2: raw DROP/TRUNCATE is blocked. Schema changes belong in reviewed migration files.');
  }
  allow();
}

if (tool === 'Write' || tool === 'Edit') {
  const file = (toolInput.file_path ?? '').replace(/\\/g, '/');
  const content = `${toolInput.content ?? ''}${toolInput.new_string ?? ''}`;

  if (/(^|\/)\.env(\.[^/]*)?$/.test(file) && !/\.env\.example$/.test(file)) {
    block('H2: writing to .env / secret files is blocked. Use .env.example for shared config keys.');
  }

  const isDateTimeUtil = /DateTimeUtil\.ts$/.test(file);
  if (!isDateTimeUtil) {
    if (/from\s+['"]dayjs['"]/.test(content) || /require\(\s*['"]dayjs['"]\s*\)/.test(content)) {
      block('H2 (C8): import dayjs only inside DateTimeUtil (@finni/shared).');
    }
    const exempt = /(\.test\.|\.spec\.|seed|\.config\.)/.test(file);
    if (!exempt && /\bnew\s+Date\s*\(/.test(content)) {
      block('H2 (C8): construct dates only in DateTimeUtil. Use DateTimeUtil for display/filter logic.');
    }
  }
  allow();
}

allow();
