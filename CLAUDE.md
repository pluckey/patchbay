# Context Canvas

Spatial workspace for composing AI context. Next.js 16, TypeScript, Tailwind CSS 4, @xyflow/react.

## Architecture: Clean Architecture

Client and server are distinct applications sharing a kernel. The Dependency Rule is the law: **source code dependencies point inward**.

```
src/
  kernel/             ← INNERMOST: shared pure types + transforms. Zero ports, zero frameworks.
    entities/         ← Data types (WorkspaceNode, Connection, Position, Viewport, PdfDocument)
    transforms/       ← Pure functions (createNode, moveNode, validateConnection, etc.)
    source-kinds/     ← Source kind plugin registry (registry, contribution type). Pure data, no concrete kinds.

  client/             ← CLIENT APPLICATION: its own Clean Architecture boundary
    domain/
      use-cases/      ← Port-dependent orchestration (loadWorkspace, uploadPdf, executePipeline)
      ports/          ← Interfaces defined by the client (StoragePort, PdfRendererPort, etc.)
    adapters/
      storage/        ← StoragePort, BlobStoragePort implementations (server, localStorage, IndexedDB)
      canvas/         ← xyflow ↔ domain mapping (flow-node-mapper, use-canvas-binding)
      pdf/            ← PdfRendererPort implementation (pdf.js)
      execution/      ← TransformExecutorPort implementation (Web Worker)
      chat/           ← ChatPort implementation (fetch to /api/chat)
      model-roster/   ← ModelRosterPort implementation (fetch to /api/models)
      ai-executor/    ← AiExecutorPort implementation (fetch to /api/chat, non-streaming)
    source-kinds/     ← Concrete source kind contributions (markdown, pdf, derived) registered into the kernel registry
    ui/
      hooks/          ← React hooks bridging UI to domain use cases (via DI context)
      components/     ← React components (receive data + callbacks via props)
      app/            ← AdaptersContext + WorkspaceManagerContext (DI providers)
    lib/              ← Utilities (cn, parseStructuredOutput)

  server/             ← SERVER APPLICATION: Node.js-only utilities and adapters.
    config/           ← Provider roster and configuration (model-roster, provider dispatch config)
    storage/          ← Filesystem persistence (.context-canvas/manifest.json, workspaces/, blobs/)
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
- `src/client/ui/components/` — any component whose primary responsibility is rendering or wiring a canvas node or edge. The rule is "node/edge rendering files only." Current examples: `Canvas.tsx`, `CanvasProvider.tsx`, the shared chrome (`NodeChrome.tsx`, `NodeIOHandles.tsx`, `NodeShell.tsx`, `CellShell.tsx`), the per-type renderers (`MarkdownNode`, `PdfNode`, `TransformNode`, `ChatNode`, `AiTransformNode`, `CellNode`), and the edge renderer (`LabeledEdge`).

xyflow imports are NOT allowed in:
- `src/kernel/` — never
- `src/client/domain/` — never
- `src/client/ui/hooks/` — hooks receive framework-agnostic callbacks
- `src/app/` — uses CanvasProvider wrapper, not @xyflow directly

### Drag Concession Pattern

During an active drag, xyflow owns node position transiently (for 60fps). On `onNodeDragStop`, the final position is committed back to domain state via `moveNode`. Do not try to sync every pixel through React state.

### Source Kind Registry Pattern

Cell source kinds (markdown, pdf, derived, ...) are pluggable through a shared registry. The kernel owns the registry shape; the client owns the concrete contributions and the registration entrypoint.

- **Kernel side** (`src/kernel/source-kinds/`): `SourceKindContribution` type + `SourceKindRegistry` class + the `sourceKindRegistry` singleton. Pure data, no framework dependencies. The registry's `register` is idempotent for hot-reload (Next.js Fast Refresh re-evaluates contribution modules).
- **Client side** (`src/client/source-kinds/`): one file per concrete kind (`markdown-source-kind.ts`, `pdf-source-kind.ts`, `derived-source-kind.ts`) plus an `index.ts` that imports the kernel registry and registers each contribution as a side effect.
- **Single registration point**: both the main thread and the cell worker import `client/source-kinds/index.ts` to populate their context's registry. Adding a new source kind = one new contribution file + one `register()` call. No other file changes.
- The four named consumers (cell worker, cell executor, type-def generator, cascade) all go through `sourceKindRegistry.get(kind)` — they never import a specific contribution file directly.

### Persistence Pattern

- `StoragePort` interface in `client/domain/ports/`, adapters in `client/adapters/storage/`
- **Multi-workspace**: Each workspace is a separate scope with its own nodes, connections, and viewport
- **Scoped adapter factory**: `createScopedServerStorageAdapter(workspaceId)` returns a `StoragePort` bound to a specific workspace. The `StoragePort` interface is unchanged — consumers don't know they're scoped
- **Server layout**: `.context-canvas/manifest.json` (workspace registry) + `.context-canvas/workspaces/{id}.json` (per-workspace data). Legacy `workspace.json` preserved as backup after migration
- **Manifest store**: `server/storage/fs-manifest-store.ts` — `readManifest()`, `writeManifest()`, `withManifestLock()`. Independent mutex from workspace lock
- **Lazy migration**: `server/storage/migrate-to-multi-workspace.ts` — idempotent, triggered on first `GET /api/workspaces`. Migrates legacy single-file format to multi-workspace
- **API routes**: `GET/POST/PATCH /api/workspaces` (collection + activeId), `GET/PUT/DELETE/PATCH /api/workspaces/[id]` (instance), `POST /api/workspaces/[id]/merge` (external writes). Legacy `/api/workspace` routes preserved as backward-compatible shims
- localStorage cache key: `"context-canvas:workspace:{workspaceId}"`, JSON with `version: 12` envelope
- 300ms trailing-edge debounce on save after any mutation
- Synchronous `beforeunload` flush to prevent data loss on tab close
- `load()` returns `null` on any failure (parse error, missing key) — never throws
- **Merge-on-save**: PUT endpoint reads disk before writing, preserves nodes/connections absent from the incoming payload (unless in `deletedIds`). Merge logic in `server/storage/merge-workspace.ts`, serialized by in-process lock in `server/storage/fs-workspace-store.ts`
- **Deletion manifest**: Client tracks deleted IDs per workspace, includes them in save payloads. Scoped via `createScopedDeletionManifest(workspaceId)` in `client/adapters/storage/deletion-manifest.ts`
- **External node detection**: Client polls server every 2s for the active workspace only, absorbs nodes/connections it doesn't have. Skips polling while a save is in-flight

### Workspace Management Pattern

- `WorkspaceRegistryPort` in `client/domain/ports/` — lifecycle operations (list, getActiveId, setActiveId, create, remove, rename)
- `serverRegistryAdapter` in `client/adapters/storage/` implements the port, talks to `/api/workspaces` endpoints, caches `activeId` in localStorage for fast reload
- Use cases: `deleteWorkspace` (with last-workspace guard) and `renameWorkspace` in `client/domain/use-cases/`. Switch and create are hook-level orchestrations in `useWorkspaceManager`
- `useWorkspaceManager` hook in `client/ui/hooks/` — consumes registry port, exposes workspace CRUD + `registerFlush` for flush-before-switch
- `WorkspaceManagerProvider` in `client/ui/app/` — sits above `AdaptersProvider`, holds `activeId` state, receives `createScopedAdapters` factory from composition root, keys `AdaptersProvider` on `activeId` for full subtree remount on switch
- `WorkspaceSidepanel` in `client/ui/components/` — collapsible left panel, consumes `useWorkspaceManagerContext()`

### Dependency Injection Pattern

- `AdaptersContext` in `client/ui/app/adapters-context.tsx` provides per-workspace concrete adapters
- `useAdapters()` hook returns `{ storage, blobStorage, pdfRenderer, transformExecutor, chat, modelRoster, aiExecutor, deletionManifest }`
- `WorkspaceManagerContext` in `client/ui/app/workspace-manager-context.tsx` provides workspace lifecycle operations (above `AdaptersContext`)
- `src/app/page.tsx` creates the `WorkspaceManagerProvider` with registry adapter, shared adapters, and scoped adapter factory. Concrete adapter creation happens only in the composition root
- Hooks and components consume via `useAdapters()` or `useWorkspaceManagerContext()` — never by direct import

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
- PDF upload limit is 200 MB (`kernel/transforms/validate-pdf-upload.ts`), but Vercel serverless functions cap request bodies at 4.5 MB. Uploads >4.5 MB will 413 in production. To support large PDFs on Vercel, use direct-to-storage uploads (Vercel Blob client uploads, presigned S3/R2 URLs) instead of POSTing through `/api/blobs`
- `components.json` paths must match `client/ui/` structure for `npx shadcn add` to work
- PdfRendererPort.renderPage returns HTMLCanvasElement — known tech debt (DOM type in port interface)

## Specs

Feature specs live in `.specs/features/`. The context module is `context.md`. Both should be kept in sync with this file.
