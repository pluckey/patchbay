---
feature: server-side-state
center: "Making the workspace a self-standing, persistent artifact — not a derivative of any single interface — so that any authorized process can access it directly."
stage: tasks
intensity: standard
execution_mode: parallel
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

### t-async-storage-port: Make StoragePort async and update localStorageAdapter to conform | Modify interface + adapter
> **Center:** The workspace becomes a portable artifact by making its storage contract async — enabling any backing store behind the same port.
> **Traces:** ac-server-source-of-truth, ac-architectural-integrity
> **Depends:** (none)
> **Files:** src/client/domain/ports/storage-port.ts, src/client/adapters/storage/local-storage-adapter.ts
> **Wave:** 1
> **Status:** complete

- **Implements**: da-async-storage-port
- **Done when**: StoragePort.load() returns Promise<Workspace | null>, StoragePort.save() returns Promise<void>, and localStorageAdapter wraps its synchronous operations in async to satisfy the new interface. TypeScript compiles with no errors on these two files.

### t-async-load-workspace: Make loadWorkspace use-case async | Modify use-case
> **Center:** The load path supports any latency — local, network, or future cloud — keeping the workspace independent of storage speed.
> **Traces:** ac-server-source-of-truth, ac-architectural-integrity
> **Depends:** t-async-storage-port
> **Files:** src/client/domain/use-cases/load-workspace.ts
> **Wave:** 2
> **Status:** complete

- **Implements**: da-async-load-workspace
- **Done when**: loadWorkspace is async, awaits storage.load(), returns DEFAULT_WORKSPACE on null. Compiles against async StoragePort.

### t-async-save-workspace: Make saveWorkspace use-case async | Modify use-case
> **Center:** The save path supports any backing store latency, ensuring the workspace can be persisted to server without blocking the UI thread.
> **Traces:** ac-server-source-of-truth, ac-architectural-integrity
> **Depends:** t-async-storage-port
> **Files:** src/client/domain/use-cases/save-workspace.ts
> **Wave:** 2
> **Status:** complete

- **Implements**: da-async-save-workspace
- **Done when**: saveWorkspace is async, awaits storage.save(workspace). Compiles against async StoragePort.

### t-fs-workspace-store: Create filesystem workspace store | Create server utility
> **Center:** The workspace file (.context-canvas/workspace.json) is a self-standing artifact on disk, readable by any process.
> **Traces:** ac-external-readability, ac-server-source-of-truth
> **Depends:** (none)
> **Files:** src/server/storage/fs-workspace-store.ts
> **Wave:** 2
> **Status:** complete

- **Implements**: da-fs-workspace-store
- **Done when**: Module exports readWorkspace(): Promise<string | null> and writeWorkspace(json: string): Promise<void>. Uses fs/promises. Creates .context-canvas/ directory with { recursive: true } on first write. Returns null if file does not exist. No kernel or client imports.

### t-fs-blob-store: Create filesystem blob store | Create server utility
> **Center:** Binary content lives on disk at .context-canvas/blobs/{id}, directly accessible to external tools without browser mediation.
> **Traces:** ac-external-readability, ac-binary-content-persistence
> **Depends:** (none)
> **Files:** src/server/storage/fs-blob-store.ts
> **Wave:** 2
> **Status:** complete

- **Implements**: da-fs-blob-store
- **Done when**: Module exports storeBlob(id: string, buffer: Buffer): Promise<void>, retrieveBlob(id: string): Promise<Buffer | null>, deleteBlob(id: string): Promise<void>. Creates .context-canvas/blobs/ with { recursive: true } on first write. Returns null on missing blob. No kernel or client imports.

### t-async-persistence-hook: Update use-workspace-persistence hook for async load/save | Modify hook
> **Center:** The hook becomes the async bridge between React state and any storage backend, keeping the UI responsive regardless of storage latency.
> **Traces:** ac-server-source-of-truth, ac-interaction-responsiveness, ac-tab-close-safety
> **Depends:** t-async-load-workspace, t-async-save-workspace
> **Files:** src/client/ui/hooks/use-workspace-persistence.ts
> **Wave:** 3
> **Status:** complete

- **Implements**: da-async-persistence-hook
- **Done when**: (1) useEffect on mount calls loadWorkspace(storage) with await inside async IIFE. (2) scheduleSave calls saveWorkspace(...) with .catch(console.error) inside debounce timeout. (3) isLoadedRef guard prevents scheduleSave before initial load completes. (4) beforeunload calls storage.save() fire-and-forget. (5) App loads and saves correctly with async-wrapped localStorageAdapter.

### t-workspace-route: Create workspace API route | Create server route
> **Center:** The workspace is accessible via HTTP — any authorized process can GET or PUT the workspace without a browser.
> **Traces:** ac-server-source-of-truth, ac-full-data-round-trip
> **Depends:** t-fs-workspace-store
> **Files:** src/app/api/workspace/route.ts
> **Wave:** 3
> **Status:** complete

- **Implements**: da-workspace-route
- **Done when**: GET /api/workspace returns raw JSON from fs-workspace-store or 204 if null. PUT /api/workspace reads body, writes via fs-workspace-store, returns 204. Follows existing api/chat/route.ts pattern.

### t-blob-route: Create blob API routes | Create server routes
> **Center:** Binary blobs are addressable via HTTP, making PDF content accessible to any process without IndexedDB.
> **Traces:** ac-binary-content-persistence, ac-full-data-round-trip
> **Depends:** t-fs-blob-store
> **Files:** src/app/api/blobs/route.ts, src/app/api/blobs/[id]/route.ts
> **Wave:** 3
> **Status:** complete

- **Implements**: da-blob-route
- **Done when**: POST /api/blobs accepts binary body + X-Blob-Id header, stores via fs-blob-store, returns { id } with 201. GET /api/blobs/[id] returns binary or 404. DELETE /api/blobs/[id] deletes and returns 204 or 404.

### t-server-storage-adapter: Create server storage adapter with write-through cache | Create client adapter
> **Center:** The adapter makes the server the source of truth while maintaining localStorage as a synchronous safety net for tab-close scenarios.
> **Traces:** ac-server-source-of-truth, ac-full-data-round-trip, ac-tab-close-safety, ac-interaction-responsiveness
> **Depends:** t-async-storage-port, t-workspace-route
> **Files:** src/client/adapters/storage/server-storage-adapter.ts
> **Wave:** 4
> **Status:** complete

- **Implements**: da-server-storage-adapter
- **Done when**: Implements async StoragePort. load() fetches GET /api/workspace, parses JSON, returns Workspace | null. save() synchronously writes to localStorage (write-through), then async PUTs to /api/workspace. On save failure, logs but does not throw. On load failure, falls back to localStorage. Uses only fetch and localStorage.

### t-server-blob-adapter: Create server blob adapter | Create client adapter
> **Center:** Binary content routes through the server, making blobs persistent and externally accessible without browser-only IndexedDB.
> **Traces:** ac-binary-content-persistence, ac-full-data-round-trip
> **Depends:** t-blob-route
> **Files:** src/client/adapters/storage/server-blob-adapter.ts
> **Wave:** 4
> **Status:** complete

- **Implements**: da-server-blob-adapter
- **Done when**: Implements BlobStoragePort. store(blob) POSTs to /api/blobs with blob as body and X-Blob-Id header, returns ID. retrieve(blobId) GETs /api/blobs/{id}, returns Blob or null on 404. delete(blobId) sends DELETE to /api/blobs/{id}. No Node.js imports.

### t-migration-use-case: Create migrate-to-server use-case | Create client use-case
> **Center:** Existing workspace data trapped in browser storage is liberated to the server, ensuring no data loss during the transition.
> **Traces:** ac-existing-data-migration
> **Depends:** t-async-storage-port, t-server-storage-adapter, t-server-blob-adapter
> **Files:** src/client/domain/use-cases/migrate-to-server.ts
> **Wave:** 5
> **Status:** complete

- **Implements**: da-migration-use-case
- **Done when**: migrateToServer is async, takes old and new StoragePort + BlobStoragePort. Loads from old storage, scans for PDF blobIds, transfers each blob, writes workspace to new storage. Returns boolean. Idempotent. No framework imports.

### t-migration-trigger: Add migration check to startup sequence | Modify hook
> **Center:** Migration happens transparently on first load, ensuring the workspace transitions to server persistence without user intervention.
> **Traces:** ac-existing-data-migration
> **Depends:** t-migration-use-case, t-async-persistence-hook
> **Files:** src/client/ui/hooks/use-workspace-persistence.ts
> **Wave:** 6
> **Status:** complete

- **Implements**: da-migration-trigger
- **Done when**: Persistence hook init: (1) attempts server load, (2) if empty, checks localStorage via localStorageAdapter.load(), (3) if localStorage has data, runs migrateToServer() then re-loads from server, (4) on failure falls back to localStorage data. Migration guarded by ref, runs at most once per session.

### t-composition-root-update: Wire server adapters into composition root | Modify wiring
> **Center:** The composition root is the single point where concrete adapters are chosen — swapping to server adapters makes server persistence the default.
> **Traces:** ac-architectural-integrity
> **Depends:** t-server-storage-adapter, t-server-blob-adapter, t-migration-trigger
> **Files:** src/app/page.tsx
> **Wave:** 7
> **Status:** complete

- **Implements**: da-composition-root-update
- **Done when**: page.tsx imports serverStorageAdapter and serverBlobAdapter. The adapters object uses server adapters for storage and blobStorage. Old adapters remain importable for migration. App boots, loads from server, saves to server.

## Execution Waves

| Wave | Tasks | Depends on waves | Shared file risks |
|------|-------|-------------------|-------------------|
| 1 | t-async-storage-port | (none) | Modifies storage-port.ts + local-storage-adapter.ts |
| 2 | t-async-load-workspace, t-async-save-workspace, t-fs-workspace-store, t-fs-blob-store | Wave 1 | No shared files. Use-cases in src/client/domain/use-cases/, stores in src/server/storage/. |
| 3 | t-async-persistence-hook, t-workspace-route, t-blob-route | Wave 2 | No shared files. Hook in hooks/, routes in src/app/api/. |
| 4 | t-server-storage-adapter, t-server-blob-adapter | Wave 3 | No shared files. Both new files in src/client/adapters/storage/. |
| **CHECKPOINT** | **Smoke test: wire server adapters into page.tsx temporarily. Save from browser, verify .context-canvas/workspace.json exists and parses. Upload a PDF, verify .context-canvas/blobs/{id} exists. Revert temporary wiring before proceeding.** | | |
| 5 | t-migration-use-case | Wave 4 | New file in src/client/domain/use-cases/. |
| 6 | t-migration-trigger | Wave 5 | Modifies use-workspace-persistence.ts. |
| 7 | t-composition-root-update | Wave 6 | Modifies page.tsx. |
