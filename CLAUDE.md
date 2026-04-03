# Context Canvas

Spatial workspace for composing AI context. Next.js 16, TypeScript, Tailwind CSS 4, @xyflow/react.

## Architecture: Clean Architecture

Client and server are distinct applications sharing a kernel. The Dependency Rule is the law: **source code dependencies point inward**.

```
src/
  kernel/             ← INNERMOST: shared pure types + transforms. Zero ports, zero frameworks.
    entities/         ← Data types (WorkspaceNode, Connection, Position, Viewport, PdfDocument)
    transforms/       ← Pure functions (createNode, moveNode, validateConnection, etc.)

  client/             ← CLIENT APPLICATION: its own Clean Architecture boundary
    domain/
      use-cases/      ← Port-dependent orchestration (loadWorkspace, uploadPdf, executePipeline)
      ports/          ← Interfaces defined by the client (StoragePort, PdfRendererPort, etc.)
    adapters/
      storage/        ← StoragePort, BlobStoragePort implementations (server, localStorage, IndexedDB)
      canvas/         ← xyflow ↔ domain mapping (flow-node-mapper, use-canvas-binding)
      pdf/            ← PdfRendererPort implementation (pdf.js)
      execution/      ← TransformExecutorPort implementation (Web Worker)
    ui/
      hooks/          ← React hooks bridging UI to domain use cases (via DI context)
      components/     ← React components (receive data + callbacks via props)
      app/            ← AdaptersContext (DI provider)
    lib/              ← Utilities (cn)

  server/             ← SERVER APPLICATION: Node.js-only utilities and adapters.
    config/           ← Provider roster and configuration (model-roster, provider dispatch config)
    storage/          ← Filesystem persistence (.context-canvas/workspace.json, blobs/)
    adapters/         ← External service adapters (Anthropic API, OpenAI-compatible via Vercel AI SDK)

  app/                ← COMPOSITION ROOT: Next.js App Router pages + API routes. Wires adapters to context.
```

### Rules (non-negotiable)

1. **Kernel imports NOTHING from client, React, Next.js, xyflow, or any framework.** Pure TypeScript only. No ports. If you're adding a framework import inside `src/kernel/`, stop.
2. **Client domain never imports from client adapters.** Ports are defined in `client/domain/ports/`, implemented in `client/adapters/`. The dependency arrow points inward.
3. **Kernel transforms are pure functions.** Data in, new data out. No mutation, no side effects, no port parameters.
4. **Client use cases may take ports as arguments.** They coordinate between kernel transforms and infrastructure via dependency injection.
5. **Hooks never import concrete adapters.** They receive port implementations via `useAdapters()` context. This makes them testable and adapter-swappable.
6. **Components receive data and callbacks via props.** They never import adapters or domain use cases directly.
7. **One composition root** (`src/app/page.tsx`) wires concrete adapters into `AdaptersProvider`. No other file creates adapter instances.
8. **All state updates must be immutable** (new object references). xyflow won't re-render if you mutate.
9. **Server layer imports only from kernel, Node.js built-ins, and server-side dependencies.** Never from client/. Server utilities are consumed by API routes in `src/app/api/`.

### xyflow Containment

xyflow imports are allowed in:
- `src/client/adapters/canvas/` — flow-node-mapper, use-canvas-binding
- `src/client/ui/components/` — Canvas.tsx, CanvasProvider.tsx, NodeShell.tsx, node components (MarkdownNode, PdfNode, TransformNode)

xyflow imports are NOT allowed in:
- `src/kernel/` — never
- `src/client/domain/` — never
- `src/client/ui/hooks/` — hooks receive framework-agnostic callbacks
- `src/app/` — uses CanvasProvider wrapper, not @xyflow directly

### Drag Concession Pattern

During an active drag, xyflow owns node position transiently (for 60fps). On `onNodeDragStop`, the final position is committed back to domain state via `moveNode`. Do not try to sync every pixel through React state.

### Persistence Pattern

- `StoragePort` interface in `client/domain/ports/`, `localStorageAdapter` in `client/adapters/storage/`
- localStorage key: `"context-canvas:workspace"`, JSON with `version: 4` envelope
- 300ms trailing-edge debounce on save after any mutation
- Synchronous `beforeunload` flush to prevent data loss on tab close
- `load()` returns `null` on any failure (parse error, missing key) — never throws

### Dependency Injection Pattern

- `AdaptersContext` in `client/ui/app/adapters-context.tsx` provides concrete adapters
- `useAdapters()` hook returns `{ storage, blobStorage, pdfRenderer, transformExecutor, chat, modelRoster }`
- `src/app/page.tsx` creates the `AdaptersProvider` with concrete instances
- Hooks and components consume via `useAdapters()` — never by direct import

## Design System: Vercel Geist

This project follows the [Geist design system](https://vercel.com/geist/introduction). All UI decisions must conform to these rules.

### Fonts

- **Geist Sans** (`font-sans`) — all UI text: headings, body, labels, buttons
- **Geist Mono** (`font-mono`) — code blocks, technical content, transform editor
- Never import or use other fonts

### Colors: semantic tokens only

**Never use hardcoded Tailwind colors** (`bg-red-500`, `text-gray-400`, `bg-zinc-900`, etc.). Always use shadcn semantic tokens.

| Geist level | Purpose | shadcn token |
|---|---|---|
| Gray 1-3 | Component backgrounds | `bg-background`, `bg-card`, `bg-muted` |
| Gray 4-6 | Borders | `border-border`, `border-input` |
| Gray 9 | Secondary text/icons | `text-muted-foreground` |
| Gray 10 | Primary text/icons | `text-foreground`, `text-card-foreground` |
| Destructive | Danger/delete actions | `bg-destructive`, `text-destructive-foreground` |
| Primary | Primary actions | `bg-primary`, `text-primary-foreground` |
| Indicator | Progress, activity, attention signals | `bg-indicator`, `text-indicator-foreground` |

### Canvas node rule

Canvas nodes must use `bg-background text-foreground`, not `bg-card`.

### Forbidden patterns

- `bg-white`, `bg-black`, `bg-gray-*`, `bg-zinc-*`, `bg-slate-*`, `bg-neutral-*`
- `text-white`, `text-black`, `text-gray-*`, `text-zinc-*`
- Any raw color: `bg-red-*`, `bg-blue-*`, `bg-green-*`, etc.
- Exception: `prose dark:prose-invert` for rendered markdown

### Components

Use shadcn/ui components (`src/client/ui/components/ui/`) for all standard UI elements. Install with `npx shadcn@latest add <component>`.

## Conventions

- **Files:** kebab-case (`create-node.ts`, `flow-node-mapper.ts`)
- **Components:** PascalCase (`MarkdownNode.tsx`, `Canvas.tsx`)
- **Types/entities:** PascalCase (`WorkspaceNode`, `Viewport`)
- **Kernel transforms:** camelCase exported functions (`createNode`, `moveNode`)
- **Ports:** PascalCase with `Port` suffix (`StoragePort`)
- **Barrel exports:** `index.ts` in `kernel/entities/`, `kernel/transforms/`. NO barrels for components (conflicts with `'use client'`).

## When adding a new feature

| What you're adding | Where it goes | What it can import |
|---|---|---|
| New data type | `kernel/entities/` | Nothing (other entities only) |
| New pure transform | `kernel/transforms/` | Kernel entities only |
| New port interface | `client/domain/ports/` | Kernel entities |
| New orchestration/use case | `client/domain/use-cases/` | Kernel + ports |
| New adapter | `client/adapters/` | Kernel + ports + the framework it adapts |
| New UI component | `client/ui/components/` | Other components, kernel types via props |
| New hook | `client/ui/hooks/` | Kernel transforms + client use cases + `useAdapters()` |

## Known traps

- `@xyflow/react` v12: Use `OnNodeDrag` type, not `NodeDragHandler` (doesn't exist)
- `fitView()` must be called after nodes render, not before
- Client components need `'use client'` directive (Next.js App Router)
- Tailwind v4: `@import "tailwindcss"` + `@plugin` syntax, not v3 `@tailwind` directives
- localStorage ~5MB limit — sufficient for text nodes, IndexedDB for binary
- `components.json` paths must match `client/ui/` structure for `npx shadcn add` to work
- PdfRendererPort.renderPage returns HTMLCanvasElement — known tech debt (DOM type in port interface)

## Specs

Feature specs live in `.specs/features/`. The context module is `context.md`. Both should be kept in sync with this file.
