---
feature: pdf-viewer-node
center: "Users can place PDF documents as viewable nodes on the canvas, creating a second source type alongside markdown for composing AI context."
stage: design
intensity: focused
loop_iterations: 1
last_modified: 2026-04-02T00:00:00Z
---

# Design: PDF Viewer Node

## System Decomposition

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|----|------|------|--------|---------------|---------------|
| da-01 | WorkspaceNode discriminated union | Entity | Modify | `type: 'markdown' \| 'pdf'`; PDF variant adds blobId, filename, currentPage, totalPages | all PDF ACs |
| da-02 | BlobStoragePort | Port | New | `store(blob): Promise<string>`, `retrieve(blobId): Promise<Blob\|null>`, `delete(blobId): Promise<void>` | ac-pdf-persists-across-reload, ac-pdf-binary-cleanup-on-delete, ac-pdf-graceful-missing-data |
| da-03 | IndexedDBBlobAdapter | Adapter | New | Implements BlobStoragePort; DB: context-canvas-blobs, store: blobs | ac-pdf-persists-across-reload, ac-pdf-binary-cleanup-on-delete |
| da-04 | pdf-renderer adapter | Adapter | New | Gateway over pdfjs-dist; lazy singleton worker; renderPage, extractMetadata, getOutline, searchText; dynamic import | ac-pdf-renders-page-content, ac-pdf-snappy-navigation, ac-pdf-table-of-contents, ac-pdf-text-search |
| da-05 | createPdfNode | Use Case | New | Takes blobId/filename/totalPages/position, returns WorkspaceNode | ac-pdf-upload-single-action |
| da-06 | navigatePdfPage | Use Case | New | Validates page range, updates currentPage | ac-pdf-page-navigation |
| da-07 | NodeShell | Component | Extract | Spatial chrome: NodeResizer, drag handle, header, delete button; takes children + props | ac-pdf-node-spatial-parity, ac-pdf-no-regression-existing-nodes |
| da-08 | MarkdownContent | Component | Extract | Edit/view switch, markdown rendering; slotted inside NodeShell | ac-pdf-no-regression-existing-nodes |
| da-09a | PdfContent core | Component | New | PDF page canvas, navigation controls, filename header, unavailable fallback; React.lazy loaded | ac-pdf-renders-page-content, ac-pdf-page-navigation, ac-pdf-filename-visible, ac-pdf-graceful-missing-data, ac-pdf-upload-loading-state |
| da-09b | PdfContent ToC | Component | Enhance | Collapsible outline panel from PDF structure | ac-pdf-table-of-contents |
| da-09c | PdfContent search | Component | Enhance | Text search with match highlighting and navigation | ac-pdf-text-search |
| da-10a | usePdfViewer basic | Hook | New | Single-page rendering, PDFDocumentProxy cleanup on unmount | ac-pdf-renders-page-content |
| da-10b | usePdfViewer cache | Hook | Enhance | LRU 5-page cache, pre-renders N plus/minus 1 | ac-pdf-snappy-navigation |
| da-11 | flow-node-mapper extension | Adapter | Modify | Dispatch on node.type, PdfNodeData type | ac-pdf-node-spatial-parity, ac-pdf-no-regression-existing-nodes |
| da-12 | useWorkspace PDF orchestration | Hook | Modify | handleUploadPdf, handleRemoveNode with blob cleanup, handleNavigatePage | ac-pdf-upload-single-action, ac-pdf-upload-size-validation, ac-pdf-upload-error-handling, ac-pdf-upload-loading-state, ac-pdf-binary-cleanup-on-delete, ac-pdf-drag-drop-upload |
| da-13 | Upload validation | Pure fn | New | Validates MIME + size (50MB max) | ac-pdf-upload-size-validation, ac-pdf-upload-error-handling |
| da-14 | Storage migration v1 to v2 | Adapter | Modify | Adds type:'markdown' to existing nodes, bumps version | ac-pdf-no-regression-existing-nodes |
| da-15 | Canvas drop handler | Component | Modify | onDrop/onDragOver on ReactFlow, screenToFlowPosition for coords | ac-pdf-drag-drop-upload |

## Relationship Map

```
                    ENTITY LAYER
  WorkspaceNode (da-01) = MarkdownNode | PdfNode
                    |
                USE CASE LAYER
  createPdfNode (da-05), navigatePdfPage (da-06)
  [existing: createNode, moveNode, resizeNode, removeNode, loadWorkspace, saveWorkspace]
                    |
                PORT LAYER
  StoragePort (existing), BlobStoragePort (da-02)
                    |
              ADAPTER LAYER
  localStorageAdapter + migration (da-14)
  IndexedDBBlobAdapter (da-03)
  pdf-renderer (da-04) — Gateway over pdfjs-dist
  flow-node-mapper (da-11) — dispatches on node.type
                    |
            COMPONENT / HOOK LAYER
  useWorkspace (da-12) — orchestrates both ports + pdf-renderer
  useCanvasBinding — flow-node-mapper → xyflow
  Canvas (da-15: drop handler)
    ├── NodeShell (da-07)
    │     ├── MarkdownContent (da-08)
    │     └── PdfContent (da-09a/b/c) → usePdfViewer (da-10a/b) → pdf-renderer (da-04)
    └── Toolbar (upload button)
```

## Behavior Plan

| Behavior | Description | Traces to |
|----------|-------------|-----------|
| Upload orchestration | validate → store blob → extract metadata → createPdfNode → save; on failure: clean up orphaned blob, surface error | ac-pdf-upload-single-action, ac-pdf-upload-size-validation, ac-pdf-upload-error-handling, ac-pdf-upload-loading-state |
| Page navigation | navigatePdfPage validates range → updates currentPage → saves → usePdfViewer renders from cache or pdf-renderer → pre-renders N plus/minus 1 | ac-pdf-page-navigation, ac-pdf-snappy-navigation |
| ToC | PdfContent calls pdf-renderer.getOutline → renders collapsible panel → click jumps to page | ac-pdf-table-of-contents |
| Text search | Search input → pdf-renderer.searchText → match count + highlights → prev/next match navigation | ac-pdf-text-search |
| Graceful degradation | PdfContent retrieves blob → if null, renders "content unavailable" in NodeShell | ac-pdf-graceful-missing-data |
| Delete with cleanup | Check node.type → if pdf: fire blob delete (fire-and-forget) → removeNode → save | ac-pdf-binary-cleanup-on-delete |
| File drop | Canvas onDrop detects PDF MIME → screenToFlowPosition for coords → delegate to handleUploadPdf | ac-pdf-drag-drop-upload |
| Storage migration | On load, version < 2 → add type:'markdown' to all nodes → bump version → save | ac-pdf-no-regression-existing-nodes |

## UI Plan

**PDF node anatomy:**
```
┌─────────────────────────────────┐
│ [drag handle]  paper.pdf    [x] │  ← NodeShell header
├─────────────────────────────────┤
│                                 │
│     ┌───────────────────┐       │
│     │   Rendered PDF    │       │  ← PdfContent canvas
│     │     page          │       │     scales to fit width
│     └───────────────────┘       │
│                                 │
│  [ToC] [Search: _________ ]    │  ← ToC toggle + search bar
├─────────────────────────────────┤
│  [<]  Page 3 of 42  [>]        │  ← Navigation bar
└─────────────────────────────────┘
  ○                             ○    ← Resize handles
```

## Data Plan

**localStorage v2 schema:** WorkspaceNode gains `type` discriminant. PDF variant carries `blobId`, `filename`, `currentPage`, `totalPages`. Migration v1→v2 adds `type: 'markdown'` to existing nodes.

**IndexedDB schema:** Database `context-canvas-blobs`, object store `blobs`, keyPath `id`. Values: `{ id: string, blob: Blob, storedAt: number }`.

**Dual-storage invariants:**
- Write order: store blob FIRST → then create domain node → then save workspace
- Delete order: delete blob (fire-and-forget) → then remove node → then save
- Orphaned blob is tolerable; orphaned node reference is not
- No cross-storage transactions

## Verification Strategy

| AC ID | Method |
|-------|--------|
| ac-pdf-upload-single-action | Integration: click upload → select file → node appears |
| ac-pdf-renders-page-content | Integration: upload known PDF → verify canvas renders content |
| ac-pdf-page-navigation | Unit + Integration: use case validates range; click next → page updates |
| ac-pdf-snappy-navigation | Performance: < 200ms for cached pages |
| ac-pdf-table-of-contents | Integration: upload PDF with outline → ToC renders → click jumps to page |
| ac-pdf-text-search | Integration: search known text → match count > 0, highlights visible |
| ac-pdf-filename-visible | Component: filename text in header |
| ac-pdf-persists-across-reload | Integration: create → reload → verify node + content intact |
| ac-pdf-node-spatial-parity | Integration: drag + resize work identically to markdown |
| ac-pdf-upload-size-validation | Unit: validation function rejects oversized |
| ac-pdf-upload-error-handling | Integration: upload invalid file → error, no broken canvas |
| ac-pdf-upload-loading-state | Integration: verify placeholder during processing |
| ac-pdf-binary-cleanup-on-delete | Integration: delete node → IndexedDB no longer contains blobId |
| ac-pdf-graceful-missing-data | Integration: clear IndexedDB → reload → "unavailable" state |
| ac-pdf-no-regression-existing-nodes | Regression: v1 workspace loads correctly after migration |
| ac-pdf-drag-drop-upload | Integration: simulate file drop → node at correct position |
