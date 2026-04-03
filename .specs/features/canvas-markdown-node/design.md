---
feature: canvas-markdown-node
center: "A workspace where a person spatially arranges source material to compose the context an AI operates within."
stage: design
intensity: standard
loop_iterations: 1
last_modified: 2026-04-02T00:00:00Z
---

# Design: Canvas Markdown Node

## System Decomposition

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|----|------|------|--------|---------------|---------------|
| da-01 | WorkspaceNode | Entity | Create | `id: string`, `content: string`, `position: Position`, `createdAt: number`, `updatedAt: number` | ac-node-creation, ac-node-content-editing, ac-spatial-arrangement, ac-node-removal |
| da-02 | Workspace | Entity (type alias) | Create | `nodes: WorkspaceNode[]`, `viewport: Viewport` | ac-workspace-persistence, ac-canvas-navigability |
| da-03 | createNode | Use Case | Create | `(position: Position, content?: string) => WorkspaceNode` | ac-node-creation, ac-first-use-discoverability |
| da-04 | updateNodeContent | Use Case | Create | `(nodes: WorkspaceNode[], nodeId: string, content: string) => WorkspaceNode[]` | ac-node-content-editing, ac-no-silent-data-loss |
| da-05 | moveNode | Use Case | Create | `(nodes: WorkspaceNode[], nodeId: string, position: Position) => WorkspaceNode[]` | ac-spatial-arrangement, ac-no-silent-data-loss |
| da-06 | removeNode | Use Case | Create | `(nodes: WorkspaceNode[], nodeId: string) => WorkspaceNode[]` | ac-node-removal |
| da-07 | loadWorkspace | Use Case | Create | `(storage: StoragePort) => Workspace` | ac-workspace-persistence |
| da-08 | saveWorkspace | Use Case | Create | `(storage: StoragePort, workspace: Workspace) => void` | ac-workspace-persistence, ac-no-silent-data-loss |
| da-09 | StoragePort | Port | Create | `load(): Workspace \| null`, `save(workspace: Workspace): void` | ac-workspace-persistence |
| da-10 | LocalStorageAdapter | Adapter | Create | Implements StoragePort; key `context-canvas:workspace`; JSON serialization with version field | ac-workspace-persistence |
| da-11 | FlowNodeMapper | Adapter | Create | `toFlowNodes(nodes: WorkspaceNode[]): Node[]`, `fromNodeDragStop(event): {nodeId, position}` | ac-spatial-arrangement, ac-canvas-workspace |
| da-12 | Canvas | Component | Create | ReactFlow wrapper; registers custom node types; pan/zoom/fitView; `'use client'` | ac-canvas-workspace, ac-spatial-arrangement, ac-canvas-navigability |
| da-13 | MarkdownNode | Component | Create | Custom xyflow node; edit/view mode toggle; renders markdown; delete button on hover | ac-node-content-editing, ac-rendered-markdown, ac-editing-in-context, ac-node-removal |
| da-14 | Toolbar | Component | Create | Floating "Add Node" button; primary affordance for new users | ac-node-creation, ac-first-use-discoverability |
| da-15 | useWorkspace | Hook | Create | Manages WorkspaceNode[] state; bridges UI to domain use cases; debounced auto-save (300ms); beforeunload handler | ac-workspace-persistence, ac-no-silent-data-loss, ac-node-creation, ac-node-content-editing, ac-spatial-arrangement, ac-node-removal |
| da-16 | WorkspacePage | Page | Create | Next.js App Router page; composes Canvas + Toolbar; `'use client'` | ac-canvas-workspace |

## Relationship Map

```
                    ┌─────────────────────────────────┐
                    │         DOMAIN LAYER             │
                    │                                  │
                    │  da-01 WorkspaceNode  (entity)   │
                    │         ^                        │
                    │  da-02 Workspace  (type alias)   │──references──> da-01
                    │         ^                        │
                    │  da-09 StoragePort  (interface)  │──references──> da-02
                    │         ^                        │
                    │  da-03 createNode  ──────────────│──> da-01
                    │  da-04 updateNodeContent  ───────│──> da-01, da-02
                    │  da-05 moveNode  ────────────────│──> da-01, da-02
                    │  da-06 removeNode  ──────────────│──> da-01, da-02
                    │  da-07 loadWorkspace  ───────────│──> da-02, da-09
                    │  da-08 saveWorkspace  ───────────│──> da-02, da-09
                    └──────────────▲───────────────────┘
                                   │ (dependencies point inward)
                    ┌──────────────┴───────────────────┐
                    │        ADAPTER LAYER              │
                    │                                   │
                    │  da-10 LocalStorageAdapter  ──────│──implements──> da-09
                    │  da-11 FlowNodeMapper  ───────────│──references──> da-01
                    └──────────────▲────────────────────┘
                                   │
                    ┌──────────────┴────────────────────┐
                    │       UI / FRAMEWORK LAYER         │
                    │                                    │
                    │  da-15 useWorkspace  ──────────────│──calls──> da-03..da-08
                    │         │                          │──wires──> da-10
                    │         v                          │
                    │  da-12 Canvas  ────────────────────│──uses──> da-15, da-11
                    │    ├── da-13 MarkdownNode          │  (registered as custom node type)
                    │    └── (xyflow ReactFlow)          │
                    │  da-14 Toolbar  ──────────────────│──callbacks from──> da-15
                    │         │                          │
                    │  da-16 WorkspacePage  ────────────│──composes──> da-12, da-14
                    └───────────────────────────────────┘
```

Xyflow containment: xyflow types imported in exactly two files — da-11 (FlowNodeMapper) and da-12 (Canvas). Replace xyflow, rewrite these two files and nothing else.

## Behavior Plan

| # | Behavior | How it Works | Traces to |
|---|----------|-------------|-----------|
| 1 | Node creation with viewport-center positioning | UI reads current viewport center from xyflow; passes position to `createNode` use case | ac-node-creation, ac-first-use-discoverability |
| 2 | Inline edit/view toggle | MarkdownNode holds local `isEditing` state; double-click enters edit (textarea); Escape or blur exits to rendered markdown view | ac-node-content-editing, ac-rendered-markdown, ac-editing-in-context |
| 3 | Debounced auto-save + beforeunload | useWorkspace debounces `saveWorkspace` at 300ms after any mutation; registers synchronous `beforeunload` handler | ac-workspace-persistence, ac-no-silent-data-loss |
| 4 | Delete confirmation | UI gates `removeNode` behind `window.confirm()` | ac-node-removal, ac-no-silent-data-loss |
| 5 | Controlled xyflow with drag concession | Domain state is source of truth; mapped to xyflow Nodes via FlowNodeMapper; during drag, xyflow manages transient position; `onNodeDragStop` commits to domain via `moveNode` | ac-spatial-arrangement, ac-no-silent-data-loss |
| 6 | Load with fitView fallback | On load, `loadWorkspace` retrieves persisted state; if viewport exists, restore it; if not, call xyflow `fitView()` | ac-workspace-persistence, ac-canvas-navigability |

## UI Plan

Full-viewport canvas — the workspace IS the application. Minimal chrome.

- **Canvas background**: Fills the browser window. Subtle dot grid. Pan by dragging background. Zoom with scroll wheel.
- **Floating toolbar**: Top-left corner, single "Add Node" button. Primary affordance for first-time users.
- **Markdown nodes**: Cards with subtle border. View mode: rendered markdown. Edit mode: textarea replacing rendered content, canvas still visible around it.
- **Node interactions**: Double-click to edit. Escape/click-away to save and return to view. Hover reveals X button for deletion. Drag to reposition.
- **Navigation at scale**: Pan/zoom handles 20+ nodes. `fitView()` on initial load.
- **No modals, no sidebar, no settings page.**

## Data Plan

### Domain Schema

```typescript
type Position = { x: number; y: number }

type WorkspaceNode = {
  id: string            // nanoid
  content: string       // Raw markdown
  position: Position
  createdAt: number     // Epoch ms
  updatedAt: number     // Epoch ms
}

type Viewport = { x: number; y: number; zoom: number }

type Workspace = {
  nodes: WorkspaceNode[]
  viewport: Viewport
}
```

### Persistence Format (localStorage)

- Key: `context-canvas:workspace`
- Value: `JSON.stringify({ version: 1, nodes: [...], viewport: {...} })`
- Version field enables future schema migrations
- On load: `JSON.parse`, validate shape, fallback to empty workspace
- Save trigger: debounced 300ms after any mutation + synchronous `beforeunload`
- Immutability constraint: all use case functions return NEW object references

## Verification Strategy

| AC ID | Verification Method |
|-------|-------------------|
| ac-canvas-workspace | Manual: page loads, ReactFlow canvas renders with grid background |
| ac-node-creation | Unit test: `createNode()` returns valid WorkspaceNode. Manual: click Add Node, node appears |
| ac-node-content-editing | Unit test: `updateNodeContent()` returns new array with updated content. Manual: double-click, type, blur |
| ac-rendered-markdown | Manual: enter `# Hello` and `**bold**`, exit edit mode, verify rendering |
| ac-spatial-arrangement | Unit test: `moveNode()` returns new array with updated position. Manual: drag and verify persistence |
| ac-node-removal | Unit test: `removeNode()` returns filtered array. Manual: hover, click X, confirm, verify removal |
| ac-workspace-persistence | Integration test: save/load roundtrip. Manual: create nodes, close tab, reopen |
| ac-canvas-navigability | Manual: 20+ nodes spread across canvas, pan/zoom reaches all |
| ac-first-use-discoverability | Manual: clear storage, load page, verify Add Node is obvious |
| ac-editing-in-context | Manual: edit a node, verify other nodes visible around it |
| ac-no-silent-data-loss | Integration test: rapid mutations persist. Manual: beforeunload saves, delete confirms |
