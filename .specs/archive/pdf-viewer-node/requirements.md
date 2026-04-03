---
feature: pdf-viewer-node
center: "Users can place PDF documents as viewable nodes on the canvas, creating a second source type alongside markdown for composing AI context."
stage: requirements
intensity: focused
loop_iterations: 1
last_modified: 2026-04-02T00:00:00Z
---

# Requirements: PDF Viewer Node

## Acceptance Criteria

### ac-pdf-upload-single-action: One-step PDF upload creates a canvas node
> **Center:** Enables the placing action — without a low-friction upload path, PDFs cannot become source nodes on the canvas.

Given the user initiates a file upload via a discoverable UI affordance, when they select a valid PDF file, then a new PDF node appears on the canvas. The entire flow is a single logical action — no wizards, no confirmation dialogs.

### ac-pdf-renders-page-content: Node renders actual PDF page content
> **Center:** Makes the node a viewable source rather than a file reference — the user sees document content, not just metadata.

The PDF node renders the actual content of the current PDF page (text, figures, layout) within the node boundaries. The rendered content is legible at the node's default dimensions. A file icon or filename-only display does not satisfy this criterion.

### ac-pdf-page-navigation: Forward/backward page navigation with position indicator
> **Center:** Makes the full document accessible as a context source — without navigation, only page 1 is available, rendering multi-page PDFs unusable for context composition.

The user can advance to the next page and return to the previous page. The current page number and total page count are visible. Navigation controls do not obscure the document content. At page 1, previous is absent or disabled; at the last page, next is absent or disabled.

### ac-pdf-filename-visible: Source filename is displayed on the node
> **Center:** Enables disambiguation when composing context from multiple PDF sources — without visible filenames, users cannot tell which document is which.

The PDF node displays the original filename of the uploaded document in a visible header area. The filename remains visible regardless of which page is displayed.

### ac-pdf-persists-across-reload: PDF node and content survive page reload
> **Center:** A source that disappears between sessions cannot participate in ongoing context composition — persistence makes PDFs durable workspace artifacts.

After uploading a PDF, a full page reload restores: the PDF node in its correct position with correct dimensions, the PDF content rendered and navigable, and the last-viewed page state.

### ac-pdf-node-spatial-parity: Drag and resize behavior matches existing nodes
> **Center:** PDF nodes must participate in spatial arrangement as first-class canvas citizens — a node that cannot be repositioned or resized cannot be composed alongside markdown nodes.

The PDF node can be dragged and resized using the same interactions as markdown nodes. When resized, the rendered PDF page scales to fit. Position and dimension changes persist across reload.

### ac-pdf-upload-size-validation: Oversized files produce a clear message
> **Center:** Protects the upload pathway — a silent failure or crash on large files blocks the user from placing PDFs entirely.

Files exceeding the maximum accepted size are stopped before processing begins. The user receives a clear, human-readable message. The canvas remains in its prior state.

### ac-pdf-upload-error-handling: Invalid files produce a clear error without breaking the canvas
> **Center:** Protects workspace integrity — a crash on a bad file takes down the entire canvas, including existing markdown sources.

When the user uploads a file that cannot be rendered as a PDF (corrupted, password-protected, wrong format), the system displays a clear error message. No node is created. All existing nodes remain unaffected.

### ac-pdf-upload-loading-state: Immediate visual feedback during PDF processing
> **Center:** Prevents duplicate nodes from frustrated re-uploads and reflects user intent immediately on the canvas.

When a PDF upload begins, a placeholder node appears on the canvas immediately, indicating processing is in progress. If processing fails, the placeholder transitions to an error state or is cleaned up.

### ac-pdf-binary-cleanup-on-delete: Discarding a PDF node frees its stored binary data
> **Center:** Protects the system's capacity to hold future sources — without cleanup, storage fills with orphaned binary data.

When a user discards a PDF node from the canvas, the associated PDF binary data is also freed from storage.

### ac-pdf-graceful-missing-data: Node degrades gracefully when binary data is unavailable
> **Center:** Prevents a missing PDF file from crashing the entire canvas — protects all other source nodes from a single point of failure.

If a PDF node's binary data is missing (e.g., browser storage cleared externally), the node displays a clear "content unavailable" state rather than crashing. The rest of the canvas functions normally. The user can discard the degraded node.

### ac-pdf-no-regression-existing-nodes: Markdown node functionality is unchanged
> **Center:** Second source type alongside markdown requires the first source type to continue working — adds capability without subtracting any.

After PDF node support is added, all markdown node behaviors continue to work: create, edit/view toggle, resize, drag, persist across reload.

### ac-pdf-snappy-navigation: Page transitions feel instant
> **Center:** A sluggish viewer breaks the reading flow that context composition depends on — the user must move through pages without waiting.

Navigating between pages (prev/next or jump-to-page) produces a visible page transition with no perceptible delay. Pages that have been viewed before render instantly. First-time page renders complete within a reasonable timeframe even for large documents.

### ac-pdf-table-of-contents: Document structure is navigable via ToC
> **Center:** Long documents are useless context sources without structural navigation — the user needs to jump to the relevant section, not scroll page by page.

If the PDF contains a table of contents / document outline, the node exposes it as a navigable list. Selecting a ToC entry jumps to the corresponding page. If the PDF has no embedded outline, the ToC UI is absent (not empty or broken).

### ac-pdf-text-search: User can search for text within the PDF
> **Center:** Finding specific content in a document is a precondition for composing context from it — without search, the user must manually scan every page.

The user can enter a search query and the viewer highlights matching text on the current page and indicates how many total matches exist across the document. The user can navigate between matches (next/prev match).

### ac-pdf-drag-drop-upload: Drag a PDF from the file system onto the canvas (E)
> **Center:** Provides the most natural upload interaction for a spatial canvas metaphor — dragging a document onto a workspace is the physical-world analog.

**(E)** A PDF file dragged from the OS file manager onto the canvas creates a new PDF node at the drop location. Same validation, error handling, and loading behavior as the file-picker path.

## Scope

**IN:**
- PDF upload via file picker
- PDF page rendering within canvas node
- Prev/next page navigation with page count
- Snappy page transitions (pre-render / caching)
- Table of contents navigation (when PDF has outline)
- Text search with match highlighting and navigation
- Filename display on node header
- Persistence of PDF node and binary content across reload
- Drag and resize parity with markdown nodes
- File size validation with clear messaging
- Error handling for unreadable files
- Loading state during upload
- Binary data cleanup on node discard
- Graceful degradation for missing binary data
- Regression protection for markdown nodes
- Drag-and-drop upload (E)

**OUT:**
- Text extraction or text selection from PDF content
- PDF annotations or highlighting
- PDF editing
- Zoom controls (node resize serves this purpose)
- URL-based PDF loading
- Multi-file batch upload

**DEFERRED:**
- Text extraction from PDF for AI context composition
- PDF annotations or highlighting
- Thumbnail preview at far canvas zoom levels

## Dependencies

- Existing markdown node implementation (pattern for node registration, rendering, persistence)
- Canvas drag and resize infrastructure
- Node type registration system
- Existing localStorage persistence layer (continues for workspace metadata)

## Storage Decision

**IndexedDB for PDF binary storage; localStorage continues for workspace metadata.**

- Workspace metadata (node positions, dimensions, types, blob references) stays in localStorage/JSON — small and structured
- PDF binary content goes to IndexedDB — handles blobs natively, hundreds of MB capacity
- Coupling is a single identifier per PDF node: workspace metadata references a binary blob by ID
- Does NOT replace localStorage — additive capability only

## User Scenarios

**Scenario 1: First PDF on the canvas.** A user has two markdown nodes with reading notes. They click upload, select a 3MB research paper, see a loading placeholder (ac-pdf-upload-loading-state). The first page renders (ac-pdf-renders-page-content) with "smith-2024-attention.pdf" in the header (ac-pdf-filename-visible). They drag it next to their notes, resize it larger (ac-pdf-node-spatial-parity). They flip to page 7 (ac-pdf-page-navigation). They close the browser, reopen — canvas is exactly as they left it, PDF on page 7 (ac-pdf-persists-across-reload).

**Scenario 2: Bad file upload.** A user tries a password-protected PDF — clear error, no node created (ac-pdf-upload-error-handling). Existing markdown nodes unaffected (ac-pdf-no-regression-existing-nodes). They try a 75MB file — told it's too large (ac-pdf-upload-size-validation).

**Scenario 3: Cleanup and degradation.** A user discards a PDF node; storage is reclaimed (ac-pdf-binary-cleanup-on-delete). Later, browser storage is cleared externally. On reload, PDF nodes show "content unavailable" (ac-pdf-graceful-missing-data), markdown nodes load normally (ac-pdf-no-regression-existing-nodes).
