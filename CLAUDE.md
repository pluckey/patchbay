# Context Canvas

Spatial workspace for composing AI context. Next.js 16, TypeScript, Tailwind CSS 4, @xyflow/react.

## Architecture: Clean Architecture (Uncle Bob)

The Dependency Rule is the law of this codebase: **source code dependencies point inward**.

```
src/
  domain/           ← INNER: zero framework imports. Pure TypeScript only.
    entities/       ← Data types (WorkspaceNode, Workspace, Position, Viewport)
    use-cases/      ← Pure functions (createNode, moveNode, etc.)
    ports/          ← Interfaces defined by domain (StoragePort)
  adapters/         ← MIDDLE: implements ports, maps between domain and frameworks
    storage/        ← StoragePort implementations (localStorage)
    canvas/         ← xyflow <-> domain type mapping (FlowNodeMapper)
  components/       ← OUTER: React components
  hooks/            ← OUTER: React hooks bridging UI to domain use cases
  app/              ← OUTER: Next.js App Router pages
```

### Rules (non-negotiable)

1. **Domain layer imports NOTHING from React, Next.js, xyflow, or any framework.** If you're adding an import from a framework package inside `src/domain/`, stop — you're violating the Dependency Rule.
2. **Use cases are pure functions, not classes.** They take data in, return new data out. No mutation, no side effects. `(nodes, nodeId, content) => WorkspaceNode[]` — that's it.
3. **Ports are defined by the domain, implemented by adapters.** The domain declares what it needs (StoragePort). The adapter layer provides it (localStorageAdapter). Never import an adapter inside domain.
4. **xyflow types are contained to exactly 2 files:** `src/adapters/canvas/flow-node-mapper.ts` and `src/components/Canvas.tsx`. No xyflow imports anywhere else. This is what makes the canvas library swappable.
5. **All state updates must be immutable** (new object references). xyflow won't re-render if you mutate. Use cases already enforce this — don't break it.
6. **Hooks bridge UI to domain.** `useWorkspace` calls domain use cases. It does NOT re-implement logic. The hook is a bridge, not a brain.

### Drag Concession Pattern

During an active drag, xyflow owns node position transiently (for 60fps). On `onNodeDragStop`, the final position is committed back to domain state via `moveNode`. Do not try to sync every pixel through React state.

### Persistence Pattern

- `StoragePort` interface in domain, `localStorageAdapter` in adapters
- localStorage key: `"context-canvas:workspace"`, JSON with `version: 1` envelope
- 300ms trailing-edge debounce on save after any mutation
- Synchronous `beforeunload` flush to prevent data loss on tab close
- `load()` returns `null` on any failure (parse error, missing key) — never throws

## Conventions

- **Files:** kebab-case (`create-node.ts`, `flow-node-mapper.ts`)
- **Components:** PascalCase (`MarkdownNode.tsx`, `Canvas.tsx`)
- **Types/entities:** PascalCase (`WorkspaceNode`, `Viewport`)
- **Use cases:** camelCase exported functions (`createNode`, `moveNode`)
- **Ports:** PascalCase with `Port` suffix (`StoragePort`)
- **Barrel exports:** `index.ts` in `entities/` and `use-cases/`

## When adding a new feature

Ask: where does it live in the dependency graph?

| What you're adding | Where it goes | What it can import |
|---|---|---|
| New data type | `domain/entities/` | Nothing (other entities only) |
| New user action | `domain/use-cases/` | Entities + ports only |
| New external boundary | `domain/ports/` (interface) + `adapters/` (implementation) | Port imports entities; adapter imports port |
| New UI element | `components/` | Other components, hooks |
| New framework integration | `adapters/` | Domain types + the framework |

## Known traps

- `@xyflow/react` v12: Use `OnNodeDrag` type, not `NodeDragHandler` (doesn't exist)
- `fitView()` must be called after nodes render, not before — use `onInit` or post-render callback
- Client components need `'use client'` directive (Next.js App Router)
- Tailwind v4: `@import "tailwindcss"` + `@plugin` syntax, not v3 `@tailwind` directives
- localStorage ~5MB limit — sufficient for text nodes, will need migration for binary sources

## Specs

Feature specs live in `.specs/features/`. The context module for the Feature Architect protocol is `context.md`. Both should be kept in sync with this file if architectural patterns change.
