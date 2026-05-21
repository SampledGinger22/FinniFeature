// Shared helpers for Claude Code PreToolUse hooks.
// Exit 2 blocks the tool call (stderr is surfaced to the model); exit 0 allows it.

export async function readHookInput() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

export function block(message) {
  console.error(message);
  process.exit(2);
}

export function allow() {
  process.exit(0);
}
