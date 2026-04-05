---
feature: semantic-synthesizer
center: "This feature makes connection the primary creative act, so that what each element IS emerges from how it's composed rather than being declared in advance."
stage: tasks
intensity: deep
last_modified: 2026-04-05T00:00:00Z
---

# Semantic Synthesizer — Task List

## Expert Roundtable

### Panel

- **Robert C. Martin (Uncle Bob)** — Author of *Clean Architecture*, SOLID principles, Agile Manifesto co-author. Drove the inside-out build order, entity-first decomposition, and the decision to integrate the nodes-to-cells rename per-layer rather than as a separate mechanical pass.

- **Martin Fowler** — Chief Scientist at ThoughtWorks, author of *Refactoring* and *Patterns of Enterprise Application Architecture*. Identified the Strangler Fig migration pattern (legacy-v10 types preserved for migration only), the Parallel Change strategy for the storage envelope, and the API route surface that would otherwise be missed.

- **John Carmack** — Co-founder of id Software, CTO of Oculus VR. Sized every task, flagged CellScope as the disproportionate risk (60% of UI time), advocated writing new files alongside old ones rather than in-place modification, and insisted the migration be tested with real workspace files.

- **Rich Hickey** — Creator of Clojure and Datomic, known for "Simple Made Easy." Challenged the `StageResult.output: unknown` widening as a sleeper trap, flagged `result?` co-location on PipelineStage as mixing information with mechanism, and argued the nodes-to-cells rename is incidental complexity with zero semantic gain (overruled by design spec).

### Key Decisions

1. **nodes-to-cells rename**: Integrated per-layer as each layer is rewritten. No separate rename pass. The rename IS the migration at each layer.

2. **flow-node-mapper**: Written as a NEW file (`cell-flow-node-mapper.ts`) alongside the old one. Old file deleted in cleanup wave. Rationale: 325 lines with 5 type-specific branches cannot be incrementally refactored into a 1-type generic mapper.

3. **use-workspace.ts**: Rewritten in-place (complete replacement). The old hook has 30+ type-specific handlers; the new hook has ~10 generic cell handlers. Net simplification.

4. **Legacy types**: Current `WorkspaceNode` types preserved in `legacy-v10.ts` for migration function only. Not exported from barrel. Strangler Fig pattern.

5. **Storage envelope**: v1-v9 migrations remain loosely typed (they work on raw JSON shapes). The v10-to-v11 step is the typed boundary. `StorageEnvelope` type changes to `cells: Cell[]`.

6. **Old code deletion**: Final wave only. Old components and transforms serve as reference during development.

### Risk Assessment

1. **CellScope UI** (Wave 6) — The most complex new code. Pipeline editing, stage configuration, input/output panels. 500+ lines of new interactive UI. Split into 4 tasks.

2. **executePipeline rewrite** (Wave 3) — Async sequential fold with per-stage dispatch, partial results, error halt, and `onStageComplete` callback. Current pipeline execution has none of this complexity.

3. **migrateV10ToV11** (Wave 2) — Data loss risk. If migration has a bug, existing users lose workspace data on first load. Must be tested with real v10 workspace files.

4. **StageResult.output: unknown** — Widening from `string` to `unknown` creates type errors in every consumer. Each downstream task must add type guards or assertions.

5. **merge-workspace.ts** — Server-side merge references `nodes` field name. If missed, saves silently lose data. Small fix, catastrophic if forgotten.

---

## Tasks

### t-cell-entities: Define Cell, SignalCell, SynthesizerCell, PipelineStage, StageResult, PdfSource, HealthStatus entities and update Workspace | kernel entity creation
> **Center:** Establishes the two-primitive foundation (Signal + Synthesizer) that makes identity emerge from composition rather than type declaration.
> **Traces:** ac-two-primitives, ac-signal-as-source, ac-synthesizer-as-effect, ac-pipeline-stage-types, ac-stage-handoff, ac-health-indicator, ac-migration-from-existing, ac-cycle-support
> **Depends:** (none)
> **Files:**
> - `src/kernel/entities/cell.ts` (create) — Cell, SignalCell, SynthesizerCell, BaseCell
> - `src/kernel/entities/pipeline-stage.ts` (create) — PipelineStage, ChatStage, CodeStage, AiStage
> - `src/kernel/entities/stage-result.ts` (create) — StageResult (replaces TransformResult with output:unknown)
> - `src/kernel/entities/pdf-source.ts` (create) — PdfSource
> - `src/kernel/entities/health-status.ts` (create) — HealthStatus
> - `src/kernel/entities/legacy-v10.ts` (create) — copy of current WorkspaceNode types for migration
> - `src/kernel/entities/workspace.ts` (modify) — cells:Cell[] replaces nodes:WorkspaceNode[]
> - `src/kernel/entities/index.ts` (modify) — export new types, keep Connection, remove WorkspaceNode exports
> **Wave:** 1
> **Status:** pending

- **Implements**: da-e01, da-e02, da-e03, da-e04, da-e05, da-e06, da-e07, da-e08, da-e09, da-e10, da-e11, da-e12
- **Done when**: `Cell`, `SignalCell`, `SynthesizerCell`, `PipelineStage`, `ChatStage`, `CodeStage`, `AiStage`, `StageResult`, `PdfSource`, `HealthStatus` are exported from `kernel/entities/index.ts`. `Workspace.cells` is typed as `Cell[]`. `WorkspaceNode` is NOT exported from barrel (only from `legacy-v10.ts`). `Connection` entity preserved unchanged. `StageResult.output` is typed as `unknown`.

---

### t-cell-transforms-new: Create all new cell transforms (signal, synthesizer, operations, derived) | kernel transform creation
> **Center:** Pure functions that create and manipulate cells give the system its compositional vocabulary — createSignalCell and createSynthesizerCell are the only two creation acts; everything else is connection-driven.
> **Traces:** ac-signal-as-source, ac-synthesizer-as-effect, ac-pipeline-stage-types, ac-pipeline-subordination, ac-input-ordering, ac-health-indicator, ac-terminal-identification, ac-title-labels, ac-stage-handoff, ac-error-halt, ac-compact-display
> **Depends:** t-cell-entities
> **Files:**
> - `src/kernel/transforms/create-signal-cell.ts` (create)
> - `src/kernel/transforms/create-synthesizer-cell.ts` (create)
> - `src/kernel/transforms/add-stage.ts` (create)
> - `src/kernel/transforms/remove-stage.ts` (create)
> - `src/kernel/transforms/reorder-stages.ts` (create)
> - `src/kernel/transforms/update-stage-config.ts` (create)
> - `src/kernel/transforms/update-input-order.ts` (create)
> - `src/kernel/transforms/update-cell-title.ts` (create)
> - `src/kernel/transforms/update-cell-content.ts` (create)
> - `src/kernel/transforms/compute-health.ts` (create)
> - `src/kernel/transforms/find-terminal-cells.ts` (create)
> - `src/kernel/transforms/resolve-inputs.ts` (create)
> - `src/kernel/transforms/move-cell.ts` (create — renamed from move-node)
> - `src/kernel/transforms/remove-cell.ts` (create — renamed from remove-node)
> - `src/kernel/transforms/resize-cell.ts` (create — renamed from resize-node)
> - `src/kernel/transforms/duplicate-cell.ts` (create — renamed from duplicate-node)
> - `src/kernel/transforms/validate-connection.ts` (modify — reject signal targets)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-t01, da-t02, da-t03, da-t04, da-t05, da-t06, da-t07, da-t08, da-t09, da-t11, da-t12, da-t13, da-t14, da-t15, da-t16, da-t19, da-t20
- **Done when**: All listed transform files exist with pure functions that take Cell/Cell[] and return new Cell/Cell[]. `moveCell`, `removeCell`, `resizeCell`, `duplicateCell` operate on `Cell[]` (not `WorkspaceNode[]`). `validateConnection` rejects connections where target is a SignalCell. `computeHealth` returns HealthStatus. `resolveInputs` returns `Record<string, unknown>` ordered by `inputOrder`. `findTerminalCells` returns cells with no outgoing connections.

---

### t-migrate-v10-v11: Create v10-to-v11 migration transform | kernel transform creation
> **Center:** Preserves every existing connection and its meaning when transitioning from five declared types to two compositional types — honoring past creative acts of connection.
> **Traces:** ac-migration-from-existing
> **Depends:** t-cell-entities
> **Files:**
> - `src/kernel/transforms/migrate-v10-to-v11.ts` (create)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-t10
- **Done when**: `migrateV10ToV11` is a pure function that takes a v10 workspace shape (using types from `legacy-v10.ts`) and returns a v11 `Workspace` with `cells: Cell[]`. Mapping: MarkdownNode to SignalCell, PdfNode to SignalCell with PdfSource, TransformNode to SynthesizerCell with CodeStage, ChatNode to SynthesizerCell with ChatStage (messages dropped), AiTransformNode to SynthesizerCell with AiStage. `inputOrder` populated from connections sorted by `createdAt`. All `id`, `position`, `dimensions`, `createdAt`, `updatedAt` fields preserved.

---

### t-transforms-barrel: Update kernel transforms barrel with new exports, preserve connection transforms | barrel update
> **Center:** The barrel is the public API of the kernel transform layer — it defines what compositional operations are available to the system.
> **Traces:** ac-two-primitives
> **Depends:** t-cell-transforms-new, t-migrate-v10-v11
> **Files:**
> - `src/kernel/transforms/index.ts` (modify — add new exports, keep createConnection, removeConnection, updateConnectionLabel, removeNodeConnections; mark old node-specific exports for removal in cleanup)
> **Wave:** 3
> **Status:** pending

- **Implements**: (barrel integration for da-t01 through da-t20)
- **Done when**: All new transforms are exported from barrel. `createConnection`, `removeConnection`, `removeNodeConnections`, `updateConnectionLabel` remain exported (da-t17, da-t18). Old node-specific transforms (createNode, createPdfNode, createTransformNode, etc.) are still exported temporarily to avoid breaking downstream code until cleanup wave. TypeScript compiles without errors in `kernel/transforms/`.

---

### t-storage-envelope-v11: Upgrade storage envelope to version 11 with v10-to-v11 migration | storage adapter modification
> **Center:** The storage layer transparently converts the old five-type format to the two-primitive format, so the compositional model is the only model the application sees.
> **Traces:** ac-migration-from-existing
> **Depends:** t-cell-entities, t-migrate-v10-v11
> **Files:**
> - `src/client/adapters/storage/storage-envelope.ts` (modify — bump CURRENT_VERSION to 11, add v10-to-v11 migration step, change StorageEnvelope type from nodes:WorkspaceNode[] to cells:Cell[], update toWorkspace/toEnvelope for cells field)
> **Wave:** 3
> **Status:** pending

- **Implements**: da-a03
- **Done when**: `CURRENT_VERSION` is 11. `StorageEnvelope` has `cells: Cell[]` instead of `nodes: WorkspaceNode[]`. `migrate()` chain runs v1-v10 as before (loosely typed), then applies `migrateV10ToV11` for v10-to-v11 step. `toWorkspace` returns `Workspace` with `cells`. `toEnvelope` serializes `cells`. `parseEnvelope` correctly upgrades v10 data to v11. Old v1-v9 migrations remain functional.

---

### t-server-storage-update: Update server-side merge and storage for cells field | server modification
> **Center:** The server's merge logic preserves externally-written cells and connections, ensuring compositional changes from external agents survive round-trips.
> **Traces:** ac-migration-from-existing
> **Depends:** t-cell-entities
> **Files:**
> - `src/server/storage/merge-workspace.ts` (modify — `nodes` field name to `cells` in WorkspaceData type)
> - `src/server/storage/migrate-to-multi-workspace.ts` (modify — if it references `nodes` field)
> **Wave:** 3
> **Status:** pending

- **Implements**: (server infrastructure supporting da-e12)
- **Done when**: `mergeWorkspace` in `merge-workspace.ts` merges on `cells` field instead of `nodes`. `connections` field unchanged. API routes (`src/app/api/workspaces/[id]/route.ts`) continue to function (they are JSON-pass-through and type-agnostic). Multi-workspace migration handles legacy format correctly.

---

### t-execute-pipeline: Create executePipeline use case with stage-type dispatch | use case creation
> **Center:** The pipeline executor is where connection-delivered inputs become outputs — it folds over stages, threading each output as the next input, making the composition chain produce its result.
> **Traces:** ac-synthesizer-as-effect, ac-stage-handoff, ac-error-halt, ac-pipeline-subordination, ac-pipeline-stage-types
> **Depends:** t-cell-entities, t-cell-transforms-new
> **Files:**
> - `src/client/domain/use-cases/execute-pipeline-cell.ts` (create — new use case for Cell-based pipeline)
> **Wave:** 3
> **Status:** pending

- **Implements**: da-u01
- **Done when**: `executePipeline(cell, inputs, ports, onStageComplete?)` is a function that: (1) takes a SynthesizerCell, resolved inputs as `Record<string, unknown>`, and port references (ChatPort, TransformExecutorPort, AiExecutorPort); (2) folds over `cell.pipeline` stages sequentially — first stage receives resolved inputs, each subsequent stage receives previous output; (3) dispatches ChatStage to ChatPort (collecting AsyncIterable into string), CodeStage to TransformExecutorPort, AiStage to AiExecutorPort; (4) halts on error (returns cell with error StageResult on failing stage, subsequent stages untouched); (5) calls `onStageComplete` between stages for UI progress; (6) returns updated SynthesizerCell with StageResult on each executed stage and `lastExecutedAt` set.

---

### t-cell-flow-mapper: Create new cell-based flow-node-mapper | canvas adapter creation
> **Center:** The mapper collapses five type-specific FlowNodeData types into one CellFlowNodeData, so the canvas renders cells as compositional participants (title, health, output preview, ports) rather than as categorical types.
> **Traces:** ac-compact-display, ac-health-indicator, ac-error-visibility, ac-title-labels
> **Depends:** t-cell-entities, t-cell-transforms-new
> **Files:**
> - `src/client/adapters/canvas/cell-flow-node-mapper.ts` (create — new file alongside old flow-node-mapper.ts)
> **Wave:** 4
> **Status:** pending

- **Implements**: da-a01
- **Done when**: `CellFlowNodeData` type has: cellId, cellType, title, healthStatus, outputPreview (truncated string), hasInputs (boolean), callbacks (onDelete, onDuplicate, onResizeEnd, onOpenScope, onTitleChange). `toFlowNodes(cells, connections)` maps Cell[] to xyflow Node[] with type `"cellNode"`. `toFlowEdges` preserved from old mapper or simplified. `fromNodeDragStop` preserved. No switch on cell type in the mapper — all cells produce the same FlowNodeData shape. Uses `computeHealth` and `resolveInputs` from kernel transforms to derive display data.

---

### t-use-persistence-cells: Update workspace persistence hook for Cell types | hook modification
> **Center:** Persistence operates on cells, not nodes — the two-primitive model is the only model the persistence layer knows.
> **Traces:** ac-migration-from-existing
> **Depends:** t-cell-entities, t-storage-envelope-v11
> **Files:**
> - `src/client/ui/hooks/use-workspace-persistence.ts` (modify — WorkspaceNode[] to Cell[], nodes/setNodes to cells/setCells, nodesRef to cellsRef)
> **Wave:** 4
> **Status:** pending

- **Implements**: da-h01
- **Done when**: All state variables use `Cell[]` instead of `WorkspaceNode[]`. Exported names: `cells`, `setCells`, `cellsRef` (replacing `nodes`, `setNodes`, `nodesRef`). `connections` and `connectionsRef` unchanged. Poll mechanism absorbs external cells (not nodes). `scheduleSave` and `beforeunload` flush use Cell-based workspace.

---

### t-use-cell-scope: Create use-cell-scope hook for scope open/close and panel data | hook creation
> **Center:** The Scope hook manages the spatial extension of a cell from canvas to editing surface, maintaining context so the user stays connected to the canvas while configuring.
> **Traces:** ac-stable-scope-layout, ac-scope-as-extension
> **Depends:** t-cell-entities
> **Files:**
> - `src/client/ui/hooks/use-cell-scope.ts` (create)
> **Wave:** 4
> **Status:** pending

- **Implements**: da-h03
- **Done when**: `useCellScope()` returns: `openCellId: string | null`, `openScope(cellId)`, `closeScope()`, `scopeData: { cell: Cell, inputs: Record<string, unknown>, connections: Connection[] } | null`. When `openCellId` is set, `scopeData` is computed from current cells and connections. Changing connections while scope is open updates `scopeData` reactively. Closing scope returns focus to canvas.

---

### t-use-mix-view: Create use-mix-view hook for terminal cell aggregation | hook creation
> **Center:** The Mix view is the compositional payoff — it aggregates all terminal cell outputs into a single view that shows what the entire connection graph produced.
> **Traces:** ac-mix-view, ac-terminal-identification
> **Depends:** t-cell-entities, t-cell-transforms-new
> **Files:**
> - `src/client/ui/hooks/use-mix-view.ts` (create)
> **Wave:** 4
> **Status:** pending

- **Implements**: da-h04
- **Done when**: `useMixView(cells, connections)` returns: `terminalCells: Cell[]` (cells with no outgoing connections, computed via `findTerminalCells`), `isOpen: boolean`, `openMixView()`, `closeMixView()`. Terminal cells recompute when connections change. Mix view content is derived from terminal cell outputs (last stage result for SynthesizerCell, content for SignalCell).

---

### t-use-workspace-cells: Rewrite workspace hook for Cell operations | hook rewrite
> **Center:** The workspace hook provides the compositional operations — create signal, create synthesizer, connect, disconnect — keeping the cell's identity emergent from these actions rather than from configuration menus.
> **Traces:** ac-two-primitives, ac-signal-as-source, ac-synthesizer-as-effect, ac-connection-changes-output, ac-canvas-primacy, ac-title-labels
> **Depends:** t-cell-transforms-new, t-transforms-barrel, t-use-persistence-cells
> **Files:**
> - `src/client/ui/hooks/use-workspace.ts` (modify — complete rewrite)
> **Wave:** 5
> **Status:** pending

- **Implements**: (hook integration for da-t01 through da-t20, consumer of da-h01)
- **Done when**: Hook uses `cells`/`setCells` from persistence (not `nodes`/`setNodes`). Handlers: `handleCreateSignalCell`, `handleCreateSynthesizerCell`, `handleDelete`, `handleDuplicate`, `handleMove`, `handleResize`, `handleUpdateTitle`, `handleUpdateContent`, `handleCreateConnection`, `handleRemoveConnection`, `handleUpdateConnectionLabel`, `handleUploadPdf`. No type-specific handlers (no handleTransformCodeChange, handleAddChatNode, etc.). All handlers use Cell-based transforms. `scheduleSave` called after every mutation. Returns `cells`, `connections`, `initialViewport`, `isLoaded`, all handlers, `roster`.

---

### t-use-pipeline-cells: Rewrite pipeline execution hook for Cell-based execution | hook rewrite
> **Center:** Auto-execution on connection change is the most direct expression of "connection changes output" — drawing a wire triggers the pipeline, making composition immediately productive.
> **Traces:** ac-connection-changes-output, ac-synthesizer-as-effect, ac-stage-handoff, ac-error-halt
> **Depends:** t-execute-pipeline, t-use-persistence-cells
> **Files:**
> - `src/client/ui/hooks/use-pipeline-execution.ts` (modify — complete rewrite for Cell types)
> **Wave:** 5
> **Status:** pending

- **Implements**: da-h02
- **Done when**: Hook takes `cells: Cell[]`, `connections: Connection[]`, and port dependencies. Auto-executes all SynthesizerCells with connections when cells or connections change (debounced). Uses `resolveInputs` to gather inputs, calls `executePipeline` use case, updates cell state with StageResult via `onStageComplete`. Provides `executeCell(cellId)` for manual re-execution. Returns execution state (which cells are running). Previous `pipelineResults: Map` pattern replaced by StageResult on the cells themselves.

---

### t-cell-canvas-binding: Rewrite canvas binding for Cell types | canvas adapter rewrite
> **Center:** The binding wires Cell data through the canvas adapter, ensuring every cell appears as a compositional participant with uniform display — title, health, output preview, ports.
> **Traces:** ac-compact-display, ac-canvas-primacy
> **Depends:** t-cell-flow-mapper, t-use-workspace-cells, t-use-pipeline-cells
> **Files:**
> - `src/client/adapters/canvas/use-canvas-binding.ts` (modify — complete rewrite for Cell types)
> **Wave:** 6
> **Status:** pending

- **Implements**: da-a02
- **Done when**: `useCanvasBinding` takes Cell-based args: `cells`, `connections`, and ~10 callbacks (not ~30). Uses `cell-flow-node-mapper.ts` (not old `flow-node-mapper.ts`). Produces `flowNodes`, `flowEdges`, `onNodesChange`, `onEdgesChange`, `onNodeDragStop`, `onConnect`, `createAtCenter`. Callback count reduced from ~30 to ~10 (onDelete, onDuplicate, onMove, onResize, onOpenScope, onTitleChange, onCreateConnection, onRemoveConnection, onUpdateConnectionLabel).

---

### t-cell-node-component: Create CellNode, HealthDot, and ConnectionEdge components | component creation
> **Center:** CellNode shows what emerged from composition (output preview, health) rather than what was declared (type, configuration) — making the canvas a surface of compositional results.
> **Traces:** ac-compact-display, ac-health-indicator, ac-error-visibility, ac-title-labels, ac-connection-presence
> **Depends:** t-cell-entities
> **Files:**
> - `src/client/ui/components/CellNode.tsx` (create)
> - `src/client/ui/components/HealthDot.tsx` (create)
> - `src/client/ui/components/ConnectionEdge.tsx` (create)
> **Wave:** 6
> **Status:** pending

- **Implements**: da-c01, da-c09, da-c11
- **Done when**: `CellNode` renders: editable title, HealthDot (green/amber/red), truncated output preview, connection ports (source-only for Signal, source+target for Synthesizer), delete/duplicate affordances. No internal configuration visible. Error message text visible below title when health is "error". `HealthDot` is a colored circle component accepting HealthStatus. `ConnectionEdge` is a custom xyflow edge with visual weight per ac-connection-presence. All use semantic tokens (no hardcoded colors except through Geist-compliant tokens).

---

### t-scope-shell: Create CellScope container, InputPanel, and OutputPanel | component creation
> **Center:** The uniform three-panel layout means a cell's editing surface doesn't reveal its type — the user discovers what the cell does through its connections (InputPanel) and results (OutputPanel), not through a type-specific editor.
> **Traces:** ac-stable-scope-layout, ac-scope-as-extension, ac-input-ordering, ac-scope-depth
> **Depends:** t-cell-entities, t-use-cell-scope
> **Files:**
> - `src/client/ui/components/CellScope.tsx` (create)
> - `src/client/ui/components/InputPanel.tsx` (create)
> - `src/client/ui/components/OutputPanel.tsx` (create)
> **Wave:** 6
> **Status:** pending

- **Implements**: da-c02, da-c03, da-c05
- **Done when**: `CellScope` renders a 3-panel layout (input | editor | output) for any Cell type. `InputPanel` shows connected inputs with drag-to-reorder for SynthesizerCells (calls `updateInputOrder`), empty for SignalCells. `OutputPanel` shows cell output with HealthDot — last stage result for Synthesizer, content for Signal. Error details shown when health is "error". Layout does not change shape based on cell type (ac-stable-scope-layout).

---

### t-pipeline-editor: Create PipelineEditor and StageConfig components | component creation
> **Center:** The pipeline editor lets users compose effects within a Synthesizer — but it is subordinate to canvas connections, operating only on what connections deliver.
> **Traces:** ac-pipeline-stage-types, ac-scope-depth, ac-pipeline-subordination, ac-stage-handoff
> **Depends:** t-cell-entities
> **Files:**
> - `src/client/ui/components/PipelineEditor.tsx` (create)
> - `src/client/ui/components/ChatStageConfig.tsx` (create)
> - `src/client/ui/components/CodeStageConfig.tsx` (create)
> - `src/client/ui/components/AiStageConfig.tsx` (create)
> **Wave:** 6
> **Status:** pending

- **Implements**: da-c06, da-c07
- **Done when**: `PipelineEditor` renders stage list with add/remove/reorder affordances. Selecting a stage shows its config alongside the stage list (no drill-down, ac-scope-depth). `ChatStageConfig` has prompt textarea, model picker. `CodeStageConfig` has code editor (reuse TransformCodeEditor), timeout. `AiStageConfig` has instruction textarea, model picker, output mode toggle, schema builder (reuse SchemaBuilder). Each stage shows its StageResult (success output, error message, or running indicator). Stage handoff visualized: each stage shows what it received and what it produced.

---

### t-editor-panel: Create EditorPanel that delegates to cell-type-specific editors | component creation
> **Center:** The EditorPanel delegates to TextEditor, PdfViewer, or PipelineEditor based on cell content — the editor follows the cell's compositional role, not its declared type.
> **Traces:** ac-stable-scope-layout, ac-scope-depth
> **Depends:** t-pipeline-editor, t-cell-entities
> **Files:**
> - `src/client/ui/components/EditorPanel.tsx` (create)
> **Wave:** 7
> **Status:** pending

- **Implements**: da-c04
- **Done when**: `EditorPanel` renders: for SignalCell without PdfSource, a text editor (reuse MarkdownContent or similar). For SignalCell with PdfSource, a PDF viewer (reuse PdfContent or similar). For SynthesizerCell, the `PipelineEditor`. Delegates based on cell type and source field. Does not introduce additional nesting beyond the two-level maximum (Canvas > Scope).

---

### t-mix-view-component: Create MixView component | component creation
> **Center:** MixView is the compositional payoff — one action shows what all connections collectively produced, closing the loop between connection-as-action and meaning-as-result.
> **Traces:** ac-mix-view, ac-terminal-identification
> **Depends:** t-use-mix-view, t-cell-entities
> **Files:**
> - `src/client/ui/components/MixView.tsx` (create)
> **Wave:** 6
> **Status:** pending

- **Implements**: da-c08
- **Done when**: `MixView` displays titles and outputs of all terminal cells in a single read-only view. Appears via single user action (button click or keyboard shortcut). Shows clear progress indication for cells still computing. For cached results, appears immediately. Uses `useMixView` hook data.

---

### t-empty-canvas: Create EmptyCanvasPrompt component | component creation
> **Center:** The empty state guides the user toward the first connection — create a cell, create another, connect them — making the path to composition discoverable.
> **Traces:** ac-empty-canvas
> **Depends:** t-cell-entities
> **Files:**
> - `src/client/ui/components/EmptyCanvasPrompt.tsx` (create)
> **Wave:** 6
> **Status:** pending

- **Implements**: da-c12
- **Done when**: Renders when `cells.length === 0`. Communicates how to begin: create a Signal cell, create another element, connect them. Discoverable without external documentation. Uses Geist design system tokens.

---

### t-wiring: Update Canvas nodeTypes, Toolbar, WorkspaceView, NodeShell, and composition root | framework wiring
> **Center:** The composition root wires the two-primitive model end-to-end — from entity creation through canvas rendering — making connection the only mechanism visible to the user.
> **Traces:** ac-two-primitives, ac-compact-display, ac-canvas-primacy, ac-empty-canvas
> **Depends:** t-cell-canvas-binding, t-cell-node-component, t-scope-shell, t-editor-panel, t-mix-view-component, t-empty-canvas
> **Files:**
> - `src/client/ui/components/Canvas.tsx` (modify — nodeTypes: cellNode only; edgeTypes: connectionEdge)
> - `src/client/ui/components/Toolbar.tsx` (modify — "Signal" and "Synthesizer" buttons, PDF upload, remove Transform/Chat/AiTransform)
> - `src/client/ui/components/WorkspaceView.tsx` (modify — complete rewrite for Cell-based hooks, add CellScope and MixView integration)
> - `src/client/ui/components/NodeShell.tsx` (modify — simplified for uniform cell display, da-c10)
> - `src/app/page.tsx` (modify — composition root if adapter wiring changes needed)
> **Wave:** 8
> **Status:** pending

- **Implements**: da-c10, (composition integration for all da-* elements)
- **Done when**: `Canvas.tsx` registers `cellNode: CellNode` and `connectionEdge: ConnectionEdge` as the only node/edge types. `Toolbar` has "Signal" and "Synthesizer" creation buttons plus PDF upload. `WorkspaceView` uses Cell-based `useWorkspace`, `usePipelineExecution`, `useCellScope`, `useMixView`, `useCanvasBinding`. No references to old node types in any wiring code. `EmptyCanvasPrompt` rendered when cells.length === 0. Application renders in browser with new cell model.

---

### t-cleanup: Remove old node components, old transforms, and old adapter files | code removal
> **Center:** Removing the five declared types completes the transition — only Signal and Synthesizer remain, and identity emerges entirely from composition.
> **Traces:** ac-two-primitives
> **Depends:** t-wiring
> **Files:**
> - `src/client/ui/components/MarkdownNode.tsx` (delete)
> - `src/client/ui/components/PdfNode.tsx` (delete)
> - `src/client/ui/components/TransformNode.tsx` (delete)
> - `src/client/ui/components/ChatNode.tsx` (delete)
> - `src/client/ui/components/AiTransformNode.tsx` (delete)
> - `src/client/adapters/canvas/flow-node-mapper.ts` (delete — replaced by cell-flow-node-mapper.ts)
> - `src/client/ui/hooks/use-ai-transform-handlers.ts` (delete)
> - `src/client/ui/hooks/use-ai-auto-execute.ts` (delete)
> - `src/client/domain/use-cases/execute-pipeline-graph.ts` (delete)
> - `src/client/domain/use-cases/execute-pipeline.ts` (delete)
> - `src/client/domain/use-cases/execute-ai-transform.ts` (delete)
> - `src/client/domain/use-cases/send-chat-message.ts` (delete)
> - `src/client/domain/use-cases/resolve-chat-prompts.ts` (delete)
> - `src/client/domain/use-cases/remove-node-with-cleanup.ts` (modify or delete — replace with remove-cell-with-cleanup)
> - `src/kernel/transforms/index.ts` (modify — remove all old node-specific exports)
> - Old transform files: `create-node.ts`, `create-pdf-node.ts`, `create-transform-node.ts`, `create-chat-node.ts`, `create-ai-transform-node.ts`, `update-node-content.ts`, `move-node.ts`, `remove-node.ts`, `resize-node.ts`, `duplicate-node.ts`, `update-transform-code.ts`, `update-transform-timeout.ts`, `navigate-pdf-page.ts`, `update-pdf-zoom.ts`, `toggle-pdf-dark-mode.ts`, `update-chat-model.ts`, `update-ai-instruction.ts`, `update-ai-transform-model.ts`, `toggle-auto-execute.ts`, `update-ai-input-mode.ts`, `resolve-ai-transform-prompt.ts`, `validate-structured-output.ts`, `update-output-mode.ts`, `update-schema.ts`, `update-schema-mode.ts` (delete all)
> - `src/kernel/entities/workspace-node.ts` (delete — types preserved in legacy-v10.ts)
> - `src/kernel/entities/chat.ts` (delete if only used by old ChatNode)
> - `src/kernel/entities/input-legend.ts` (delete if no longer needed)
> - `src/kernel/entities/resolved-input.ts` (delete if replaced by resolve-inputs transform)
> **Wave:** 9
> **Status:** pending

- **Implements**: da-c13, da-c14, da-c15, da-c16, da-c17
- **Done when**: No file in the project imports from deleted files. No reference to `WorkspaceNode`, `MarkdownNodeData`, `PdfNodeData`, `TransformNodeData`, `ChatNodeData`, `AiTransformNodeData` except in `legacy-v10.ts` (used by migration only). `kernel/transforms/index.ts` exports only Cell-based transforms plus connection transforms. TypeScript compiles cleanly. Application runs end-to-end.

---

### t-chat-assistant-deferred: Chat configuration assistant (deferred — not built in this spec) | deferred
> **Center:** Chat assists with configuring cells so the user can realize compositional intent more effectively — lowering the barrier to expressing what each connection should do.
> **Traces:** ac-chat-configuration-assistant, ac-chat-distinct-from-pipeline
> **Depends:** t-wiring
> **Files:** (none — deferred)
> **Wave:** 10
> **Status:** pending

- **Implements**: (deferred — architecture supports it via ChatPort availability on any cell)
- **Done when**: Deferred. This task exists for traceability only. The chat configuration assistant is architecturally supported (ChatPort is available, CellScope has space for a chat panel) but not built in this spec. Recommended as a follow-up spec.

---

## Execution Waves

| Wave | Tasks | Depends on waves | Shared file risks |
|------|-------|-------------------|-------------------|
| 1 | t-cell-entities | (none) | `kernel/entities/index.ts` (sole modifier) |
| 2 | t-cell-transforms-new, t-migrate-v10-v11 | 1 | (none) — both create new files only |
| 3 | t-transforms-barrel, t-storage-envelope-v11, t-server-storage-update, t-execute-pipeline | 1, 2 | `kernel/transforms/index.ts` (t-transforms-barrel sole modifier) |
| 4 | t-cell-flow-mapper, t-use-persistence-cells, t-use-cell-scope, t-use-mix-view | 1, 2, 3 | (none) — all create/modify separate files |
| 5 | t-use-workspace-cells, t-use-pipeline-cells | 2, 3, 4 | (none) — separate files |
| 6 | t-cell-canvas-binding, t-cell-node-component, t-scope-shell, t-pipeline-editor, t-mix-view-component, t-empty-canvas | 1, 4, 5 | (none) — all create/modify separate files. t-cell-canvas-binding depends on W4+W5; components depend only on W1 entities |
| 7 | t-editor-panel | 6 (t-pipeline-editor) | (none) |
| 8 | t-wiring | 5, 6, 7 | `Canvas.tsx`, `Toolbar.tsx`, `WorkspaceView.tsx`, `page.tsx` (sole modifier) |
| 9 | t-cleanup | 8 | `kernel/transforms/index.ts`, `kernel/entities/index.ts` (sole modifier) |

### Parallelism Notes

- **Wave 2**: t-cell-transforms-new and t-migrate-v10-v11 are fully parallel (different files, same dependency).
- **Wave 3**: t-storage-envelope-v11, t-server-storage-update, and t-execute-pipeline are parallel (different files). t-transforms-barrel must complete before Wave 4 begins (it finalizes the barrel that Wave 4 consumers import from).
- **Wave 4**: All four tasks are parallel (different files, no mutual dependency).
- **Wave 5**: t-use-workspace-cells and t-use-pipeline-cells are parallel (different files).
- **Wave 6**: t-cell-canvas-binding depends on W4+W5. All component tasks (t-cell-node-component, t-scope-shell, t-pipeline-editor, t-mix-view-component, t-empty-canvas) depend only on W1 entities and can start as early as W2, but are grouped in W6 for logical coherence. If schedule pressure emerges, component creation can be pulled earlier.
- **Wave 7**: t-editor-panel depends on t-pipeline-editor (W6) since it hosts the PipelineEditor component.
- **Critical path**: W1 > W2 > W3 > W4(persistence) > W5(workspace hook) > W6(canvas-binding) > W8(wiring) > W9(cleanup).
