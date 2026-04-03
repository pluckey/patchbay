---
feature: pdf-viewer-node
center: "Users can place PDF documents as viewable nodes on the canvas, creating a second source type alongside markdown for composing AI context."
stage: tasks
intensity: focused
loop_iterations: 1
last_modified: 2026-04-02T00:00:00Z
---

# Tasks: PDF Viewer Node

## Phase 1 — Domain (zero dependencies)

### t-node-type-union: Extend WorkspaceNode with discriminated type field | create
> **Center:** Type system foundation for distinguishing markdown from PDF nodes
> **Traces:** ac-pdf-no-regression-existing-nodes, ac-pdf-node-spatial-parity
> **Depends:** (none)
> **Status:** complete

- **Implements**: da-01
- **Done when**: WorkspaceNode is a discriminated union on `type: 'markdown' | 'pdf'`; PDF variant includes `blobId: string`, `filename: string`, `currentPage: number`, `totalPages: number`; TypeScript enforces exhaustive switch on node.type; all existing code compiles with type:'markdown' on test fixtures

### t-blob-storage-port: BlobStoragePort interface in domain/ports | create
> **Center:** Persistence contract for PDF binary data without coupling to storage mechanism
> **Traces:** ac-pdf-persists-across-reload, ac-pdf-binary-cleanup-on-delete, ac-pdf-graceful-missing-data
> **Depends:** (none)
> **Status:** complete

- **Implements**: da-02
- **Done when**: `BlobStoragePort` exported from `src/domain/ports/blob-storage-port.ts` with `store(blob: Blob): Promise<string>`, `retrieve(blobId: string): Promise<Blob | null>`, `delete(blobId: string): Promise<void>`; zero imports from adapters or browser APIs

### t-upload-validation: Pure upload validation function | create
> **Center:** Guards upload pipeline with domain-level constraints before any side effects
> **Traces:** ac-pdf-upload-size-validation, ac-pdf-upload-error-handling
> **Depends:** (none)
> **Status:** complete

- **Implements**: da-13
- **Done when**: Validates MIME type (application/pdf) and file size (max 50MB); returns discriminated result `{ok: true}` or `{ok: false, reason: string}`; in `src/domain/use-cases/validate-pdf-upload.ts`

### t-create-pdf-node: createPdfNode use case | create
> **Center:** Pure factory producing valid PDF WorkspaceNode from pre-extracted metadata
> **Traces:** ac-pdf-upload-single-action
> **Depends:** t-node-type-union
> **Status:** complete

- **Implements**: da-05
- **Done when**: Takes `{blobId, filename, totalPages, position}`, returns WorkspaceNode with `type: 'pdf'`, generated id, `currentPage: 1`; in `src/domain/use-cases/create-pdf-node.ts`; barrel export updated

### t-navigate-pdf-page: navigatePdfPage use case | create
> **Center:** Enforces page-range invariants so no component can set an invalid page
> **Traces:** ac-pdf-page-navigation
> **Depends:** t-node-type-union
> **Status:** complete

- **Implements**: da-06
- **Done when**: Takes nodes array + nodeId + target page; returns updated array if page in [1, totalPages]; returns unchanged for out-of-range or non-PDF node; in `src/domain/use-cases/navigate-pdf-page.ts`; barrel export updated

## Phase 2 — Adapters (high-risk first)

### t-indexeddb-blob-adapter: IndexedDB implementation of BlobStoragePort | create
> **Center:** Durable client-side storage for PDF blobs beyond localStorage's 5MB limit
> **Traces:** ac-pdf-persists-across-reload, ac-pdf-binary-cleanup-on-delete
> **Depends:** t-blob-storage-port
> **Status:** complete

- **Implements**: da-03
- **Done when**: `indexedDbBlobAdapter` exported from `src/adapters/storage/indexeddb-blob-adapter.ts` satisfying BlobStoragePort; DB name `context-canvas-blobs`, object store `blobs`; store() returns unique blobId; retrieve() returns byte-identical blob; delete() causes subsequent retrieve() to return null; handles QuotaExceededError with descriptive rejection

### t-pdf-renderer-adapter: pdf-renderer gateway over pdfjs-dist | create
> **Center:** Isolates all pdf.js complexity behind a stable adapter interface with zero bundle cost when unused
> **Traces:** ac-pdf-renders-page-content, ac-pdf-snappy-navigation, ac-pdf-table-of-contents, ac-pdf-text-search
> **Depends:** (none)
> **Status:** complete

- **Implements**: da-04
- **Done when**: Exports `renderPage(doc, pageNum, scale): Promise<HTMLCanvasElement>`, `loadDocument(blob): Promise<PdfDocument>`, `getOutline(doc)`, `searchText(doc, pageNum, query)`; pdf.js worker is lazy singleton; entire module dynamically imported; verified: network tab shows zero pdf.js bytes on initial page load; in `src/adapters/pdf/pdf-renderer.ts`

### t-storage-migration: Migrate v1 workspace to v2 with node types | modify
> **Center:** Existing workspaces survive the type system upgrade without data loss
> **Traces:** ac-pdf-no-regression-existing-nodes
> **Depends:** t-node-type-union
> **Status:** complete

- **Implements**: da-14
- **Done when**: In `src/adapters/storage/local-storage-adapter.ts`, on load: if version < 2, every node gains `type: 'markdown'`, version bumps to 2; migration is idempotent; existing workspace JSON loads correctly after migration

### t-flow-mapper-pdf: Extend flow-node-mapper to dispatch on node type | modify
> **Center:** Bridges discriminated union to xyflow rendering so PDF nodes appear on canvas
> **Traces:** ac-pdf-node-spatial-parity, ac-pdf-no-regression-existing-nodes
> **Depends:** t-node-type-union, t-storage-migration
> **Status:** complete

- **Implements**: da-11
- **Done when**: Mapper switches on node.type; markdown produces existing MarkdownNodeData; pdf produces PdfNodeData with blobId, filename, currentPage, totalPages + callbacks; PdfNodeData type exported; exhaustive switch enforced by TypeScript

## Phase 3 — UI Refactoring (Strangler Fig)

### t-node-shell-extract: Extract NodeShell from MarkdownNode | refactor
> **Center:** Reusable container so both markdown and PDF share identical drag/resize/header/delete behavior
> **Traces:** ac-pdf-node-spatial-parity, ac-pdf-no-regression-existing-nodes
> **Depends:** (none)
> **Status:** complete

- **Implements**: da-07
- **Done when**: `NodeShell` exported from `src/components/NodeShell.tsx`; renders children inside container with drag handle, resize handles, header bar (title + delete button); MarkdownNode now composes NodeShell + content; rendered output visually identical to pre-extraction (no regression)

### t-markdown-content-extract: Extract MarkdownContent from MarkdownNode | refactor
> **Center:** Proves NodeShell slot interface works by re-slotting original markdown behavior
> **Traces:** ac-pdf-no-regression-existing-nodes
> **Depends:** t-node-shell-extract
> **Status:** complete

- **Implements**: da-08
- **Done when**: `MarkdownContent` exported from `src/components/MarkdownContent.tsx`; handles edit/view toggle, markdown rendering, content updates; MarkdownNode is thin composition of NodeShell + MarkdownContent; all existing behavior preserved

## Phase 4 — PDF UI Core (MVP)

### t-pdf-viewer-hook-basic: usePdfViewer basic single-page rendering | create
> **Center:** Manages PDF document lifecycle and single-page rendering with proper memory cleanup
> **Traces:** ac-pdf-renders-page-content, ac-pdf-graceful-missing-data
> **Depends:** t-pdf-renderer-adapter, t-indexeddb-blob-adapter
> **Status:** complete

- **Implements**: da-10a
- **Done when**: Hook in `src/hooks/use-pdf-viewer.ts`; accepts blobId and currentPage; loads blob via BlobStoragePort; initializes PDFDocumentProxy via pdf-renderer; renders page to canvas ref; calls PDFDocumentProxy.destroy() on unmount; returns `unavailable` status when blob not found; no cache yet (single page only)

### t-pdf-content-core: PdfContent core rendering and navigation | create
> **Center:** Visual representation of PDF on canvas — primary interaction surface for PDF documents
> **Traces:** ac-pdf-renders-page-content, ac-pdf-page-navigation, ac-pdf-filename-visible, ac-pdf-graceful-missing-data, ac-pdf-upload-loading-state
> **Depends:** t-node-shell-extract, t-pdf-viewer-hook-basic, t-flow-mapper-pdf
> **Status:** complete

- **Implements**: da-09a
- **Done when**: `PdfContent` in `src/components/PdfContent.tsx`; renders inside NodeShell; displays PDF page via usePdfViewer canvas; filename in header; prev/next + page indicator; "PDF unavailable" fallback when blob missing; loaded via React.lazy with Suspense showing filename + spinner

### t-workspace-pdf-orchestration: useWorkspace PDF upload and delete orchestration | modify
> **Center:** Wires complete upload and delete pipelines coordinating use cases with adapters
> **Traces:** ac-pdf-upload-single-action, ac-pdf-upload-size-validation, ac-pdf-upload-error-handling, ac-pdf-upload-loading-state, ac-pdf-binary-cleanup-on-delete
> **Depends:** t-create-pdf-node, t-indexeddb-blob-adapter, t-pdf-renderer-adapter, t-upload-validation, t-navigate-pdf-page
> **Status:** complete

- **Implements**: da-12
- **Done when**: useWorkspace exposes handleUploadPdf(file, position): validate → store blob → extract metadata → createPdfNode → save; on metadata failure: deletes orphaned blob, surfaces error; handleRemoveNode: if pdf, fires blob delete (fire-and-forget) → removeNode → save; handleNavigatePage(nodeId, page) delegates to navigatePdfPage and saves

### t-canvas-drop-handler: ReactFlow drop handler for PDF files | create
> **Center:** Primary drag-and-drop interaction for getting PDFs onto the canvas
> **Traces:** ac-pdf-drag-drop-upload
> **Depends:** t-workspace-pdf-orchestration
> **Status:** complete

- **Implements**: da-15
- **Done when**: Canvas onDrop detects application/pdf from DataTransfer; converts screen coords to flow coords via screenToFlowPosition(); delegates to handleUploadPdf; onDragOver calls preventDefault(); verified: drop while zoomed/panned produces correct canvas position

## Phase 5 — Polish

### t-pdf-viewer-cache: usePdfViewer LRU page cache and pre-rendering | enhance
> **Center:** Eliminates page-turn latency with adjacent page pre-rendering
> **Traces:** ac-pdf-snappy-navigation
> **Depends:** t-pdf-viewer-hook-basic
> **Status:** complete

- **Implements**: da-10b
- **Done when**: LRU cache holds up to 5 rendered pages; cached pages render instantly; viewing page N triggers background pre-render of N-1 and N+1; cache evicts LRU when full; all canvases cleaned up on unmount

### t-pdf-content-toc: PdfContent table of contents panel | enhance
> **Center:** Navigate long PDFs by document structure rather than sequential page turning
> **Traces:** ac-pdf-table-of-contents
> **Depends:** t-pdf-content-core, t-pdf-renderer-adapter
> **Status:** complete

- **Implements**: da-09b
- **Done when**: Toggle button reveals/hides outline panel; outline from pdf-renderer getOutline(); clicking entry navigates to page; if no outline, toggle button hidden; panel stays within NodeShell boundaries

### t-pdf-content-search: PdfContent text search | enhance
> **Center:** Find specific content within a PDF without leaving the canvas context
> **Traces:** ac-pdf-text-search
> **Depends:** t-pdf-content-core, t-pdf-renderer-adapter
> **Status:** complete

- **Implements**: da-09c
- **Done when**: Search input in PdfContent; calls pdf-renderer searchText(); shows match count + current index; prev/next cycle through matches; navigates to page containing current match
