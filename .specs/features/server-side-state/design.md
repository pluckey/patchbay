---
feature: server-side-state
center: "Making the workspace a self-standing, persistent artifact — not a derivative of any single interface — so that any authorized process can access it directly."
stage: design
intensity: standard
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

## System Decomposition

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|---|---|---|---|---|---|
| da-async-storage-port | Async StoragePort | Port evolution | Modify | `load(): Promise<Workspace \| null>`, `save(): Promise<void>` | ac-server-source-of-truth, ac-architectural-integrity |
| da-async-load-workspace | Async loadWorkspace | Use-case update | Modify | Returns `Promise<Workspace>`, same port-injection pattern | ac-server-source-of-truth, ac-architectural-integrity |
| da-async-save-workspace | Async saveWorkspace | Use-case update | Modify | Returns `Promise<void>`, same port-injection pattern | ac-server-source-of-truth, ac-architectural-integrity |
| da-server-storage-adapter | Server storage adapter | Client adapter | Create | HTTP fetch to /api/workspace, localStorage write-through in save() | ac-server-source-of-truth, ac-full-data-round-trip, ac-tab-close-safety, ac-interaction-responsiveness |
| da-server-blob-adapter | Server blob adapter | Client adapter | Create | HTTP fetch to /api/blobs, implements existing async BlobStoragePort | ac-binary-content-persistence, ac-full-data-round-trip |
| da-async-persistence-hook | Async persistence hook | Hook update | Modify | useWorkspacePersistence handles async load, async scheduleSave with .catch() | ac-server-source-of-truth, ac-interaction-responsiveness, ac-tab-close-safety |
| da-workspace-route | Workspace API route | Server route | Create | GET /api/workspace returns JSON, PUT /api/workspace writes JSON | ac-server-source-of-truth, ac-full-data-round-trip |
| da-blob-route | Blob API route | Server route | Create | POST /api/blobs stores file + returns ID, GET/DELETE /api/blobs/:id | ac-binary-content-persistence |
| da-fs-workspace-store | Filesystem workspace store | Server utility | Create | Reads/writes .context-canvas/workspace.json, creates dir if missing | ac-external-readability, ac-server-source-of-truth |
| da-fs-blob-store | Filesystem blob store | Server utility | Create | Reads/writes .context-canvas/blobs/{id}, creates dir if missing | ac-external-readability, ac-binary-content-persistence |
| da-migration-use-case | Migration use-case | Client use-case | Create | migrateToServer(oldStorage, oldBlob, newStorage, newBlob): Promise<void> | ac-existing-data-migration |
| da-migration-trigger | Migration trigger | Startup logic | Create | Detects empty server + existing localStorage, runs migration, sets flag | ac-existing-data-migration |
| da-composition-root-update | Composition root update | Wiring | Modify | page.tsx swaps to serverStorageAdapter + serverBlobAdapter | ac-architectural-integrity |

## Relationship Map

```
KERNEL (untouched)
  Workspace, WorkspaceNode, Connection, Viewport
       |
       | (type imports only, dependency points inward)
       v
CLIENT DOMAIN PORTS
  da-async-storage-port  <-------- da-async-load-workspace
  (modified interface)   <-------- da-async-save-workspace
  BlobStoragePort        <-------- da-migration-use-case
  (unchanged interface)
       |
       | (implemented by, dependency points inward)
       v
CLIENT ADAPTERS
  da-server-storage-adapter ----fetch()----> da-workspace-route
       |                                          |
       +--localStorage.setItem() (internal)       v
                                          da-fs-workspace-store --> .context-canvas/workspace.json

  da-server-blob-adapter ------fetch()----> da-blob-route
                                                  |
                                                  v
                                          da-fs-blob-store --> .context-canvas/blobs/{id}
CLIENT HOOKS
  da-async-persistence-hook
       +-- uses da-async-load-workspace (on mount)
       +-- uses da-async-save-workspace (in scheduleSave)

MIGRATION (one-time)
  da-migration-trigger
       +-- reads: localStorageAdapter.load(), indexedDbBlobAdapter.retrieve()
       +-- writes: da-server-storage-adapter.save(), da-server-blob-adapter.store()
       +-- orchestrates: da-migration-use-case

COMPOSITION ROOT
  da-composition-root-update (page.tsx)
       +-- creates da-server-storage-adapter
       +-- creates da-server-blob-adapter
       +-- passes to AdaptersProvider (unchanged pattern)
```

## Behavior Plan

| Behavior | Description | Traces to AC |
|---|---|---|
| Server-canonical load | Persistence hook awaits loadWorkspace(storage) on mount. Server returns workspace.json contents. If server returns null, check localStorage fallback for migration. | ac-server-source-of-truth |
| Write-through save | serverStorageAdapter.save() first writes synchronously to localStorage (one setItem call), then async PUTs to /api/workspace. scheduleSave 300ms debounce is the async boundary. | ac-tab-close-safety, ac-interaction-responsiveness |
| Fire-and-forget save | scheduleSave() calls saveWorkspace(...).catch(console.error) inside setTimeout. React state already committed before timeout fires. UI never blocks on persistence. | ac-interaction-responsiveness |
| beforeunload safety | Last scheduleSave already wrote to localStorage synchronously. beforeunload handler can additionally call navigator.sendBeacon as best-effort server update. Even if sendBeacon fails, localStorage has the data and next load reconciles. | ac-tab-close-safety |
| Auto-migration | Migration trigger runs at startup: (1) attempt server load, (2) if null, read localStorage + enumerate IndexedDB blobs, (3) upload all to server, (4) proceed with normal server load. | ac-existing-data-migration |
| Blob ID preservation | During migration, existing blobIds from IndexedDB are preserved by sending them with explicit IDs to the server. No blobId references in workspace.json break. | ac-binary-content-persistence |
| Versioned envelope on server | fs-workspace-store writes workspace.json with same StorageEnvelope format ({ version, nodes, connections, viewport }). Existing migration chain works on server read path. | ac-full-data-round-trip |

## Data Plan

**Storage Layout:**
```
.context-canvas/
  workspace.json          <-- StorageEnvelope: { version: 6, nodes, connections, viewport }
  blobs/
    {blobId}              <-- raw binary (PDF), no extension
```

- workspace.json uses the same StorageEnvelope structure as current localStorage value
- Blob files are raw binary; content type and filename stored in PdfNodeData within workspace.json
- .context-canvas/ directory created on first write if it doesn't exist
- Add .context-canvas/ to .gitignore

**Migration Path:**
1. Detect: GET /api/workspace returns null (empty server)
2. Read: localStorage.getItem('context-canvas:workspace')
3. Parse + migrate: run existing v1-v6 migration chain in memory
4. Upload workspace: PUT /api/workspace
5. Enumerate blobs: scan PdfNodeData.blobId from workspace
6. Upload each blob: read from IndexedDB, POST to /api/blobs with preserved ID
7. Verify: re-load from server
8. Post-migration: localStorage continues as write-through cache, IndexedDB no longer read

## Integration Plan

| Route | Method | Request | Response | Notes |
|---|---|---|---|---|
| /api/workspace | GET | — | 200 + JSON or 204 No Content | Reads .context-canvas/workspace.json |
| /api/workspace | PUT | StorageEnvelope JSON body | 204 OK | Writes .context-canvas/workspace.json |
| /api/blobs | POST | Binary body + X-Blob-Id header | 201 + { id } | Writes .context-canvas/blobs/{id} |
| /api/blobs/[id] | GET | — | 200 + binary or 404 | Reads .context-canvas/blobs/{id} |
| /api/blobs/[id] | DELETE | — | 204 or 404 | Deletes .context-canvas/blobs/{id} |

All communication is standard fetch() from browser to localhost Next.js API routes. No WebSocket, no SSE, no polling.

## Verification Strategy

| AC ID | Verification Method |
|---|---|
| ac-server-source-of-truth | Start app with empty localStorage, pre-populated .context-canvas/workspace.json. Assert canvas loads server data. |
| ac-full-data-round-trip | Create workspace with one of each node type + connections + viewport. Save. Kill process. Restart. Assert deep equality. |
| ac-binary-content-persistence | Upload PDF via UI. Assert file exists at .context-canvas/blobs/{blobId}. Reload. Assert PDF renders. |
| ac-interaction-responsiveness | Code inspection: scheduleSave fires async inside setTimeout, React state commits before save. Manual: slow 3G throttling, no UI lag. |
| ac-tab-close-safety | Edit, close tab, reopen. Assert edit present. Document: worst-case loss = 300ms debounce window. |
| ac-existing-data-migration | Seed localStorage + IndexedDB. Delete .context-canvas/. Start app. Assert server has data. Clear localStorage. Reload. Assert app works. |
| ac-external-readability | Run: JSON.parse(fs.readFileSync('.context-canvas/workspace.json')). Assert valid StorageEnvelope. Assert blob files readable. |
| ac-architectural-integrity | Grep src/kernel/ for framework imports. Must find zero. Verify kernel/ has zero changed files. |
