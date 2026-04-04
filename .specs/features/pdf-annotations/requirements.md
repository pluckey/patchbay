---
feature: pdf-annotations
center: "This feature allows users to construct an interpretive layer over non-editable source material — marking regions and attaching meaning — so that their reading becomes a composable, pipeline-accessible input alongside the original content."
stage: requirements
intensity: standard
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

## Acceptance Criteria

### ac-text-layer: PDF text layer enables native text selection and copy
> **Center:** Without a selectable text layer, the PDF remains a passive image — the user cannot cross from reading into interaction, blocking all downstream composability.

Given a PDF node displaying a rendered page, when the user clicks and drags across visible text, then the text is highlighted and available to the system clipboard via Cmd/Ctrl+C. The text layer is a transparent overlay positioned to align with rendered glyphs on the canvas. Selection works across zoom levels and after page navigation. The text layer does not interfere with annotation drawing (see ac-annotation-create for mode separation).

### ac-annotation-create: User creates annotation via bounding box with a required label
> **Center:** The bounding-box-plus-label interaction is the atomic unit of "marking regions and attaching meaning" — it transforms passive reading into a named, addressable datum that the pipeline can consume.

Given a PDF page is displayed, when the user initiates annotation mode and draws a rectangular region on the page, then a label input appears positioned spatially adjacent to the drawn region (not in a modal or sidebar). When the user enters a non-empty label and confirms, an annotation is created containing: page number, bounding box in PDF coordinate space (points, not screen pixels), the user-supplied label, and best-effort extracted text from the enclosed region. The annotation immediately appears on the page. Drawing then labeling is at most two interactions. If the user dismisses the label input without entering text, no annotation is created.

### ac-annotation-visible: Annotations render on their respective pages
> **Center:** Visibility is the feedback loop that confirms the user's interpretive acts are captured — without it, annotations are invisible data and the user loses trust in the system.

Given one or more annotations exist on a PDF page, when that page is displayed (including after navigating away and returning), then each annotation's bounding box is visually indicated with its label readable. Annotations on other pages are not shown. Overlapping annotations are independently visible and independently interactive. Annotations reproject correctly when zoom level changes or the node is resized (because they are stored in PDF coordinate space and rendered via projection).

### ac-annotation-delete: User can remove an annotation
> **Center:** Deletion is the outflow that prevents annotation accumulation from degrading the interpretive layer — without it, mistakes become permanent noise in the pipeline.

Given an annotation exists on the current page, when the user selects that annotation and invokes delete, then the annotation is removed from workspace state, from the visual display, and from pipeline-resolved data. The deletion persists across page navigation and workspace reload.

### ac-pipeline-contract: Annotations appear in resolved PDF input as structured data
> **Center:** This is the composability gate — the data structure is the feature. Annotations that reach the pipeline in a well-structured format unlock all downstream consumers.

Given a PDF node has annotations and is connected to a transform node via a labeled connection, when the pipeline resolves the PDF input, then the `ResolvedPdfInput` type includes an `annotations` array. Each entry contains at minimum: `{ label: string, page: number, region: { x: number, y: number, width: number, height: number }, text: string }`. The existing fields (`text`, `pages`, `currentPage`, `totalPages`, `filename`) continue to be provided unchanged — annotations enrich, they do not filter or replace. A transform author can write `input.<connectionLabel>.annotations` and enumerate all annotations across all pages.

### ac-annotation-persist: Annotations survive reload, zoom, resize, and page navigation
> **Center:** Durability makes the interpretive layer a first-class part of the workspace — without persistence, annotations are disposable gestures, not composable data.

Given annotations have been created on a PDF node, when the workspace is saved and reloaded (browser refresh, tab close and reopen), then all annotations are restored with correct page, bounding box, and label. Annotations are stored as part of PdfNodeData in the workspace state and persisted via the existing StoragePort pathway. Zoom and resize cause correct visual reprojection with no positional drift (because regions are stored in document coordinate space).

### ac-interaction-speed: Annotation creation is faster than the copy-paste workaround **(E)**
> **Center:** Speed determines whether the reinforcing adoption loop starts — if annotation is slower than the workaround, the feature is dead on arrival regardless of architectural correctness.

Given the user wants to mark a PDF region and make it pipeline-accessible, when they use the annotation workflow (draw bounding box, type label, confirm), then the total time is measurably less than the workaround (open PDF externally, select text, copy, create markdown node, paste, connect to pipeline). Evaluate with 5+ annotation creation cycles on a real document.

## Scope

**IN (building):**
- PDF text layer for native text selection and clipboard copy
- Bounding-box annotation creation with required label and spatial label input
- Annotation visual rendering per page with correct reprojection
- Annotation deletion
- Pipeline data contract (annotations array on ResolvedPdfInput)
- Annotation persistence via workspace state
- Best-effort text extraction within bounding box region

**OUT (explicitly not building):**
- Annotation label editing in-place (delete and recreate for v1)
- Character-precise text highlight annotations (bounding box only)
- Auto-text-extraction as replacement for user annotation
- Annotation-specific dark mode handling (inherits existing CSS filter inversion)
- Annotation search, filter, or export
- Multi-page spanning annotations
- Annotation color or category system

**DEFERRED (future):**
- In-place label editing
- Text highlight annotation type (character-level)
- Annotation color/category/tagging
- Annotation count badge in PDF node header
- Annotation sidebar/panel for document-wide overview
- Annotation-to-annotation relationships

## Dependencies

- pdf.js getTextContent() API for positioned text items (port extension needed)
- Existing workspace persistence (StoragePort, server-side state)
- Existing pipeline resolution (resolveSourceContent in execute-pipeline.ts)
- PdfContent.tsx component for overlay layers
- ResolvedPdfInput entity for pipeline contract extension
- PdfNodeData entity for annotation storage

## User Scenarios

**Scenario 1 — Grab a quote for a transform** (ac-text-layer, ac-annotation-create, ac-pipeline-contract):
A user opens a research paper PDF. On page 4, they see a key finding. They select the sentence with their cursor and copy it to clipboard (ac-text-layer). Then they decide this finding should be pipeline-accessible. They draw a bounding box around the paragraph, type "key-finding" in the label input (ac-annotation-create). They connect the PDF to a transform that accesses `input.paper.annotations[0].text` (ac-pipeline-contract).

**Scenario 2 — Build an annotated reading across sessions** (ac-annotation-create, ac-annotation-visible, ac-pipeline-contract, ac-annotation-persist):
Over three sessions, a user annotates a 30-page PDF: "methodology" on page 8, "results" on page 15, "limitations" on page 22. Each session, they close and return — all annotations present (ac-annotation-persist). They connect to a transform that filters `annotations.filter(a => a.label === 'methodology')`.

**Scenario 3 — Correct a mistake** (ac-annotation-delete, ac-annotation-create):
A user creates an annotation labeled "conclusion" on the wrong paragraph. They delete it (ac-annotation-delete), draw a new box on the correct paragraph, re-enter "conclusion" (ac-annotation-create). Pipeline sees only the corrected annotation.

**Scenario 4 — Overlapping regions, independent meaning** (ac-annotation-create, ac-annotation-visible, ac-pipeline-contract):
A user draws a box around a full table labeled "raw-data" and a second overlapping box around just the header row labeled "column-names." Both are independently visible (ac-annotation-visible) and appear as separate entries in the annotations array (ac-pipeline-contract).
