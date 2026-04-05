---
feature: external-write-durability
center: "External processes can add nodes and connections to a live workspace without the browser's save cycle erasing them."
stage: tasks
execution_mode: sequential
last_modified: 2026-04-05
---

## Tasks

### t-server-merge-save: Server save endpoint preserves disk-only items
> **Center:** Makes the save endpoint merge-aware so external writes survive browser saves
> **Traces:** ac-external-write-durability, ac-deletion-survives
> **Depends:** (none)
> **Status:** complete

The PUT /api/workspace endpoint currently does a blind overwrite. Change it to read-merge-write: read the current file, identify nodes and connections present on disk but absent from the incoming payload, append them to the incoming state (unless their ID appears in an optional `deletedIds` array in the payload), and write the merged result. The merge must be atomic (use the existing tmp-file-then-rename pattern).

**Files:** src/app/api/workspace/route.ts, src/server/storage/fs-workspace-store.ts
**Done when:** A browser save that omits a node present on disk does not erase that node. A browser save that includes a node ID in `deletedIds` does erase that node from disk.

### t-deletion-tracking: Client tracks and communicates deletion intent
> **Center:** Enables the server to distinguish "unknown external item" from "user-deleted item"
> **Traces:** ac-deletion-survives
> **Depends:** t-server-merge-save
> **Status:** complete

Track deleted node and connection IDs in the client persistence layer. When a node or connection is removed, accumulate its ID. Include the accumulated IDs in every save payload. Persist the manifest to localStorage so undelivered deletions survive across sessions. Clear delivered deletions after confirmed save. Update the storage port interface and adapters to carry the deletion IDs through the save path.

**Files:** src/client/domain/ports/storage-port.ts, src/client/adapters/storage/storage-envelope.ts, src/client/adapters/storage/server-storage-adapter.ts, src/client/adapters/storage/local-storage-adapter.ts, src/client/ui/hooks/use-workspace-persistence.ts, src/client/ui/hooks/use-workspace.ts
**Done when:** Deleting a node in the browser, saving, and then checking the server file confirms the node is gone. Closing the tab after a delete and reopening confirms the node stays deleted (not resurrected by merge).

### t-client-detection: Client detects and absorbs externally-added items
> **Center:** Completes the write-to-display loop so external nodes appear in the browser
> **Traces:** ac-external-visibility, ac-no-duplicate-absorption, ac-detection-responsiveness
> **Depends:** t-server-merge-save
> **Status:** complete

The client polls the server for new nodes and connections, absorbs any it doesn't have into its React state. Detection must be idempotent (no duplicates). With merge-on-save in place, the poll no longer races against saves — external nodes survive regardless. Clean up or fix the existing polling code in use-workspace-persistence.ts.

**Files:** src/client/ui/hooks/use-workspace-persistence.ts
**Done when:** An external process writes a node via POST /api/workspace/merge, and the node appears in the browser within 5 seconds without user action. Repeated poll cycles do not create duplicates.
