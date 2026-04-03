---
feature: clean-architecture-remediation
center: "Eliminate architectural violations and security gaps introduced during the server-side state migration so the implementation honors the contracts it claims to follow."
center_test:
  excludes: "Adding new persistence features (change tracking, multi-workspace) — good ideas, but not about honoring existing contracts."
  boundary: "Refactoring StorageEnvelope to a richer format — almost qualifies but goes beyond fixing what's broken into redesigning what works."
archetypes: [quality-gate, separation-of-concerns]
mode: express
analogues: []
---

## Acceptance Criteria

### ac-no-concrete-adapter-imports-in-hooks: Hooks import only ports, never concrete adapters
No file in `src/client/ui/hooks/` may import from `src/client/adapters/`. The migration logic that currently imports `localStorageAdapter` and `indexedDbBlobAdapter` directly into `use-workspace-persistence.ts` must receive these through dependency injection instead.

### ac-use-case-respects-ports: Domain use cases call only port methods, never raw fetch
`migrate-to-server.ts` must use the `BlobStoragePort` it receives as a parameter for all blob operations. No direct `fetch()` calls in `src/client/domain/use-cases/`.

### ac-blob-id-validation: Blob IDs are validated against path traversal
Any blob ID received from an HTTP request must be validated against a safe pattern (alphanumeric + hyphen + underscore) before being used in filesystem paths. Reject invalid IDs with 400 status.

### ac-shared-migration-logic: Both storage adapters run the same migration chain
The v1-v6 migration logic must be shared between `local-storage-adapter.ts` and `server-storage-adapter.ts`. Loading data through either path produces identically migrated output.

### ac-atomic-workspace-writes: Workspace file writes are atomic
`fs-workspace-store.ts` must write to a temporary file then rename, preventing corrupted reads from partial writes.

### ac-storage-envelope-single-source: StorageEnvelope type defined once
The `StorageEnvelope` type and `CURRENT_VERSION` constant are defined in one shared location, not duplicated across adapters.

### ac-beforeunload-contract-documented: Port documents synchronous-first save requirement
`StoragePort` interface includes a doc comment specifying that `save()` implementations must write to a synchronous fallback (e.g., localStorage) before any async operation, to support `beforeunload` safety.

### ac-architecture-docs-updated: CLAUDE.md documents src/server/ layer
The architecture section in CLAUDE.md includes the `src/server/` layer and its rules (server-only Node.js imports, no client/kernel imports).

## Tasks

### t-extract-storage-envelope: Extract StorageEnvelope type and migration to shared module
> **Traces:** ac-shared-migration-logic, ac-storage-envelope-single-source
> **Status:** pending

- Create `src/client/adapters/storage/storage-envelope.ts` with the shared `StorageEnvelope` type, `CURRENT_VERSION`, and `migrate()` function
- Update `local-storage-adapter.ts` and `server-storage-adapter.ts` to import from the shared module
- Server adapter's `load()` must run `migrate()` on parsed data
- **Done when**: StorageEnvelope defined once, both adapters import it, server adapter runs migrations on load

### t-fix-migration-use-case: Remove fetch() from migrate-to-server, use BlobStoragePort
> **Traces:** ac-use-case-respects-ports
> **Status:** pending

- Add `storeWithId(id: string, blob: Blob): Promise<void>` to `BlobStoragePort`
- Implement in `server-blob-adapter.ts` (POST with X-Blob-Id header) and `indexeddb-blob-adapter.ts` (put with explicit key)
- Update `migrate-to-server.ts` to call `newBlobStorage.storeWithId(node.blobId, blob)` instead of raw fetch
- **Done when**: `migrate-to-server.ts` has zero `fetch()` calls, uses only port methods

### t-fix-hook-adapter-imports: Move migration to composition root, remove concrete adapter imports from hook
> **Traces:** ac-no-concrete-adapter-imports-in-hooks
> **Status:** pending

- Move migration logic out of `use-workspace-persistence.ts` entirely
- In `page.tsx` (composition root), run migration before mounting the React tree: detect empty server + existing localStorage, call `migrateToServer()`, then proceed
- `use-workspace-persistence.ts` becomes a simple async load/save bridge with zero knowledge of legacy storage or migration
- Remove `localStorageAdapter` and `indexedDbBlobAdapter` imports from the hook
- `Adapters` type in `adapters-context.tsx` stays minimal — no legacy adapter fields
- **Done when**: zero imports from `src/client/adapters/` in any file under `src/client/ui/hooks/`, migration runs at composition root before React tree mounts, `Adapters` type has no migration-specific fields

### t-blob-id-validation: Add path traversal protection to blob routes and store
> **Traces:** ac-blob-id-validation
> **Status:** pending

- Create validation function: `isValidBlobId(id: string): boolean` — matches `/^[a-zA-Z0-9_-]+$/`
- Apply in `src/app/api/blobs/route.ts` (reject invalid X-Blob-Id with 400)
- Apply in `src/app/api/blobs/[id]/route.ts` (reject invalid param with 400)
- Apply in `fs-blob-store.ts` as defense-in-depth (throw on invalid ID)
- **Done when**: `../` in a blob ID returns 400, never touches the filesystem

### t-atomic-workspace-writes: Implement write-then-rename in fs-workspace-store
> **Traces:** ac-atomic-workspace-writes
> **Status:** pending

- `writeWorkspace()` writes to `.context-canvas/workspace.json.tmp`, then renames to `workspace.json`
- Use `fs/promises` `rename()` which is atomic on most filesystems
- **Done when**: partial writes cannot corrupt workspace.json

### t-document-port-contract: Add JSDoc to StoragePort documenting beforeunload requirement
> **Traces:** ac-beforeunload-contract-documented
> **Status:** pending

- Add JSDoc comment to `StoragePort.save()` specifying: "Implementations must write to a synchronous local fallback before performing any async operations, to ensure data safety during beforeunload."
- **Done when**: StoragePort interface has the doc comment

### t-update-architecture-docs: Add src/server/ to CLAUDE.md architecture diagram
> **Traces:** ac-architecture-docs-updated
> **Status:** pending

- Add `server/` layer to the architecture tree in CLAUDE.md
- Add rule: server/ may import only from kernel and Node.js built-ins, never from client/
- **Done when**: CLAUDE.md architecture section includes src/server/ with dependency rules
