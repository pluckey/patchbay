---
feature: pdf-viewer-cleanup
center: "Address architectural violations and code smells surfaced during roundtable review of the PDF viewer implementation."
stage: tasks
intensity: focused
loop_iterations: 0
last_modified: 2026-04-02T00:00:00Z
---

# Tasks: PDF Viewer Cleanup

## Phase 1 — Domain & Adapter Fixes

### t-upload-orchestrator: Extract PDF upload orchestration from useWorkspace | refactor
> **Center:** Move multi-step upload logic out of the hook into a testable orchestrator
> **Traces:** ac-upload-orchestrator, ac-no-alert
> **Depends:** (none)
> **Status:** complete

- **File:** new `src/adapters/orchestration/upload-pdf.ts`
- **Done when:**
  - `uploadPdf(file, position, ports: { blobStorage: BlobStoragePort, pdfRenderer: PdfRendererPort })` is a standalone async function
  - Returns `{ ok: true, node: PdfNodeData } | { ok: false, reason: string }`
  - Handles blob cleanup on metadata extraction failure
  - No `alert()`, no React imports
  - `useWorkspace.handleUploadPdf` delegates to it and handles the result (e.g. shows error in UI)

### t-storage-migration: Add v1 → v2 workspace migration | create
> **Center:** Prevent data loss when existing users load workspaces that predate the discriminated union
> **Traces:** ac-storage-migration
> **Depends:** (none)
> **Status:** complete (already implemented in local-storage-adapter.ts)

- **File:** `src/adapters/storage/migrate-workspace.ts` (new), modify `src/adapters/storage/local-storage-adapter.ts`
- **Done when:**
  - `migrateWorkspace(raw: unknown): Workspace` handles v1 data (nodes without `type` field) by stamping `type: "markdown"`
  - Version envelope becomes `2` on next save
  - Idempotent: v2 input passes through unchanged
  - `loadWorkspace` calls migration before returning
  - Unit-testable with plain objects (no localStorage needed)

### t-delete-cleanup: Extract blob cleanup decision from handleDelete | refactor
> **Center:** Move the "PDF nodes need blob cleanup" logic closer to the domain
> **Traces:** ac-delete-cleanup
> **Depends:** (none)
> **Status:** complete

- **File:** new `src/adapters/orchestration/remove-node-with-cleanup.ts`, modify `src/hooks/use-workspace.ts`
- **Done when:**
  - `removeNodeWithCleanup(nodes, nodeId)` returns `{ updatedNodes: WorkspaceNode[], blobIdsToDelete: string[] }`
  - Pure function — inspects the node being removed, collects blob IDs if PDF type
  - Hook calls it, then fires blob deletes as side effects
  - No domain logic remains inside `setNodes` callback

### t-dead-type: Remove unused PdfSearchMatch type | delete
> **Center:** Dead code removal
> **Traces:** ac-dead-type-removed
> **Depends:** (none)
> **Status:** complete

- **File:** `src/domain/ports/pdf-renderer-port.ts`
- **Done when:** `PdfSearchMatch` type is deleted; no compilation errors

## Phase 2 — Component Decomposition

### t-pdf-search-bar: Extract PdfSearchBar component | refactor
> **Center:** Isolate search input and match display from PdfContent
> **Traces:** ac-pdf-content-decompose
> **Depends:** (none)
> **Status:** complete

- **File:** new `src/components/PdfSearchBar.tsx`, modify `src/components/PdfContent.tsx`
- **Done when:**
  - `PdfSearchBar` owns search query state, displays match count, has ToC toggle button
  - Props: `onSearch(query: string)`, `matchCount: number`, `onToggleToc()`, `isTocOpen: boolean`
  - Event propagation stopping is encapsulated within the component

### t-pdf-toc: Extract PdfTableOfContents component | refactor
> **Center:** Isolate ToC overlay and recursive tree rendering
> **Traces:** ac-pdf-content-decompose
> **Depends:** (none)
> **Status:** complete

- **File:** new `src/components/PdfTableOfContents.tsx`, modify `src/components/PdfContent.tsx`
- **Done when:**
  - `PdfTableOfContents` renders the collapsible outline overlay with recursive `TocList`
  - Props: `outline: PdfOutlineItem[]`, `onNavigate(page: number)`, `isOpen: boolean`
  - Self-contained — no dependency on PdfContent internal state

### t-pdf-page-nav: Extract PdfPageNav component | refactor
> **Center:** Isolate page navigation controls
> **Traces:** ac-pdf-content-decompose
> **Depends:** (none)
> **Status:** complete

- **File:** new `src/components/PdfPageNav.tsx`, modify `src/components/PdfContent.tsx`
- **Done when:**
  - `PdfPageNav` renders prev/next buttons and page indicator
  - Props: `currentPage: number`, `totalPages: number`, `onNavigate(page: number)`
  - Disables prev at page 1, next at last page

### t-pdf-content-compose: PdfContent becomes layout coordinator | refactor
> **Center:** Wire extracted sub-components back together
> **Traces:** ac-pdf-content-decompose
> **Depends:** t-pdf-search-bar, t-pdf-toc, t-pdf-page-nav
> **Status:** complete

- **File:** `src/components/PdfContent.tsx`
- **Done when:**
  - PdfContent composes `PdfSearchBar`, `PdfTableOfContents`, `PdfPageNav`, and the page canvas
  - No inline UI for search, ToC, or navigation remains in PdfContent
  - Component is under ~80 lines
