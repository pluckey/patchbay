---
feature: canvas-markdown-node
center: "A workspace where a person spatially arranges source material to compose the context an AI operates within."
stage: tasks
intensity: standard
loop_iterations: 1
last_modified: 2026-04-02T00:00:00Z
---

# Tasks: Canvas Markdown Node

### t-project-scaffold: Next.js 16 project setup with xyflow and react-markdown | Generate + verify
> **Center:** Creates the physical workspace structure where the spatial arrangement tool will be built
> **Traces:** ac-canvas-workspace, ac-node-creation, ac-node-content-editing, ac-rendered-markdown, ac-spatial-arrangement, ac-node-removal, ac-workspace-persistence, ac-canvas-navigability, ac-first-use-discoverability, ac-editing-in-context, ac-no-silent-data-loss
> **Depends:** (none)
> **Status:** complete

- **Implements**: (infrastructure)
- **Done when**: `npm run dev` starts without error; `@xyflow/react`, `react-markdown`, and `nanoid` are in dependencies; directory skeleton exists at `src/domain/entities/`, `src/domain/use-cases/`, `src/domain/ports/`, `src/adapters/storage/`, `src/adapters/canvas/`, `src/components/`, `src/hooks/`, `src/app/`

### t-domain-entities: WorkspaceNode and Workspace types with domain-owned Position and Viewport | Direct implementation
> **Center:** Defines what a piece of source material in spatial arrangement IS at the domain level
> **Traces:** ac-canvas-workspace, ac-spatial-arrangement
> **Depends:** t-project-scaffold
> **Status:** complete

- **Implements**: da-01, da-02
- **Done when**: `WorkspaceNode` exported from `src/domain/entities/workspace-node.ts` with fields `id: string`, `content: string`, `position: { x: number; y: number }`, `createdAt: number`, `updatedAt: number`; `Workspace` exported from `src/domain/entities/workspace.ts` with fields `nodes: WorkspaceNode[]`, `viewport: { x: number; y: number; zoom: number }`; `Position` and `Viewport` types domain-owned; barrel export from `src/domain/entities/index.ts`; zero runtime dependencies

### t-storage-port: StoragePort boundary interface | Direct implementation
> **Center:** Declares the contract between workspace logic and persistence — the domain never knows HOW data is stored
> **Traces:** ac-workspace-persistence
> **Depends:** t-domain-entities
> **Status:** complete

- **Implements**: da-09
- **Done when**: `StoragePort` interface exported from `src/domain/ports/storage-port.ts` declaring `load(): Workspace | null` and `save(workspace: Workspace): void`; references only domain types; no runtime dependencies

### t-node-crud-use-cases: createNode, updateNodeContent, moveNode, removeNode pure functions | TDD
> **Center:** Encodes the four primitive operations a person performs when arranging source material on the canvas
> **Traces:** ac-node-creation, ac-node-content-editing, ac-spatial-arrangement, ac-node-removal, ac-no-silent-data-loss
> **Depends:** t-domain-entities
> **Status:** complete

- **Implements**: da-03, da-04, da-05, da-06
- **Done when**: `createNode(position, content?) => WorkspaceNode` in `src/domain/use-cases/create-node.ts` generates unique id, sets timestamps; `updateNodeContent(nodes, nodeId, content) => WorkspaceNode[]` in `src/domain/use-cases/update-node-content.ts` returns new array with updated node and refreshed updatedAt; `moveNode(nodes, nodeId, position) => WorkspaceNode[]` in `src/domain/use-cases/move-node.ts` returns new array; `removeNode(nodes, nodeId) => WorkspaceNode[]` in `src/domain/use-cases/remove-node.ts` returns filtered array; all functions are pure; barrel export from `src/domain/use-cases/index.ts`

### t-persistence-use-cases: loadWorkspace and saveWorkspace functions | TDD
> **Center:** Ensures the spatial arrangement survives beyond a single session — persistence makes the workspace real
> **Traces:** ac-workspace-persistence, ac-no-silent-data-loss
> **Depends:** t-domain-entities, t-storage-port
> **Status:** complete

- **Implements**: da-07, da-08
- **Done when**: `loadWorkspace(storage: StoragePort) => Workspace` in `src/domain/use-cases/load-workspace.ts` returns stored workspace or default empty workspace; `saveWorkspace(storage: StoragePort, workspace: Workspace) => void` in `src/domain/use-cases/save-workspace.ts` delegates to storage.save(); unit tests pass with mock StoragePort; neither function imports any adapter

### t-local-storage-adapter: LocalStorageAdapter implementing StoragePort | TDD
> **Center:** Grounds the persistence boundary in the browser, making spatial arrangements durable without any server
> **Traces:** ac-workspace-persistence, ac-no-silent-data-loss
> **Depends:** t-storage-port
> **Status:** complete

- **Implements**: da-10
- **Done when**: `localStorageAdapter` object exported from `src/adapters/storage/local-storage-adapter.ts` satisfying StoragePort; uses key `"context-canvas:workspace"`; save() serializes with `version: 1` envelope; save() wrapped in try/catch logging errors on failure; load() parses JSON and returns `Workspace | null`; load() returns null on parse failure or missing key; round-trip test passes

### t-flow-node-mapper: FlowNodeMapper domain-to-xyflow adapter | TDD
> **Center:** Translates between the domain's spatial model and the rendering framework — neither side knows about the other
> **Traces:** ac-spatial-arrangement, ac-canvas-workspace
> **Depends:** t-domain-entities
> **Status:** complete

- **Implements**: da-11
- **Done when**: `toFlowNodes(nodes: WorkspaceNode[]) => Node[]` exported from `src/adapters/canvas/flow-node-mapper.ts` maps each WorkspaceNode to an xyflow Node with `type: "markdown"`, correct position, and data containing content and nodeId; `fromNodeDragStop(node) => { nodeId: string; position: Position }` extracts domain-relevant data; unit tests pass; xyflow types contained to this file

### t-markdown-node: MarkdownNode custom xyflow node component | Implementation + manual verify
> **Center:** The visual atom of the workspace — each card is one piece of source material placed to compose AI context
> **Traces:** ac-node-content-editing, ac-rendered-markdown, ac-node-removal, ac-editing-in-context
> **Depends:** t-project-scaffold
> **Status:** complete

- **Implements**: da-13
- **Done when**: MarkdownNode exported from `src/components/MarkdownNode.tsx`; view mode renders via react-markdown; edit mode renders textarea with auto-focus; double-click enters edit WITHOUT triggering xyflow drag (stopPropagation); Escape or blur exits edit and fires onChange; hover reveals delete button; delete calls window.confirm() before onDelete; registered as custom node type "markdown"; empty content shows placeholder text

### t-use-workspace-core: useWorkspace hook — state management and canvas binding | Implementation + manual verify
> **Center:** The bridge that lets spatial actions flow through domain logic and back to the visual canvas
> **Traces:** ac-node-creation, ac-node-content-editing, ac-spatial-arrangement, ac-node-removal
> **Depends:** t-node-crud-use-cases, t-flow-node-mapper
> **Status:** complete

- **Implements**: da-15 (state + canvas binding)
- **Done when**: useWorkspace hook exported from `src/hooks/use-workspace.ts`; maintains WorkspaceNode[] state; exposes flowNodes mapped via toFlowNodes; exposes handleCreate(position), handleContentChange(nodeId, content), handleDelete(nodeId) dispatching through use cases; exposes onNodeDragStop using fromNodeDragStop + moveNode; drag concession works (nodes don't snap back during drag)

### t-use-workspace-persistence: useWorkspace persistence, auto-save, and data safety | Implementation + manual verify
> **Center:** Guarantees the spatial arrangement is never silently lost — the workspace remembers
> **Traces:** ac-workspace-persistence, ac-no-silent-data-loss, ac-canvas-navigability
> **Depends:** t-use-workspace-core, t-persistence-use-cases, t-local-storage-adapter
> **Status:** complete

- **Implements**: da-15 (persistence)
- **Done when**: useWorkspace loads from storage on mount via loadWorkspace; auto-saves with 300ms trailing-edge debounce on state changes; beforeunload flushes pending save synchronously; fitView called after initial load (post-render, not before); workspace survives full page reload; save errors caught by adapter

### t-canvas-component: Canvas ReactFlow wrapper component | Implementation + manual verify
> **Center:** The infinite spatial surface where a person arranges source material to compose context
> **Traces:** ac-canvas-workspace, ac-canvas-navigability, ac-spatial-arrangement
> **Depends:** t-markdown-node, t-use-workspace-core
> **Status:** complete

- **Implements**: da-12
- **Done when**: Canvas exported from `src/components/Canvas.tsx` with 'use client'; wraps ReactFlow with `nodeTypes={{ markdown: MarkdownNode }}`; receives flowNodes and handlers from hook; pan and zoom work; background dots rendered; does not import from domain/ directly

### t-toolbar-and-page: Toolbar button and WorkspacePage composition | Implementation + manual verify
> **Center:** The entry point and affordance layer — makes the spatial workspace discoverable and usable from first visit
> **Traces:** ac-first-use-discoverability, ac-node-creation
> **Depends:** t-canvas-component, t-use-workspace-persistence
> **Status:** complete

- **Implements**: da-14, da-16
- **Done when**: Toolbar exported from `src/components/Toolbar.tsx` with floating "Add Node" button; button click calls handleCreate with viewport-center position; WorkspacePage at `src/app/page.tsx` composes Canvas + Toolbar inside ReactFlowProvider; empty workspace shows toolbar prominently; page accessible at root route /
