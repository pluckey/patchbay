---
feature: pdf-annotations
center: "This feature allows users to construct an interpretive layer over non-editable source material — marking regions and attaching meaning — so that their reading becomes a composable, pipeline-accessible input alongside the original content."
stage: design
intensity: standard
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

## System Decomposition

| ID | Atom | Type | Location | Action | Traces |
|---|---|---|---|---|---|
| da-01 | `PdfAnnotation` | entity | `kernel/entities/` | Create | ac-annotation-create, ac-annotation-persist, ac-pipeline-contract |
| da-02 | `PdfRegion` | entity | `kernel/entities/` | Create | ac-annotation-create, ac-annotation-visible |
| da-03 | `PdfTextItem` | entity | `kernel/entities/` | Create | ac-text-layer, ac-annotation-create |
| da-04 | `createAnnotation` | transform | `kernel/transforms/` | Create | ac-annotation-create |
| da-05 | `deleteAnnotation` | transform | `kernel/transforms/` | Create | ac-annotation-delete |
| da-06 | `extractRegionText` | transform | `kernel/transforms/` | Create | ac-annotation-create, ac-pipeline-contract |
| da-07 | `PdfNodeData.annotations` | entity mod | `kernel/entities/workspace-node.ts` | Modify | ac-annotation-persist |
| da-08 | `ResolvedPdfInput.annotations` | entity mod | `kernel/entities/resolved-input.ts` | Modify | ac-pipeline-contract |
| da-09 | `PdfRendererPort.getPageTextItems` | port ext | `client/domain/ports/pdf-renderer-port.ts` | Modify | ac-text-layer, ac-annotation-create |
| da-10 | `getPageTextItems` impl | adapter | `client/adapters/pdf/pdf-renderer.ts` | Modify | ac-text-layer, ac-annotation-create |
| da-12 | Pipeline annotation passthrough | use-case mod | `client/domain/use-cases/execute-pipeline.ts` | Modify | ac-pipeline-contract |
| da-13 | `PdfTextLayer` | component | `client/ui/components/PdfTextLayer.tsx` | Create | ac-text-layer |
| da-14 | `PdfAnnotationLayer` | component | `client/ui/components/PdfAnnotationLayer.tsx` | Create | ac-annotation-visible, ac-annotation-create, ac-annotation-delete |
| da-15 | `usePdfAnnotationDraw` | hook | `client/ui/hooks/use-pdf-annotation-draw.ts` | Create | ac-annotation-create, ac-interaction-speed |
| da-16 | `PdfAnnotationLabelInput` | component | `client/ui/components/PdfAnnotationLabelInput.tsx` | Create | ac-annotation-create |
| da-17 | `PdfContent` integration | component mod | `client/ui/components/PdfContent.tsx` | Modify | ac-text-layer, ac-annotation-visible, ac-annotation-create |
| da-18 | Coordinate conversion | utility | `client/ui/components/pdf-coord-utils.ts` | Create | ac-annotation-visible, ac-annotation-create |
| da-19 | `PdfFlowNodeData` additions | adapter mod | `client/adapters/canvas/flow-node-mapper.ts` | Modify | ac-annotation-persist |
| da-22 | Workspace annotation handlers | hook mod | `client/ui/hooks/use-workspace.ts` | Modify | ac-annotation-persist, ac-annotation-delete |
| da-24 | Storage migration v6 to v7 | adapter mod | `client/adapters/storage/` | Modify | ac-annotation-persist |

## Relationship Map

```
KERNEL (innermost)
  da-01 PdfAnnotation ←──── da-07 (added to PdfNodeData)
  da-02 PdfRegion     ←──── da-01 (field of PdfAnnotation)
  da-03 PdfTextItem   ←──── da-06 (input to extractRegionText)
  da-04 createAnnotation ── uses da-01, da-02
  da-05 deleteAnnotation ── filters da-01[]
  da-06 extractRegionText ─ uses da-03, da-02
  da-08 ResolvedPdfInput ── carries da-01 fields (minus id)

PORT LAYER
  da-09 getPageTextItems ── returns da-03[] (PdfTextItem)

ADAPTER LAYER
  da-10 ──implements──→ da-09 (port)
  da-19 ──threads──→ da-07 (annotations on PdfNodeData)
  da-24 ──migrates──→ da-07 (defaults annotations: [])

USE-CASE LAYER
  da-12 ──reads──→ da-07, ──writes──→ da-08

UI LAYER
  da-13 PdfTextLayer ──receives──→ da-03[] via da-17
  da-14 PdfAnnotationLayer ──receives──→ da-01[] via da-17
  da-14 ──uses──→ da-15 (draw hook), ──contains──→ da-16 (label input)
  da-17 PdfContent ──orchestrates──→ da-09, da-06, da-04
  da-18 ──used by──→ da-13, da-14 (coordinate conversion)

PLUMBING
  da-22 (use-workspace) ──defines──→ onAnnotationAdd, onAnnotationDelete callbacks
  da-19 ──threads callbacks through──→ flow-node-mapper
```

## Behavior Plan

1. **extractRegionText (da-06):** Center-point containment — text item is "in" region if its center falls within bounds. Items sorted by y descending then x ascending (reading order in PDF coords) before joining with spaces.

2. **getPageTextItems impl (da-10):** Convert pdf.js transform matrix `[a,b,c,d,e,f]` to PdfTextItem: `x=e, y=f, width=item.width, height=sqrt(a*a+b*b)`. Filter out TextMarkedContent.

3. **PdfTextLayer (da-13):** Absolutely positioned div matching canvas CSS dims. Each text item as `<span>` with `position: absolute`, positioned via `pdfToScreen()`. Text is `color: transparent` with `::selection` styled visible. `pointer-events: all` for native selection.

4. **PdfAnnotationLayer (da-14):** SVG overlay matching canvas CSS dims. Committed annotations as `<rect>` with semi-transparent fill + label. Drawing mode toggled by button. When active: pointerdown starts drag, pointermove updates pending rect, pointerup finalizes and opens label input. `stopPropagation` on pointer events to prevent xyflow panning.

5. **usePdfAnnotationDraw (da-15):** State machine: IDLE → DRAWING (pointerdown) → DRAWN (pointerup). Minimum 10px drag threshold. Returns pending region in screen coords; caller converts to PDF coords.

6. **Coordinate conversion (da-18):** `pdfToScreen(pdfX, pdfY, scale, pageHeight) => { x: pdfX*scale, y: (pageHeight-pdfY)*scale }`. `screenToPdf` inverts. Y-flip happens ONLY here.

7. **PdfContent orchestration (da-17):** On page change: fetch `getPageTextItems()`, store locally. Pass to text layer. `handleAnnotationCreate(region, label)` calls extractRegionText + createAnnotation, then delegates to workspace callback.

8. **Migration (da-24):** `if (version < 7)`: map PDF nodes to add `annotations: []`. Bump to 7.

## UI Plan

**Visual stack** (bottom to top within canvas host):
1. PDF canvas (existing)
2. Text layer (da-13) — transparent positioned text for native selection
3. Annotation overlay (da-14) — SVG with annotation rects + drawing surface

**New controls:**
- Annotate toggle button in PdfZoomBar — activates draw mode, cursor becomes crosshair
- Annotation rectangles — semi-transparent fill, 1px border, label displayed in text-xs
- Delete button (X) appears on annotation hover
- Label input popover (da-16) — anchored to drawn region, required label, Enter to confirm, Escape to cancel

**Mode switching:**
- Normal mode (default): text layer receives pointer events → native text selection
- Draw mode (toggled): annotation layer receives pointer events → bounding box drawing
- Annotations always visible in both modes, but pointer-events only when in draw mode

## Data Plan

**New entities** in `kernel/entities/pdf-annotation.ts`:
- `PdfRegion { x, y, width, height }` — PDF coordinate space (points, origin bottom-left)
- `PdfAnnotation { id, page, region: PdfRegion, label, text }` — user interpretation
- `PdfTextItem { str, x, y, width, height }` — positioned text from pdf.js

**Modified entities:**
- `PdfNodeData` gains `annotations: PdfAnnotation[]`
- `ResolvedPdfInput` gains `annotations: Array<{ label, page, region: PdfRegion, text }>` (no id)

**Migration:** v6 → v7, defaults `annotations: []` for all PDF nodes.

## Verification Strategy

| AC | Method | Key Assertion |
|---|---|---|
| ac-text-layer | Manual: select text, copy, verify clipboard content matches | `<span>` elements positioned over canvas, text selectable |
| ac-annotation-create | Unit: `extractRegionText` with known items + region. Integration: draw box, enter label, verify PdfNodeData.annotations | Annotation has page, region (PDF coords), label, text |
| ac-annotation-visible | Manual: create annotation, verify SVG rect. Change zoom, verify reposition. Navigate away and back. | Rect reprojects correctly, only shows on correct page |
| ac-annotation-delete | Unit: `deleteAnnotation` filters correctly. Integration: hover, click X, verify removal from state + display + pipeline | Immutable filter, persists across save |
| ac-pipeline-contract | Unit: `resolveSourceContent` with annotated PdfNodeData returns annotations array without id field | Transform can access `input.source.annotations[0].label` |
| ac-annotation-persist | Integration: create annotations, reload, verify restored. Migration: load v6 workspace, verify v7 with `annotations: []` | Survives save/load cycle |
| ac-interaction-speed (E) | Manual: time draw-label-confirm vs copy-paste workaround | Annotation flow < 5s vs workaround 15-30s |
