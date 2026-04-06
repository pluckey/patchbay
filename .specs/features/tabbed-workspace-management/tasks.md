---
feature: tabbed-workspace-management
center: "Allow the user to partition their context-composition work into distinct, persistent scopes so that each scope remains legible and none is lost when attention moves to another."
stage: tasks
intensity: standard
execution_mode: parallel
loop_iterations: 1
last_modified: 2026-04-05T00:00:00Z
---

## Tasks

### t-workspace-identity: Add optional `id` and `name` fields to the `Workspace` entity type | Edit kernel entity
> **Center:** A workspace that carries its own identity can be distinguished from every other workspace, enabling persistent scoping.
> **Traces:** ac-workspace-identity, ac-global-identifier-uniqueness
> **Depends:** (none)
> **Files:** `src/kernel/entities/workspace.ts`
> **Wave:** 1
> **Status:** complete

- **Implements:** da-1
- **Done when:** `Workspace` type has `id?: string` and `name?: string`. `DEFAULT_WORKSPACE` remains valid without them. All existing consumers compile without modification.

### t-workspace-ref-entity: Create the `WorkspaceRef` entity type for lightweight workspace handles | New kernel entity file
> **Center:** A lightweight handle (id, name, timestamps) lets the sidepanel list workspaces without loading full node graphs into memory.
> **Traces:** ac-sidepanel-listing, ac-workspace-identity
> **Depends:** (none)
> **Files:** `src/kernel/entities/workspace-ref.ts`, `src/kernel/entities/index.ts`
> **Wave:** 1
> **Status:** complete

- **Implements:** da-2
- **Done when:** `WorkspaceRef` type exported from barrel: `{ id: string, name: string, createdAt: number, updatedAt: number }`. Zero imports from outside kernel/entities.

### t-create-workspace-ref-transform: Create the `createWorkspaceRef` pure transform | New kernel transform file
> **Center:** Deterministic creation of workspace handles ensures every new scope gets a globally unique identifier and consistent metadata from the moment of inception.
> **Traces:** ac-single-action-creation, ac-global-identifier-uniqueness
> **Depends:** t-workspace-ref-entity
> **Files:** `src/kernel/transforms/create-workspace-ref.ts`, `src/kernel/transforms/index.ts`
> **Wave:** 2
> **Status:** complete

- **Implements:** da-3
- **Done when:** `createWorkspaceRef(name: string): WorkspaceRef` exported. Uses `crypto.randomUUID()` for id, `Date.now()` for timestamps. Pure function, no ports, no side effects.

### t-workspace-registry-port: Define the `WorkspaceRegistryPort` interface | New client domain port file
> **Center:** The port defines the contract for workspace lifecycle operations without coupling to any storage mechanism.
> **Traces:** ac-sidepanel-listing, ac-workspace-deletion, ac-single-action-creation
> **Depends:** t-workspace-ref-entity
> **Files:** `src/client/domain/ports/workspace-registry-port.ts`
> **Wave:** 2
> **Status:** complete

- **Implements:** da-4
- **Done when:** Interface exported with methods: `list(): Promise<WorkspaceRef[]>`, `getActiveId(): Promise<string>`, `setActiveId(id: string): Promise<void>`, `create(name: string): Promise<WorkspaceRef>`, `remove(id: string): Promise<void>`, `rename(id: string, name: string): Promise<void>`. Imports only from `kernel/entities`.

### t-scoped-deletion-manifest-factory: Create a factory that produces workspace-scoped deletion manifests | Edit existing client adapter file
> **Center:** Scoping the deletion manifest by workspace ID prevents deletion tracking from one scope leaking into another, preserving merge-on-save correctness per workspace.
> **Traces:** ac-scope-isolation, ac-persistence-independence
> **Depends:** (none)
> **Files:** `src/client/adapters/storage/deletion-manifest.ts`
> **Wave:** 2
> **Status:** complete

- **Implements:** da-11
- **Done when:** New export `createScopedDeletionManifest(workspaceId: string): DeletionManifest` added alongside existing functions. Scoped version uses localStorage key `"context-canvas:deletedIds:${workspaceId}"`. Existing functions remain for backward compatibility.

### t-fs-manifest-store: Create the server-side manifest store for workspace registry persistence | New server storage file
> **Center:** A durable manifest on the file system is the single source of truth for which workspaces exist and which is active, surviving server restarts.
> **Traces:** ac-sidepanel-listing, ac-active-workspace-unambiguous, ac-persistence-independence
> **Depends:** t-workspace-ref-entity
> **Files:** `src/server/storage/fs-manifest-store.ts`
> **Wave:** 2
> **Status:** complete

- **Implements:** da-13
- **Done when:** Exports `readManifest(): Promise<Manifest | null>`, `writeManifest(manifest: Manifest): Promise<void>`, `withManifestLock<T>(fn: () => Promise<T>): Promise<T>`. Manifest type: `{ workspaces: WorkspaceRef[], activeId: string }`. File path: `.context-canvas/manifest.json`. Atomic write via tmp+rename. Independent in-process mutex.

### t-switch-workspace-use-case: Create the `switchWorkspace` use case with flush-before-switch | New client domain use case file
> **Center:** Flushing the current workspace to storage before switching active scope guarantees zero data loss during context transitions.
> **Traces:** ac-instant-switch, ac-lossless-migration, ac-scope-isolation
> **Depends:** t-workspace-registry-port
> **Files:** `src/client/domain/use-cases/switch-workspace.ts`
> **Wave:** 3
> **Status:** complete

- **Implements:** da-5
- **Done when:** `switchWorkspace(registry: WorkspaceRegistryPort, currentStorage: StoragePort, currentWorkspace: Workspace, targetId: string, deletedIds?: string[]): Promise<void>` exported. Calls `currentStorage.save()` with deletedIds, then `registry.setActiveId(targetId)`. Returns only after both complete.

### t-create-workspace-use-case: Create the `createWorkspace` use case | New client domain use case file
> **Center:** Single-action workspace creation through the registry port ensures a new scope appears in the manifest atomically.
> **Traces:** ac-single-action-creation, ac-global-identifier-uniqueness
> **Depends:** t-workspace-registry-port, t-create-workspace-ref-transform
> **Files:** `src/client/domain/use-cases/create-workspace.ts`
> **Wave:** 3
> **Status:** complete

- **Implements:** da-6
- **Done when:** `createWorkspace(registry: WorkspaceRegistryPort, name: string): Promise<WorkspaceRef>` exported. Calls `registry.create(name)` and returns the created ref.

### t-delete-workspace-use-case: Create the `deleteWorkspace` use case with last-workspace guard | New client domain use case file
> **Center:** Preventing deletion of the last workspace guarantees the user always has at least one scope to work in.
> **Traces:** ac-workspace-deletion, ac-last-workspace-guard
> **Depends:** t-workspace-registry-port
> **Files:** `src/client/domain/use-cases/delete-workspace.ts`
> **Wave:** 3
> **Status:** complete

- **Implements:** da-7
- **Done when:** `deleteWorkspace(registry: WorkspaceRegistryPort, id: string): Promise<{ ok: boolean; reason?: string }>` exported. Calls `registry.list()` first; if length <= 1, returns `{ ok: false, reason: "Cannot delete the last workspace" }`. Otherwise calls `registry.remove(id)` and returns `{ ok: true }`.

### t-rename-workspace-use-case: Create the `renameWorkspace` use case | New client domain use case file
> **Center:** Renaming through the use case layer ensures the manifest stays consistent and the updated name propagates to all observers.
> **Traces:** ac-sidepanel-listing
> **Depends:** t-workspace-registry-port
> **Files:** `src/client/domain/use-cases/rename-workspace.ts`
> **Wave:** 3
> **Status:** complete

- **Implements:** da-8
- **Done when:** `renameWorkspace(registry: WorkspaceRegistryPort, id: string, name: string): Promise<void>` exported. Delegates to `registry.rename(id, name)`.

### t-storage-envelope-v10: Add v9-to-v10 migration stamping `id` and `name` into the storage envelope | Edit existing adapter file
> **Center:** Upgrading the envelope version ensures persisted workspaces carry identity, enabling the scoped storage adapter to verify it loaded the correct scope.
> **Traces:** ac-workspace-identity, ac-lossless-migration
> **Depends:** t-workspace-identity
> **Files:** `src/client/adapters/storage/storage-envelope.ts`
> **Wave:** 3
> **Status:** complete

- **Implements:** da-12
- **Done when:** `CURRENT_VERSION` bumped to 10. `StorageEnvelope` type gains `id?: string` and `name?: string`. `migrate()` has a v9-to-v10 step that stamps `id` and `name` if absent. `toEnvelope` propagates `id`/`name` from `Workspace` when present. `toWorkspace` propagates them back.

### t-parameterize-fs-workspace-store: Parameterize `fs-workspace-store` to read/write workspace files by ID | Edit existing server storage file
> **Center:** Per-workspace file paths ensure each scope's data is physically isolated on disk, eliminating any possibility of cross-scope contamination.
> **Traces:** ac-persistence-independence, ac-scope-isolation
> **Depends:** t-fs-manifest-store
> **Files:** `src/server/storage/fs-workspace-store.ts`
> **Wave:** 3
> **Status:** complete

- **Implements:** da-14
- **Done when:** New `readWorkspaceById(id)`/`writeWorkspaceById(id, json)` writing to `.context-canvas/workspaces/${id}.json`. Old signature functions retained as deprecated wrappers for legacy path. Directory `.context-canvas/workspaces/` created on first write via `mkdir({ recursive: true })`.

### t-server-migration: Create idempotent lazy migration from single-workspace to multi-workspace format | New server storage file
> **Center:** Lossless migration from the old single-file format preserves every node, connection, and viewport position the user has ever created.
> **Traces:** ac-lossless-migration, ac-workspace-identity
> **Depends:** t-fs-manifest-store, t-parameterize-fs-workspace-store
> **Files:** `src/server/storage/migrate-to-multi-workspace.ts`
> **Wave:** 4
> **Status:** complete

- **Implements:** da-15
- **Done when:** Exports `migrateToMultiWorkspace(): Promise<void>`. Logic: (1) acquire manifest lock, (2) if manifest exists, return (idempotent), (3) read legacy `workspace.json`, (4) if null, create empty manifest with one empty workspace, (5) if present, generate UUID, write to `workspaces/{id}.json`, (6) write manifest with that single entry as active, (7) release lock. Legacy `workspace.json` NOT deleted.

### t-api-collection-routes: Create GET/POST `/api/workspaces` routes with lazy migration trigger | New Next.js API route files
> **Center:** The collection endpoint is the gateway through which the UI discovers all available scopes, and the creation endpoint is how new scopes materialize server-side.
> **Traces:** ac-sidepanel-listing, ac-single-action-creation, ac-lossless-migration
> **Depends:** t-fs-manifest-store, t-server-migration
> **Files:** `src/app/api/workspaces/route.ts`
> **Wave:** 5
> **Status:** complete

- **Implements:** da-16 (collection subset)
- **Done when:** `GET` calls `migrateToMultiWorkspace()` (idempotent), then returns manifest as JSON. `POST` accepts `{ name: string }`, creates workspace ref, writes empty workspace file, appends to manifest, returns `WorkspaceRef` with status 201.

### t-api-instance-routes: Create GET/PUT/DELETE/PATCH `/api/workspaces/[id]` routes | New Next.js API route files
> **Center:** Per-workspace CRUD endpoints give the scoped storage adapter a target for every load and save, maintaining full persistence independence between scopes.
> **Traces:** ac-persistence-independence, ac-workspace-deletion, ac-scope-isolation
> **Depends:** t-parameterize-fs-workspace-store, t-fs-manifest-store, t-server-migration
> **Files:** `src/app/api/workspaces/[id]/route.ts`
> **Wave:** 5
> **Status:** complete

- **Implements:** da-16 (instance subset)
- **Done when:** `GET` returns workspace JSON by ID (404 if not found). `PUT` performs merge-on-save using `readWorkspaceById`/`writeWorkspaceById`. `DELETE` removes workspace file and manifest entry (409 if last workspace). `PATCH` accepts `{ name: string }`, updates manifest entry, returns updated `WorkspaceRef`.

### t-api-instance-merge-route: Create POST `/api/workspaces/[id]/merge` route for external writes | New Next.js API route file
> **Center:** The per-workspace merge endpoint directs external node writes to a specific scope, maintaining isolation between partitioned workspaces.
> **Traces:** ac-persistence-independence, ac-global-identifier-uniqueness
> **Depends:** t-parameterize-fs-workspace-store
> **Files:** `src/app/api/workspaces/[id]/merge/route.ts`
> **Wave:** 5
> **Status:** complete

- **Implements:** da-16 (merge subset)
- **Done when:** Same logic as current `POST /api/workspace/merge` but using `readWorkspaceById(id)`/`writeWorkspaceById(id, json)`. Returns `{ added: { nodes: N, connections: N } }`.

### t-api-backward-compat: Add backward-compatible shims for legacy `/api/workspace` and `/api/workspace/merge` routes | Edit existing API route files
> **Center:** Backward compatibility prevents external tools from breaking silently when the server migrates to multi-workspace format.
> **Traces:** ac-lossless-migration
> **Depends:** t-api-collection-routes, t-api-instance-routes, t-api-instance-merge-route, t-server-migration
> **Files:** `src/app/api/workspace/route.ts`, `src/app/api/workspace/merge/route.ts`
> **Wave:** 6
> **Status:** complete

- **Implements:** da-16 (backward compat subset)
- **Done when:** `GET /api/workspace` calls `migrateToMultiWorkspace()`, reads manifest, proxies to `readWorkspaceById(activeId)`. `PUT /api/workspace` proxies to the active workspace's PUT. `POST /api/workspace/merge` proxies to the active workspace's merge route. All legacy routes continue to work identically.

### t-scoped-server-storage-adapter: Create factory producing workspace-scoped `StoragePort` instances | New client adapter file
> **Center:** The scoped adapter factory lets every existing mutator, hook, and persistence mechanism work unchanged — the scope is baked into the adapter, invisible to consumers.
> **Traces:** ac-scope-isolation, ac-persistence-independence, ac-instant-switch
> **Depends:** t-storage-envelope-v10, t-scoped-deletion-manifest-factory, t-api-instance-routes
> **Files:** `src/client/adapters/storage/scoped-server-storage-adapter.ts`
> **Wave:** 6
> **Status:** complete

- **Implements:** da-9
- **Done when:** `createScopedServerStorageAdapter(workspaceId: string): StoragePort` exported. `load()` fetches from `/api/workspaces/${workspaceId}` with localStorage fallback at key `"context-canvas:workspace:${workspaceId}"`. `save()` writes scoped localStorage cache, then PUTs to `/api/workspaces/${workspaceId}`. Never falls back to unscoped key.

### t-server-registry-adapter: Create `serverRegistryAdapter` implementing `WorkspaceRegistryPort` | New client adapter file
> **Center:** The registry adapter bridges the UI to the server manifest, enabling workspace listing, creation, and switching through clean port abstraction.
> **Traces:** ac-sidepanel-listing, ac-active-workspace-unambiguous, ac-single-action-creation
> **Depends:** t-workspace-registry-port, t-api-collection-routes, t-api-instance-routes
> **Files:** `src/client/adapters/storage/server-registry-adapter.ts`
> **Wave:** 6
> **Status:** pending

- **Implements:** da-10
- **Done when:** Implements `WorkspaceRegistryPort`. `list()` fetches GET `/api/workspaces`. `getActiveId()` returns `activeId` from manifest. `setActiveId(id)` PATCHes server manifest. `create(name)` POSTs to `/api/workspaces`. `remove(id)` DELETEs `/api/workspaces/${id}`. `rename(id, name)` PATCHes `/api/workspaces/${id}`. Caches `activeId` in localStorage for fast reload.

### t-use-workspace-manager: Create the `useWorkspaceManager` hook for workspace lifecycle control | New client UI hook file
> **Center:** The manager hook is the single command surface for workspace operations, enforcing flush-before-switch and last-workspace-guard at the UI boundary.
> **Traces:** ac-instant-switch, ac-active-workspace-unambiguous, ac-workspace-deletion, ac-last-workspace-guard
> **Depends:** t-switch-workspace-use-case, t-create-workspace-use-case, t-delete-workspace-use-case, t-rename-workspace-use-case, t-server-registry-adapter
> **Files:** `src/client/ui/hooks/use-workspace-manager.ts`
> **Wave:** 7
> **Status:** complete

- **Implements:** da-17
- **Done when:** Hook exports: `{ workspaces: WorkspaceRef[], activeId: string, isLoaded: boolean, switchTo(id): Promise<void>, create(name?): Promise<WorkspaceRef>, remove(id): Promise<{ok, reason?}>, rename(id, name): Promise<void> }`. On mount, calls `registry.list()` and `registry.getActiveId()` (with localStorage fast-path for activeId). `switchTo` performs flush-before-switch then updates local `activeId` state.

### t-workspace-manager-provider: Create the `WorkspaceManagerProvider` component that keys `AdaptersProvider` on `activeId` | New client UI component file
> **Center:** Keying the entire adapter tree on the active workspace ID guarantees complete scope isolation — every timer, ref, poll, and closure dies on switch and is rebuilt for the new scope.
> **Traces:** ac-scope-isolation, ac-instant-switch
> **Depends:** t-use-workspace-manager, t-scoped-server-storage-adapter, t-scoped-deletion-manifest-factory
> **Files:** `src/client/ui/app/workspace-manager-context.tsx`, `src/client/ui/app/WorkspaceManagerProvider.tsx`
> **Wave:** 8
> **Status:** complete

- **Implements:** da-18
- **Done when:** `WorkspaceManagerProvider` accepts `registryAdapter: WorkspaceRegistryPort` and `children`. Internally uses `useWorkspaceManager` to get `activeId`. Creates scoped `StoragePort` and `DeletionManifest` per `activeId`. Renders `<AdaptersProvider key={activeId} adapters={scopedAdapters}>`. Exposes workspace manager state via `WorkspaceManagerContext`. Shows nothing until `isLoaded` is true.

### t-workspace-sidepanel: Create the `WorkspaceSidepanel` component | New client UI component file
> **Center:** The sidepanel makes every available scope visible and reachable, ensuring the user always knows which scope is active and can navigate to any other with a single action.
> **Traces:** ac-sidepanel-listing, ac-active-workspace-unambiguous, ac-single-action-creation, ac-workspace-deletion, ac-last-workspace-guard
> **Depends:** t-workspace-manager-provider
> **Files:** `src/client/ui/components/WorkspaceSidepanel.tsx`
> **Wave:** 9
> **Status:** complete

- **Implements:** da-19
- **Done when:** Consumes `useWorkspaceManager()` context. Renders workspace list with active indicator (Geist tokens: `bg-muted` for active, `bg-background` for inactive). "New workspace" button calls `create()`. Inline rename on double-click. Delete with confirmation; disabled when one workspace remains. Collapsible panel on left edge. All colors via shadcn semantic tokens.

### t-composition-root-wiring: Rewire the composition root to use `WorkspaceManagerProvider` | Edit existing composition root
> **Center:** The composition root is where all layers converge — wiring the manager provider here completes the feature by making workspace scoping available to the entire application tree.
> **Traces:** ac-lossless-migration, ac-scope-isolation
> **Depends:** t-workspace-manager-provider, t-workspace-sidepanel, t-api-backward-compat
> **Files:** `src/app/page.tsx`
> **Wave:** 10
> **Status:** complete

- **Implements:** da-20
- **Done when:** `page.tsx` creates `serverRegistryAdapter` instance. Wraps tree in `<WorkspaceManagerProvider>`. Removes direct creation of `serverStorageAdapter` (now created inside provider). Removes client-side migration logic (now lazy server-side). `WorkspaceSidepanel` rendered inside the provider tree. Non-scoped adapters still created here.

## Execution Waves

| Wave | Tasks | Depends on waves | Shared file risks |
|------|-------|-------------------|-------------------|
| 1 | t-workspace-identity, t-workspace-ref-entity | (none) | None — workspace.ts and workspace-ref.ts + index.ts are independent. |
| 2 | t-create-workspace-ref-transform, t-workspace-registry-port, t-scoped-deletion-manifest-factory, t-fs-manifest-store | 1 | None — four independent files in separate directories. |
| 3 | t-switch-workspace-use-case, t-create-workspace-use-case, t-delete-workspace-use-case, t-rename-workspace-use-case, t-storage-envelope-v10, t-parameterize-fs-workspace-store | 2 | Use cases are independent new files. `storage-envelope.ts` and `fs-workspace-store.ts` each modified by exactly one task. |
| 4 | t-server-migration | 3 | Single new file. |
| 5 | t-api-collection-routes, t-api-instance-routes, t-api-instance-merge-route | 4 | Three new files in separate directories. No write conflicts. |
| 6 | t-scoped-server-storage-adapter, t-server-registry-adapter, t-api-backward-compat | 5 | Legacy API routes modified by backward-compat task only. No conflicts. |
| 7 | t-use-workspace-manager | 6 | Single new file. |
| 8 | t-workspace-manager-provider | 7 | Two new files (context + provider). |
| 9 | t-workspace-sidepanel | 8 | Single new file. |
| 10 | t-composition-root-wiring | 9 | `src/app/page.tsx` modified by this task only. |
