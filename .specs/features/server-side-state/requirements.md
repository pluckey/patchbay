---
feature: server-side-state
center: "Making the workspace a self-standing, persistent artifact — not a derivative of any single interface — so that any authorized process can access it directly."
stage: requirements
intensity: standard
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

## Acceptance Criteria

### ac-server-source-of-truth: Workspace loads from server-side storage
> **Center:** The workspace is a self-standing artifact only if it lives outside browser-private storage — this AC tests that the source of truth has actually moved.

When the application starts in a browser with no prior local state (fresh profile, cleared storage), the workspace loads with all previously saved content intact. The browser's private storage (localStorage, IndexedDB) is not required for the workspace to be available.

### ac-full-data-round-trip: All entity types survive persistence without loss
> **Center:** A self-standing artifact must be complete — partial persistence means the artifact is a degraded derivative, not the real thing.

Every workspace entity type — including all node variants (markdown, PDF, transform, chat), connections with labels, and viewport — must survive a full save-then-load cycle with no field loss, no type coercion errors, and no silent defaults replacing saved values. **(E)**

### ac-binary-content-persistence: Binary content persists server-side
> **Center:** PDF nodes reference binary data that currently lives in IndexedDB. If binary content remains browser-private, the artifact is incomplete and not truly self-standing.

Binary content (PDF files) associated with workspace nodes must be stored server-side. After migration, PDF nodes must render their content when loaded from a fresh browser session with no prior IndexedDB data.

### ac-interaction-responsiveness: No perceptible degradation in canvas interactions
> **Center:** The migration changes where authority lives, not how the user experiences the workspace. If responsiveness degrades, the migration imposed a cost the user never agreed to.

Drag, type, connect, resize, and scroll/zoom operations must remain visually immediate after migration. Persistence operations must not block or delay user interaction. The client retains local state for interaction speed; what changes is where committed state is ultimately persisted. **(E)**

### ac-tab-close-safety: Pending changes survive tab close within a documented window
> **Center:** A persistent artifact must not lose recent work due to ordinary user behavior like closing a tab.

When the user closes the browser tab, all state changes committed more than one save-cycle ago must be persisted server-side. If the data-safety guarantee is weaker than the current synchronous flush (which guarantees zero loss), the maximum data-loss window must be documented and must not exceed the current debounce interval. **(E)**

### ac-existing-data-migration: Current workspace data is preserved
> **Center:** The artifact's history matters. A migration that loses existing work undermines the "persistent" part of "persistent artifact."

A user with an existing workspace in the current browser-private storage must not lose that data after the migration. On first launch of the migrated system, existing workspace data must be available. The migration path must handle the case where server-side storage is empty but browser storage contains a workspace.

### ac-external-readability: Workspace data is readable outside the browser
> **Center:** This is the operational definition of "self-standing" — the artifact can be accessed by any authorized process on the host, not just the browser that created it.

The persisted workspace data must be readable by a process running on the host machine that has no relationship to the browser. The data must be in a standard, parseable format. This is the criterion that distinguishes server-side state from browser-private state.

### ac-architectural-integrity: Kernel layer remains unchanged
> **Center:** The kernel defines what a workspace IS. The migration changes where it is STORED. If the kernel must change, the migration has leaked infrastructure concerns inward.

The kernel layer must require no modifications for this migration. If the port interface in the client domain boundary must evolve (e.g., to accommodate asynchronous persistence), those changes are confined to the client domain boundary and justified by the requirements of server-side storage. No framework imports enter the kernel.

---

## Scope

### IN (building)

- Server-side storage adapter for workspace data (nodes, connections, viewport)
- Server-side storage for binary content (PDF blobs)
- Migration path from browser-private storage to server-side storage
- Port interface evolution if required by async persistence
- Preservation of current interaction responsiveness

### OUT (explicitly not building)

- Agent access patterns or agent-specific APIs (solves itself once state is server-side)
- Multi-user or concurrent-access handling (sole developer, sole user)
- Conflict resolution or optimistic concurrency control
- Real-time sync or polling mechanisms
- New UI for connection status, sync indicators, or server configuration
- Changes to the workspace data model or kernel entities

### DEFERRED (future)

- Remote server deployment (currently localhost only)
- Workspace versioning or history
- Multiple workspace support
- Authentication and authorization
- Graceful degradation to browser storage if server is unavailable

---

## Dependencies

- Existing StoragePort and BlobStoragePort interfaces in client domain ports
- Existing clean architecture separation (kernel / client domain / adapters / UI)
- Server-side capabilities in the application framework (API routes or equivalent)
- Existing migration infrastructure in the storage adapter (version envelope pattern)

---

## User Scenarios

### Scenario 1: Everyday editing after migration

The user opens Context Canvas. Their workspace loads — all markdown nodes, PDF nodes, transform nodes, chat nodes, and connections appear as they left them. They drag a node across the canvas, type several paragraphs into a markdown node, connect two nodes with an edge. Everything feels identical to before. They close the tab, reopen it, and all changes are present. At no point did they think about where state is stored. **(ac-server-source-of-truth, ac-interaction-responsiveness, ac-full-data-round-trip, ac-tab-close-safety)**

### Scenario 2: Fresh browser, same workspace

The user clears their browser data (or opens a different browser). They navigate to the canvas. The workspace loads completely — every node, every connection, every PDF rendering correctly. This scenario was impossible before the migration and is the single most visible proof that the source of truth has moved. **(ac-server-source-of-truth, ac-binary-content-persistence, ac-external-readability)**

### Scenario 3: Migration from existing workspace

The user has been using Context Canvas for weeks with a rich workspace in localStorage and several PDFs in IndexedDB. They deploy the migrated version. On first load, the application detects existing browser-side data, persists it to server-side storage, and continues normally. Their next session loads from the server. No data was lost. No manual export/import was required. **(ac-existing-data-migration, ac-full-data-round-trip)**
