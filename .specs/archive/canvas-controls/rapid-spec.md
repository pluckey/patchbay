---
feature: canvas-controls
center: "Users can create and remove any element on the canvas through direct interaction — no element should be stranded or undeletable."
center_test:
  excludes: "Undo/redo system — addresses reversibility, not direct creation and deletion"
  boundary: "Keyboard shortcuts for node operations — improves efficiency but the base creation/deletion interactions must exist first"
archetypes: [surface-redesign]
mode: express
analogues: []
---

## Acceptance Criteria

### ac-edge-deletion: User can select an edge and delete it with Backspace
Click an edge to select it. Press Backspace to remove it. The edge is removed from domain state. Connected nodes remain. Pipeline re-executes.

### ac-toolbar-transform: Toolbar has a "+ Transform" button
Creates a standalone transform node at viewport center. User wires it manually.

## Tasks

### t-edge-deletion: Re-enable edge selection and Backspace deletion
> **Traces:** ac-edge-deletion
> **Status:** pending

- Set `deleteKeyCode="Backspace"` in Canvas.tsx
- Add `onEdgesChange` handler to `use-canvas-binding` that routes `remove` type changes to `onRemoveConnection`
- Ignore non-remove edge changes (selection is transient, doesn't need domain sync)
- Pass `onEdgesChange` through Canvas props

### t-toolbar-transform: Add "+ Transform" button to toolbar
> **Traces:** ac-toolbar-transform
> **Status:** pending

- Add `onAddTransform` prop to Toolbar, render a button
- Wire in WorkspaceView: `createAtCenter(handleAddTransformNode)`
- Add `handleAddTransformNode` to useWorkspace (calls `createTransformNode`)

### t-verify: Build + manual test
> **Traces:** ac-edge-deletion, ac-toolbar-transform
> **Status:** pending

- `npx tsc --noEmit` and `npm run build` pass
- Manual: click edge, press Backspace, edge gone. Click "+ Transform", node appears.
