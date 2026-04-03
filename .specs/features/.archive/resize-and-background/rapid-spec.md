---
feature: resize-and-background
center: "Canvas nodes can be resized by the user, and the canvas background follows Geist's visual language."
center_test:
  excludes: "Snapping nodes to a grid layout — changes arrangement behavior, not node sizing or background"
  boundary: "Auto-resizing nodes to fit content — related to size but the center is about user-controlled resize"
mode: express
analogues: []
---

## Acceptance Criteria

### ac-node-resizable: User can resize nodes by dragging handles
Nodes display resize handles on hover. Dragging a handle changes the node dimensions. Minimum size prevents collapsing to unusable dimensions.

### ac-resize-persists: Resized dimensions survive page reload
Node width and height are saved as part of workspace persistence and restored on load.

### ac-geist-background: Canvas background uses Geist-aligned styling
Background uses semantic color tokens (not hardcoded hex) for both light and dark mode, with subtle visual rhythm appropriate to Geist's minimal aesthetic.

## Tasks

### t-node-resize: Add NodeResizer to MarkdownNode and persist dimensions
> **Traces:** ac-node-resizable, ac-resize-persists
> **Status:** complete

- **Done when**: MarkdownNode includes `<NodeResizer>` from xyflow; resize handles appear on hover; min width 200px, min height 80px; node dimensions flow through `onNodesChange` (already wired); resized dimensions persist via existing workspace save (xyflow tracks width/height in node changes); `max-w-[400px]` constraint removed (user controls size now)

### t-geist-background: Restyle canvas background with Geist tokens
> **Traces:** ac-geist-background
> **Status:** complete

- **Done when**: Canvas background uses CSS custom properties from the shadcn/Geist token system instead of hardcoded hex values; light mode and dark mode both render a subtle, clean background; no hardcoded colors in globals.css for xyflow overrides
