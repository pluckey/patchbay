---
feature: pdf-annotations
center: "This feature allows users to construct an interpretive layer over non-editable source material — marking regions and attaching meaning — so that their reading becomes a composable, pipeline-accessible input alongside the original content."
stage: tasks
intensity: standard
execution_mode: parallel
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

### t-annotation-entities: Define PdfAnnotation, PdfRegion, and PdfTextItem types | kernel entity
> **Center:** Establishes the vocabulary — a region is a marked area, an annotation binds meaning to it, a text item is positioned content for extraction
> **Traces:** ac-annotation-create, ac-text-layer, ac-pipeline-contract
> **Depends:** (none)
> **Files:** `src/kernel/entities/pdf-annotation.ts`
> **Wave:** 1
> **Status:** complete

- **Implements**: da-01, da-02, da-03
- **Done when**: Three exported types — `PdfAnnotation { id, page, region: PdfRegion, label, text }`, `PdfRegion { x, y, width, height }` (PDF coordinate space, points), `PdfTextItem { str, x, y, width, height }` — with zero imports from outside kernel/entities

### t-pdf-node-annotations: Add annotations field to PdfNodeData | kernel entity mod
> **Center:** The source node now carries its interpretive layer as first-class state, flowing through the same persistence channels as all other node data
> **Traces:** ac-annotation-persist, ac-annotation-visible
> **Depends:** (none)
> **Files:** `src/kernel/entities/workspace-node.ts`
> **Wave:** 1
> **Status:** complete

- **Implements**: da-07
- **Done when**: `PdfNodeData` includes `annotations: PdfAnnotation[]`

### t-resolved-input-annotations: Add annotations field to ResolvedPdfInput | kernel entity mod
> **Center:** The pipeline's view of a PDF now includes the user's interpretive layer, making annotations composable inputs for transforms
> **Traces:** ac-pipeline-contract
> **Depends:** (none)
> **Files:** `src/kernel/entities/resolved-input.ts`
> **Wave:** 1
> **Status:** complete

- **Implements**: da-08
- **Done when**: `ResolvedPdfInput` includes `annotations: Array<{ label: string, page: number, region: PdfRegion, text: string }>` and existing consumers compile

### t-create-annotation-transform: createAnnotation pure transform | kernel transform
> **Center:** Pure function that appends a new annotation to a PDF node — the write path for marking meaning onto source material
> **Traces:** ac-annotation-create, ac-annotation-persist
> **Depends:** t-pdf-node-annotations
> **Files:** `src/kernel/transforms/create-annotation.ts`
> **Wave:** 2
> **Status:** complete

- **Implements**: da-04
- **Done when**: `createAnnotation(nodes, nodeId, annotation)` returns new WorkspaceNode[] with the annotation appended to target PDF node's annotations array; other nodes unchanged; updatedAt refreshed

### t-delete-annotation-transform: deleteAnnotation pure transform | kernel transform
> **Center:** Immutable filter on the annotations array is the mechanism for retracting meaning — without it, mistakes become permanent pipeline noise
> **Traces:** ac-annotation-delete, ac-annotation-persist
> **Depends:** t-pdf-node-annotations
> **Files:** `src/kernel/transforms/delete-annotation.ts`
> **Wave:** 2
> **Status:** complete

- **Implements**: da-05
- **Done when**: `deleteAnnotation(nodes, nodeId, annotationId)` returns new WorkspaceNode[] with the specified annotation filtered out

### t-extract-region-text: extractRegionText pure transform | kernel transform
> **Center:** Converts a drawn region into the text it covers — the bridge between spatial marking and semantic content
> **Traces:** ac-text-layer, ac-annotation-create
> **Depends:** t-annotation-entities
> **Files:** `src/kernel/transforms/extract-region-text.ts`
> **Wave:** 2
> **Status:** complete

- **Implements**: da-06
- **Done when**: `extractRegionText(textItems: PdfTextItem[], region: PdfRegion)` returns concatenated str values of items whose center point falls within the region; items sorted by y descending then x ascending (reading order in PDF coords)

### t-barrel-exports: Export new entities and transforms from barrel files | barrel
> **Center:** Makes the new vocabulary and operations discoverable through existing import paths
> **Traces:** ac-annotation-create, ac-text-layer, ac-pipeline-contract
> **Depends:** (none)
> **Files:** `src/kernel/entities/index.ts`, `src/kernel/transforms/index.ts`
> **Wave:** 2
> **Status:** complete

- **Implements**: (infrastructure)
- **Done when**: PdfAnnotation, PdfRegion, PdfTextItem exported from entities/index.ts; createAnnotation, deleteAnnotation, extractRegionText exported from transforms/index.ts

### t-port-text-items: Add getPageTextItems to PdfRendererPort | port extension
> **Center:** Defines the contract for extracting positioned text — the port bridging annotation geometry with actual PDF content
> **Traces:** ac-text-layer
> **Depends:** t-annotation-entities
> **Files:** `src/client/domain/ports/pdf-renderer-port.ts`
> **Wave:** 3
> **Status:** complete

- **Implements**: da-09
- **Done when**: PdfRendererPort includes `getPageTextItems(doc: PdfDocument, pageNum: number): Promise<PdfTextItem[]>`

### t-adapter-text-items: Implement getPageTextItems in pdf.js adapter | adapter impl
> **Center:** Grounds the text extraction contract in pdf.js — transforms raw TextContent into positioned, framework-free text items
> **Traces:** ac-text-layer, ac-interaction-speed
> **Depends:** (none)
> **Files:** `src/client/adapters/pdf/pdf-renderer.ts`
> **Wave:** 3
> **Status:** complete

- **Implements**: da-10
- **Done when**: `pdfRenderer.getPageTextItems` returns PdfTextItem[] with coordinates in PDF points (origin bottom-left); x=transform[4], y=transform[5], height=sqrt(a^2+b^2); filters out TextMarkedContent

### t-pipeline-passthrough: Pass annotations through in pipeline resolveSourceContent | use-case mod
> **Center:** The interpretive layer flows into the transform pipeline without transforms needing to re-fetch or reconstruct it
> **Traces:** ac-pipeline-contract
> **Depends:** t-pdf-node-annotations, t-resolved-input-annotations
> **Files:** `src/client/domain/use-cases/execute-pipeline.ts`
> **Wave:** 3
> **Status:** complete

- **Implements**: da-12
- **Done when**: resolveSourceContent for PDF nodes includes `annotations: (sourceNode.annotations ?? []).map(a => ({ label: a.label, page: a.page, region: a.region, text: a.text }))` in the returned ResolvedPdfInput (id stripped)

### t-storage-migration: Storage migration v6 to v7 — default annotations | migration
> **Center:** Existing workspaces upgrade seamlessly — the new field is present for all PDF nodes going forward
> **Traces:** ac-annotation-persist
> **Depends:** t-pdf-node-annotations
> **Files:** `src/client/adapters/storage/storage-envelope.ts`
> **Wave:** 3
> **Status:** complete

- **Implements**: da-24
- **Done when**: CURRENT_VERSION is 7; migration step adds `annotations: []` to every PDF node lacking the field; parseEnvelope correctly migrates v6 envelopes

### t-coord-utils: Coordinate conversion utility (pdfToScreen / screenToPdf) | utility
> **Center:** Single source of truth for mapping between screen space and document coordinate space — every overlay layer depends on this
> **Traces:** ac-annotation-create, ac-annotation-visible
> **Depends:** t-annotation-entities
> **Files:** `src/client/ui/components/pdf-coordinates.ts`
> **Wave:** 3
> **Status:** complete

- **Implements**: da-18
- **Done when**: `pdfToScreen(pdfRegion, scale, pageHeight)` returns screen rect; `screenToPdf(screenRect, scale, pageHeight)` returns PdfRegion; y-flip happens only here; both are pure functions

### t-flow-mapper-annotations: Add annotation data and callbacks to PdfFlowNodeData | adapter mod
> **Center:** Extends the flow mapper so annotation state and callbacks reach the PDF component through the proven prop-threading channel
> **Traces:** ac-annotation-create, ac-annotation-delete, ac-annotation-visible
> **Depends:** t-annotation-entities
> **Files:** `src/client/adapters/canvas/flow-node-mapper.ts`
> **Wave:** 4
> **Status:** complete

- **Implements**: da-19
- **Done when**: PdfFlowNodeData includes `annotations: PdfAnnotation[]`, `onAnnotationCreate: (nodeId, annotation) => void`, `onAnnotationDelete: (nodeId, annotationId) => void`; FlowCallbacks includes both; toFlowNodes PDF case passes them through

### t-workspace-annotation-handlers: Add handleAnnotationCreate and handleAnnotationDelete | hook mod
> **Center:** Wires annotation transforms into workspace state management, following the identical handler pattern used by all other node mutations
> **Traces:** ac-annotation-create, ac-annotation-delete, ac-annotation-persist
> **Depends:** t-create-annotation-transform, t-delete-annotation-transform
> **Files:** `src/client/ui/hooks/use-workspace.ts`
> **Wave:** 4
> **Status:** complete

- **Implements**: da-22
- **Done when**: useWorkspace returns `handleAnnotationCreate(nodeId, annotation)` and `handleAnnotationDelete(nodeId, annotationId)` that call respective transforms, update state, and scheduleSave

### t-thread-annotation-callbacks: Thread annotation callbacks through WorkspaceView and use-canvas-binding | plumbing
> **Center:** Completes the callback chain from workspace state management to the flow mapper
> **Traces:** ac-annotation-create, ac-annotation-delete
> **Depends:** (none)
> **Files:** `src/client/ui/components/WorkspaceView.tsx`, `src/client/adapters/canvas/use-canvas-binding.ts`
> **Wave:** 4
> **Status:** complete

- **Implements**: da-19 (threading)
- **Done when**: onAnnotationCreate and onAnnotationDelete passed from useWorkspace through WorkspaceView to useCanvasBinding into FlowCallbacks

### t-text-layer: PdfTextLayer component — transparent text overlay | component
> **Center:** Makes PDF text spatially addressable in the browser — invisible scaffolding for native text selection
> **Traces:** ac-text-layer
> **Depends:** t-adapter-text-items, t-coord-utils
> **Files:** `src/client/ui/components/PdfTextLayer.tsx`
> **Wave:** 5
> **Status:** complete

- **Implements**: da-13
- **Done when**: Component renders absolutely-positioned transparent spans for each PdfTextItem, correctly positioned via pdfToScreen; text is invisible but selectable via native browser selection

### t-annotation-layer: PdfAnnotationLayer component — SVG overlay | component
> **Center:** The visual manifestation of the interpretive layer — annotations become visible rectangles with labels, users draw new ones directly on the page
> **Traces:** ac-annotation-visible, ac-annotation-create, ac-annotation-delete
> **Depends:** t-annotation-entities, t-coord-utils
> **Files:** `src/client/ui/components/PdfAnnotationLayer.tsx`
> **Wave:** 5
> **Status:** complete

- **Implements**: da-14
- **Done when**: SVG overlay displays annotations as semi-transparent rects with labels; delete button on hover; renders preview rect during active drawing

### t-label-input: PdfAnnotationLabelInput component — inline label popover | component
> **Center:** The moment where spatial marking becomes semantic — the user names what they see
> **Traces:** ac-annotation-create
> **Depends:** (none)
> **Files:** `src/client/ui/components/PdfAnnotationLabelInput.tsx`
> **Wave:** 5
> **Status:** complete

- **Implements**: da-16
- **Done when**: Positioned input near drawn region; Enter confirms with label, Escape discards; required non-empty label

### t-draw-hook: usePdfAnnotationDraw hook — drawing state machine | hook
> **Center:** Encapsulates the draw-label-confirm interaction as a portable state machine
> **Traces:** ac-annotation-create, ac-interaction-speed
> **Depends:** t-coord-utils
> **Files:** `src/client/ui/hooks/use-pdf-annotation-draw.ts`
> **Wave:** 5
> **Status:** complete

- **Implements**: da-15
- **Done when**: Hook manages states idle|drawing|labeling; exposes handlers for pointer events, pending rect, label confirmation; minimum 10px drag threshold; uses refs during drawing to avoid re-renders

### t-zoom-bar-toggle: Add annotate mode toggle to PdfZoomBar | component mod
> **Center:** Discoverable entry point to switch from reading to annotation mode
> **Traces:** ac-annotation-create
> **Depends:** (none)
> **Files:** `src/client/ui/components/PdfZoomBar.tsx`
> **Wave:** 5
> **Status:** complete

- **Implements**: (UI affordance)
- **Done when**: PdfZoomBar accepts annotateMode + onToggleAnnotate props; renders toggle button with visual active state

### t-pdf-content-integration: Integrate annotation layers into PdfContent | integration
> **Center:** Orchestrates text extraction, annotation display, drawing, and label input into the existing PDF viewer
> **Traces:** ac-text-layer, ac-annotation-create, ac-annotation-visible, ac-annotation-delete, ac-interaction-speed
> **Depends:** t-thread-annotation-callbacks, t-text-layer, t-annotation-layer, t-label-input, t-draw-hook, t-zoom-bar-toggle
> **Files:** `src/client/ui/components/PdfContent.tsx`, `src/client/ui/components/PdfNode.tsx`
> **Wave:** 6
> **Status:** complete

- **Implements**: da-17, da-23
- **Done when**: PdfContent accepts annotations + callbacks; fetches PdfTextItem[] on page change; renders layer stack (canvas, text layer, annotation layer); wires draw hook to annotation layer; PdfNode passes new props from PdfFlowNodeData

## Execution Waves

| Wave | Tasks | Depends on waves | Shared file risks |
|------|-------|------------------|-------------------|
| 1 | t-annotation-entities, t-pdf-node-annotations, t-resolved-input-annotations | (none) | t-pdf-node-annotations depends on t-annotation-entities (same wave, sequence) |
| 2 | t-create-annotation-transform, t-delete-annotation-transform, t-extract-region-text, t-barrel-exports | 1 | index.ts barrels touched only by t-barrel-exports |
| 3 | t-port-text-items, t-adapter-text-items, t-pipeline-passthrough, t-storage-migration, t-coord-utils | 1, 2 | No shared files within wave |
| 4 | t-flow-mapper-annotations, t-workspace-annotation-handlers, t-thread-annotation-callbacks | 2, 3 | t-thread-annotation-callbacks depends on other wave-4 tasks |
| 5 | t-text-layer, t-annotation-layer, t-label-input, t-draw-hook, t-zoom-bar-toggle | 3, 4 | All new files except t-zoom-bar-toggle |
| 6 | t-pdf-content-integration | 4, 5 | PdfContent.tsx + PdfNode.tsx sole owner |
