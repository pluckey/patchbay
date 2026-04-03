---
feature: pdf-viewer-cleanup
center: "Address architectural violations and code smells surfaced during roundtable review of the PDF viewer implementation."
stage: requirements
intensity: focused
loop_iterations: 0
last_modified: 2026-04-02T00:00:00Z
---

# Requirements: PDF Viewer Cleanup

## Context

Post-implementation review (Uncle Bob + Fowler roundtable) identified six issues in the PDF viewer node implementation. This spec addresses them in priority order.

## Acceptance Criteria

### ac-upload-orchestrator: Upload orchestration lives outside the hook
> `useWorkspace.handleUploadPdf` currently performs validation, blob storage, metadata extraction, error recovery, and node creation — a multi-step use case embedded in a React hook. Extract it so the hook calls an orchestrator, not implements one.
> - The orchestrator accepts ports (`BlobStoragePort`, `PdfRendererPort`) as arguments
> - Returns a result object (success with node data, or failure with reason) — no `alert()` calls
> - `useWorkspace` calls the orchestrator and decides how to present errors
> - The Dependency Rule is maintained: orchestrator lives in adapters or a new `domain/services/` layer, imports only domain types and ports

### ac-storage-migration: v1 workspace data migrates to v2 on load
> Existing v1 workspace data (nodes without a `type` field) must be migrated on load.
> - `loadWorkspace` (or a migration function it calls) stamps `type: "markdown"` on any node missing a `type` field
> - Migration is idempotent — running it on v2 data is a no-op
> - Version envelope bumps from `1` to `2`
> - v2 data is written back on next save, so migration runs at most once

### ac-delete-cleanup: Blob cleanup decision is domain-adjacent, not hook-internal
> `handleDelete` currently checks `node?.type === "pdf"` inside a `setNodes` callback to decide whether to delete the blob. Move this decision closer to the domain.
> - A `removeNodeWithCleanup` orchestrator (or similar) takes the node list, nodeId, and blob storage port
> - Returns the updated node list and any cleanup side effects to execute
> - The hook delegates to it rather than embedding the conditional

### ac-pdf-content-decompose: PdfContent is split into focused sub-components
> `PdfContent.tsx` manages rendering, search state, ToC fetching/display, and navigation — extract sub-components:
> - `PdfSearchBar` — search input, match count display, ToC toggle button
> - `PdfTableOfContents` — collapsible overlay with recursive outline
> - `PdfPageNav` — previous/next buttons and page indicator
> - `PdfContent` becomes a layout coordinator composing these three plus the page canvas

### ac-dead-type-removed: PdfSearchMatch type is removed or implemented
> `PdfSearchMatch` is defined in `pdf-renderer-port.ts` but never used. Remove it. If highlight positions are needed later, reintroduce it with an implementation.

### ac-no-alert: Hook returns results, components choose UI feedback
> `useWorkspace` must not call `alert()`. Upload and delete operations return result objects. The component layer decides presentation (toast, inline error, etc.).

## Priority & Sequencing

| Priority | AC | Rationale |
|----------|-----|-----------|
| High | ac-upload-orchestrator | Largest Dependency Rule violation; blocks clean testing |
| High | ac-storage-migration | Data loss risk for existing users |
| Medium | ac-delete-cleanup | Domain logic in wrong layer |
| Medium | ac-pdf-content-decompose | Maintainability before next feature |
| Low | ac-dead-type-removed | Dead code hygiene |
| Low | ac-no-alert | Presentation coupling |

## Scope

**In scope:** Structural refactoring, migration logic, component extraction. No new user-facing features.

**Out of scope:** Performance optimization of `useCanvasBinding` node remapping (noted in review but premature to address at current scale).
