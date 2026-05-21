---
name: new-component
description: Scaffold a React component the project's way — correct atomic tier, token-only styling, named export, globally unique name, and error/empty/loading states where applicable. Use when creating any new UI component in @finni/web.
---

# new-component

Consistency across many components — including ones built in parallel (Step 5) — is exactly
where hand-built UIs drift. Scaffold every component this way.

## Steps

1. **Pick the atomic tier**: atom → molecule → organism → template → page. One canonical
   component per concept (rule C4). If the concept already exists, extend it; do not make a
   second variant.
2. **Name it uniquely** across the whole project (rule C4). No collisions, no aliasing.
3. **Styling is token-only** (rules C6/C9): every value references a design token — the antd
   `ConfigProvider` theme or a `:root` CSS var. No raw hex, px, or magic numbers. Style files
   use the `*.styles.ts` convention (where the no-magic-number lint applies).
4. **Named export** (rule C5). No default export.
5. **States** (organisms/views, hard requirement): give it its own error boundary, skeleton
   loading state, and a designed empty state. One widget failing must never blank the page.
6. **Dates** through `DateTimeUtil` only (rule C8) — never `new Date()` or dayjs directly.
7. **Colocated test** (`*.test.tsx`): render + the states above (loading/empty/error where
   applicable). Add it to the kitchen-sink page so it has visual-regression coverage.

## Reference
The approved vertical slice (patient list + edit drawer, Step 4) is the canonical pattern.
Copy its structure for data (TanStack Query), local state (useState), and global UI state
(Zustand) before inventing anything new.
