---
feature: markdown-node-tabs
center: "The markdown node uses explicit tab navigation to separate viewing from editing, replacing the hidden double-click interaction."
center_test:
  excludes: "Adding a rich text editor — changes the editing mechanism, not the navigation between modes"
  boundary: "Adding keyboard shortcuts to switch view/edit — relates to mode switching but the center is about visible tab navigation"
mode: express
analogues: []
---

## Acceptance Criteria

### ac-tab-navigation: Node displays View and Edit tabs
The markdown node shows two visible tabs — "View" and "Edit" — that the user can click to switch between rendered markdown and the editing textarea.

### ac-view-default: View tab is active by default
When a node is created or the page loads, the View tab is selected. The user sees rendered markdown (or placeholder text for empty nodes).

### ac-edit-tab-textarea: Edit tab shows the markdown textarea
Clicking the Edit tab reveals the textarea for editing markdown content. The textarea receives focus automatically.

### ac-remove-double-click: Double-click no longer toggles edit mode
The previous double-click-to-edit interaction is removed. Tab clicks are the only way to switch modes.

### ac-drag-preserved: Node remains draggable in both modes
Dragging the node by its header/tab area works in both View and Edit modes. Edit mode textarea still prevents drag (stopPropagation on pointer events).

## Tasks

### t-install-tabs: Install shadcn Tabs component
> **Traces:** ac-tab-navigation
> **Status:** complete

- **Done when**: `src/components/ui/tabs.tsx` exists

### t-refactor-markdown-node: Replace double-click toggle with shadcn Tabs
> **Traces:** ac-tab-navigation, ac-view-default, ac-edit-tab-textarea, ac-remove-double-click, ac-drag-preserved
> **Status:** complete

- **Done when**: MarkdownNode uses `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>` from shadcn; View tab shows rendered markdown; Edit tab shows textarea with auto-focus; double-click handler removed; drag still works; event isolation preserved in Edit mode
