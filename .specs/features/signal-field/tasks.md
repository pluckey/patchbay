---
feature: signal-field
center: "This feature shifts the user's primary activity from configuring individual components to composing connections between them, and from prescribing behavior to observing emergence."
stage: tasks
intensity: deep
execution_mode: parallel
loop_iterations: 1
last_modified: 2026-04-05T22:30:00Z
---

## Panel

**Robert C. Martin (Uncle Bob)** — SOLID principles, clean architecture, component cohesion. Dictated the inside-out construction order: entities first, transforms second, use cases third, adapters and hooks fourth, integration wiring last. Identified that the Workspace type extension (adding `cells` and `executionMode`) must use optional fields during the strangler fig transition to avoid a compile-time cascade through every Workspace constructor in the codebase. Verified that all source code dependencies point inward throughout the build sequence.

**Martin Fowler** — refactoring, enterprise patterns, evolutionary design. Identified a gap in the design atom inventory: `createConnection` in `src/kernel/transforms/create-connection.ts` generates labels from `WorkspaceNode` types but has no handling for Cell source types. Added t-update-create-connection. Traced the full persistence impact of adding `cells` to Workspace: storage envelope migration, merge logic, persistence hook, server migration — four files beyond what the design atoms name explicitly. Advocated splitting these into explicit tasks rather than bundling them under da-workspace-migration.

**John Carmack** — systems optimization, shipping discipline, first-principles engineering. Traced the minimum viable path for sc-first-composition (the acid test scenario): 22 tasks from cell entity to working cascade-with-Mix. Identified two disproportionately large tasks: t-persistence-cells (threading cells through save/load/poll/beforeunload in a 145-line state management file) and t-workspace-view-cells (wiring 8+ new callbacks through an already complex 175-line orchestrator). Recommended keeping cell and node data paths strictly separate — `cellsToFlowNodes` as a new function, never modifying `toFlowNodes` — to minimize blast radius. Noted that `gate` on Connection and `executionMode` on Workspace are dead code in Phase 1a: ship the fields, don't test the behavior.

**Valentino Braitenberg** — synthetic psychology, vehicles framework. Verified that the wiring is testable early: after Wave 2, the complete signal flow (create cells, connect, schedule, resolve inputs, compute mix) is exercisable in pure unit tests without React, xyflow, or any UI. The Vehicle is wired at the unit test level before visual components exist. Flagged that the first USER-observable wiring doesn't arrive until Wave 4-5, but accepted this as the cost of inside-out construction — unit tests ARE the observation apparatus for Waves 1-3.

**John Gall** — systemantics, Gall's Law. Compressed the original 7-wave plan to 5 waves. Applied the acid test to each wave: "After wave N completes, what can the user actually do?" Waves 1-3 produce no user-visible change but maintain a working existing system while building testable infrastructure. Wave 4 produces all UI components. Wave 5 wires everything together into the first working signal-field system. Accepted 5 waves as the minimum that respects both inside-out ordering and the constraint that no two tasks modify the same file in the same wave.

**Carl Gustav Jacob Jacobi (The Inverter)** — Five inversions applied:

1. *"What if building entities first makes persistence harder?"* — The Workspace type change forces every Workspace constructor to supply `cells` and `executionMode`. Resolved by making both fields optional during Phase 1a (`cells?: Cell[]`, `executionMode?: 'manual' | 'automatic'`). TypeScript strict mode enforces null-checking at every access site. This is the single most important architectural decision in the build plan.

2. *"What if the createConnection signature change cascades to callers?"* — Adding `cells?: Cell[]` as an optional parameter preserves backward compatibility. Existing callers continue to work without cells. Wave 4 callers (useCanvasBinding) start passing cells. No forced cascade.

3. *"What if validateConnection's new behavior breaks existing connections?"* — The modified function adds NEW rejection rules (Source cells as targets) but doesn't change existing rules (legacy nodes). Backward-compatible by construction. The `cells` parameter is optional — when absent, no cell-specific rules apply.

4. *"What if the integration wave (Wave 5) is where everything breaks?"* — WorkspaceView.tsx is the highest-risk file. It's already a 175-line callback orchestrator. Adding cell support means ~8 new callbacks plus two new hooks (useCascade, useMix). Mitigated by: extracting cell state management into useCascade/useMix hooks (keeping WorkspaceView thin), and the fact that cell callbacks follow the exact same pattern as existing node callbacks.

5. *"What if merge-on-save silently drops cells?"* — Confirmed. The current `mergeWorkspace()` only merges `nodes` and `connections` arrays. Without t-merge-workspace-cells, externally-added cells would be lost on save. This is a data-loss bug that would only manifest in multi-client scenarios. Task explicitly added to Wave 3.

---

## Tasks

### Wave 1 — Kernel Entity Foundations

### t-cell-entity: Create Cell discriminated union type | kernel entity
> **Center:** The Cell type is the atomic unit of the signal field — without it, nothing else in the feature exists.
> **Traces:** ac-two-transfer-primitives, ac-uniform-cell-presentation
> **Depends:** (none)
> **Files:** `src/kernel/entities/cell.ts` (create), `src/kernel/entities/index.ts` (modify — add Cell exports)
> **Wave:** 1
> **Status:** pending

- **Implements**: da-cell-entity
- **Done when**: `cell.ts` exports `CellOutput` (status union: success/error/running), `BaseCell` (id, title, position, dimensions?, createdAt, updatedAt, output?), `SourceCellData` (type: 'source', content: string), `AiCellData` (type: 'ai', instruction: string, provider: string, model: string), and `Cell` (SourceCellData | AiCellData). All types re-exported from `kernel/entities/index.ts`. File imports only from `workspace-node.ts` (Position, Dimensions types). Zero framework imports.

---

### t-connection-gate: Add gate field to Connection entity | kernel entity
> **Center:** The gate field is the structural foundation for flow control — present from Phase 1a so the schema never needs a breaking migration when cycles arrive in Phase 3.
> **Traces:** ac-connection-gate
> **Depends:** (none)
> **Files:** `src/kernel/entities/connection.ts` (modify)
> **Wave:** 1
> **Status:** pending

- **Implements**: da-connection-gate
- **Done when**: `Connection` type includes `gate: 'open' | 'latched'` field. Default value semantics documented in comment. No other entity file changes needed (Connection is already exported from barrel).

---

### Wave 2 — Kernel Transforms + Workspace Extension + Storage

### t-workspace-cells: Add cells and executionMode to Workspace type | kernel entity
> **Center:** The Workspace type is the container that makes cells first-class citizens of the workspace — without this, cells exist as types but have no home.
> **Traces:** ac-two-transfer-primitives, ac-execution-mode-toggle
> **Depends:** t-cell-entity
> **Files:** `src/kernel/entities/workspace.ts` (modify)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-execution-mode
- **Done when**: `Workspace` type includes `cells?: Cell[]` (optional — strangler fig) and `executionMode?: 'manual' | 'automatic'` (optional — dead in Phase 1a). Import of `Cell` from `./cell`. Both fields optional to avoid compile-time cascade through every Workspace constructor. Existing code continues to compile unchanged.

---

### t-create-source-cell: Create createSourceCell transform | kernel transform
> **Center:** Source cells are identity functions — the simplest possible signal originator. This transform is the first concrete act of building the signal field.
> **Traces:** ac-two-transfer-primitives, ac-cell-creation-simple
> **Depends:** t-cell-entity
> **Files:** `src/kernel/transforms/create-source-cell.ts` (create)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-create-source-cell
- **Done when**: Pure function `createSourceCell(position: Position, content?: string, title?: string) -> SourceCellData`. Generates id via nanoid. Sets type='source', createdAt/updatedAt to Date.now(), output to `{ status: 'success', text: content ?? '' }` (identity: content IS output). Default title is 'Source'.

---

### t-create-ai-cell: Create createAiCell transform | kernel transform
> **Center:** AI cells are the stochastic transformer — the complement to Source that makes composition meaningful.
> **Traces:** ac-two-transfer-primitives, ac-cell-creation-simple
> **Depends:** t-cell-entity
> **Files:** `src/kernel/transforms/create-ai-cell.ts` (create)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-create-ai-cell
- **Done when**: Pure function `createAiCell(position: Position, instruction?: string, title?: string) -> AiCellData`. Generates id via nanoid. Sets type='ai', createdAt/updatedAt to Date.now(), output undefined (no output until triggered). Default provider/model from a sensible default (e.g., 'anthropic'/'claude-sonnet-4-20250514'). Default title is 'AI'.

---

### t-compute-terminal-cells: Create computeTerminalCells transform | kernel transform
> **Center:** Terminal cells are the topology's natural output points — computing them makes The Mix possible.
> **Traces:** ac-the-mix
> **Depends:** t-cell-entity, t-connection-gate
> **Files:** `src/kernel/transforms/compute-terminal-cells.ts` (create)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-compute-terminal-cells
- **Done when**: Pure function `computeTerminalCells(cells: Cell[], connections: Connection[]) -> Cell[]`. Returns cells that have no outgoing connections where `gate === 'open'`. A cell with only latched outgoing connections IS terminal. Empty cells array returns empty. Ignores legacy nodes (operates on Cell[] only).

---

### t-compute-mix: Create computeMix transform | kernel transform
> **Center:** The Mix closes the composition feedback loop — this transform computes the composed output from the topology.
> **Traces:** ac-the-mix
> **Depends:** t-cell-entity, t-connection-gate
> **Files:** `src/kernel/transforms/compute-mix.ts` (create)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-compute-mix
- **Done when**: Pure function `computeMix(cells: Cell[], connections: Connection[]) -> MixEntry[]`. `MixEntry` type exported: `{ cellId: string, title: string, output: string, order: number }`. Orders terminal cells by topological depth (cells deeper in the graph appear later). Cells without output produce empty string. Preserves provenance via cellId.

---

### t-build-execution-schedule: Create buildExecutionSchedule transform | kernel transform
> **Center:** The execution schedule is the engine that turns a single trigger into a cascade through the topology — making trigger a compositional decision, not a per-cell chore.
> **Traces:** ac-manual-trigger-cascade
> **Depends:** t-cell-entity, t-connection-gate
> **Files:** `src/kernel/transforms/build-execution-schedule.ts` (create)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-build-execution-schedule
- **Done when**: Pure function `buildExecutionSchedule(triggeredCellId: string, cells: Cell[], connections: Connection[]) -> ExecutionStep[]`. `ExecutionStep` type exported: `{ cellId: string }`. BFS downstream from triggered cell, following outgoing open connections (skips latched). Source cells excluded from schedule (they ARE their own output). Returns ordered list. Architecture does NOT hard-code topological sort — uses BFS traversal that naturally accommodates future cycle support. Accepts a pluggable scheduling function or is structured so the traversal strategy can be swapped.

---

### t-validate-connection-cells: Update validateConnection for cell types | kernel transform
> **Center:** Validation rules enforce the signal field's grammar — Source cells cannot receive input, making their role as signal originators structural, not advisory.
> **Traces:** ac-directed-connections
> **Depends:** t-cell-entity
> **Files:** `src/kernel/transforms/validate-connection.ts` (modify)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-validate-connection-signal-field
- **Done when**: Function signature gains optional `cells?: Cell[]` parameter. When cells are provided: rejects connections targeting Source cells ("Source cells cannot receive input"), permits multiple inputs to AI cells (no existing-incoming check for AI cells), rejects self-connections, rejects connections where one endpoint is a Cell and the other is a WorkspaceNode (cross-type boundary: legacy and signal-field systems do not interoperate at the data level). Existing logic for legacy WorkspaceNode types unchanged (backward-compatible). Cycle detection operates across both nodes and cells sharing the connections array.

---

### t-resolve-cell-inputs: Create resolveCellInputs transform | kernel transform
> **Center:** Input resolution turns topology into data — it reads the wiring and assembles what a cell actually receives.
> **Traces:** ac-manual-trigger-cascade, ac-fan-in-keyed-input
> **Depends:** t-cell-entity
> **Files:** `src/kernel/transforms/resolve-cell-inputs.ts` (create)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-resolve-cell-inputs
- **Done when**: Pure function `resolveCellInputs(cellId: string, cells: Cell[], connections: Connection[], outputs?: Map<string, CellOutput>) -> Record<string, string>`. Returns `Record<string, string>` where keys are source cell titles and values are output text. Looks up each incoming connection's sourceId in cells array, retrieves output text from `outputs` map (populated during cascade) when available, falls back to cell.output. Returns empty object if no inputs.

---

### t-update-create-connection: Update createConnection for cell source types | kernel transform
> **Center:** Connection labels from cell sources must be meaningful — "source" or the cell's title, not "unknown" — so the topology is readable.
> **Traces:** ac-directed-connections
> **Depends:** t-cell-entity
> **Files:** `src/kernel/transforms/create-connection.ts` (modify)
> **Wave:** 2
> **Status:** pending

- **Implements**: (gap identified by panel — not a named design atom)
- **Done when**: Function signature gains optional `cells?: Cell[]` parameter. When a connection's sourceId matches a cell (not a node), the label is generated from the cell type: 'source' for Source cells, 'ai' for AI cells. Existing label generation for WorkspaceNode types unchanged. Collision avoidance (suffix numbering) works across both node-derived and cell-derived labels.

---

### t-storage-envelope-v11: Migrate storage envelope to version 11 | adapter
> **Center:** Without schema migration, cells created on canvas vanish on reload — persistence is the bridge between sessions.
> **Traces:** ac-two-transfer-primitives
> **Depends:** t-cell-entity, t-workspace-cells, t-connection-gate
> **Files:** `src/client/adapters/storage/storage-envelope.ts` (modify)
> **Wave:** 3
> **Status:** pending

- **Implements**: da-workspace-migration (client-side)
- **Done when**: `CURRENT_VERSION` bumped to 11. `StorageEnvelope` type includes `cells?: Cell[]` and `executionMode?: 'manual' | 'automatic'`. `migrate()` has v10→v11 step: adds `cells: []` if absent, adds `executionMode: 'manual'` if absent, adds `gate: 'open'` to every connection missing a gate field. `toWorkspace()` populates `cells` and `executionMode` from envelope (defaulting to `[]` and `'manual'`). `toEnvelope()` serializes `cells` and `executionMode`. Existing workspaces load and save correctly.

---

### t-transforms-barrel: Update kernel transforms barrel with new exports | barrel
> **Center:** The barrel is the public API of the transforms layer — without it, use cases and hooks cannot import the new transforms.
> **Traces:** ac-two-transfer-primitives, ac-the-mix, ac-manual-trigger-cascade
> **Depends:** t-create-source-cell, t-create-ai-cell, t-compute-terminal-cells, t-compute-mix, t-build-execution-schedule, t-resolve-cell-inputs
> **Files:** `src/kernel/transforms/index.ts` (modify)
> **Wave:** 3
> **Status:** pending

- **Implements**: (infrastructure)
- **Done when**: All six new transforms (createSourceCell, createAiCell, computeTerminalCells, computeMix, buildExecutionSchedule, resolveCellInputs) are exported from the barrel. Existing exports unchanged.

---

### Wave 3 — Barrel + Use Case + Server Persistence

### t-execute-cascade: Create executeCascade use case | use case
> **Center:** The cascade is what makes trigger a topology-level decision — one action propagates through the graph.
> **Traces:** ac-manual-trigger-cascade
> **Depends:** t-build-execution-schedule, t-resolve-cell-inputs
> **Files:** `src/client/domain/use-cases/execute-cascade.ts` (create)
> **Wave:** 3
> **Status:** pending

- **Implements**: da-execute-cascade
- **Done when**: Async function `executeCascade(triggeredCellId: string, cells: Cell[], connections: Connection[], ports: { aiExecutor: AiExecutorPort }) -> Map<string, CellOutput>`. Orchestrates: (1) call buildExecutionSchedule to get ordered steps, (2) iterate steps, (3) for each step: call resolveCellInputs with accumulated outputs (returns Record<string, string>), (4) execute cell — Source cells produce output from content (no port call), AI cells receive `Object.values(resolvedInputs).join('\n')` as concatenated input for prompt construction (the Record<string, string> interface is stable; Phase 1b changes only how Code cells consume keyed inputs), (5) store CellOutput in results map. Returns complete map of cellId→CellOutput. Sets output.status to 'running' before execution, 'success' or 'error' after. Captures durationMs.

---

### t-server-migration-v11: Create server-side migration for signal-field schema | server adapter
> **Center:** Server-side migration ensures existing workspaces gain the cells infrastructure transparently on first load.
> **Traces:** ac-two-transfer-primitives
> **Depends:** t-cell-entity, t-connection-gate, t-workspace-cells
> **Files:** `src/server/storage/migrate-to-signal-field.ts` (create)
> **Wave:** 3
> **Status:** pending

- **Implements**: da-workspace-migration (server-side)
- **Done when**: Idempotent function `migrateToSignalField(workspaceJson: string) -> string`. Parses workspace JSON, checks version. If version < 11: adds `cells: []` if absent, adds `executionMode: 'manual'` if absent, adds `gate: 'open'` to every connection missing gate, bumps version to 11. Returns updated JSON string. Does NOT convert legacy nodes to cells (that's user-initiated). Follows pattern of existing `migrate-to-multi-workspace.ts`. Triggered lazily on workspace load in the GET `/api/workspaces/[id]` route.

---

### t-merge-workspace-cells: Update merge logic for cells array | server adapter
> **Center:** Without cell-aware merging, externally-added cells are silently dropped on save — a data-loss bug in multi-client scenarios.
> **Traces:** ac-two-transfer-primitives
> **Depends:** t-workspace-cells
> **Files:** `src/server/storage/merge-workspace.ts` (modify)
> **Wave:** 3
> **Status:** pending

- **Implements**: (gap identified by panel — Jacobi inversion #5)
- **Done when**: `mergeWorkspace()` merges `cells` array using the same preserve-absent-unless-deleted logic as `nodes` and `connections`. WorkspaceData type gains `cells?: Identifiable[]`. When incoming has no cells field (legacy client), server cells are fully preserved. When incoming has cells, absent-from-incoming cells are preserved unless in deletedIds.

---

### t-persistence-cells: Update persistence hook for cells state management | hook
> **Center:** Cells must persist, load, poll, and survive tab close — without this, the signal field is ephemeral.
> **Traces:** ac-two-transfer-primitives, ac-the-mix
> **Depends:** t-workspace-cells, t-storage-envelope-v11
> **Files:** `src/client/ui/hooks/use-workspace-persistence.ts` (modify)
> **Wave:** 4
> **Status:** pending

- **Implements**: (persistence infrastructure for cells)
- **Done when**: Hook manages `cells` state (`useState<Cell[]>`) alongside existing `nodes` state. Returns `{ cells, setCells, cellsRef }` in addition to existing return values. Load populates cells from `workspace.cells ?? []`. Save includes cells in workspace payload. scheduleSave accepts updatedCells parameter. Polling absorbs externally-added cells (same pattern as nodes: skip IDs already present or in deletedIds). beforeunload flush includes cells. Deletion tracking works for cell IDs (deletionManifest is already ID-based, no change needed). cellsRef updated on every cells state change.

---

### Wave 4 — UI Infrastructure (Standalone Components + Hooks)

### t-cell-shell: Create CellShell component | component
> **Center:** The CellShell enforces visual uniformity — all cells look identical at rest, shifting attention from classification to composition.
> **Traces:** ac-uniform-cell-presentation
> **Depends:** (none)
> **Files:** `src/client/ui/components/CellShell.tsx` (create)
> **Wave:** 4
> **Status:** pending

- **Implements**: da-cell-shell
- **Done when**: Component renders with props: `{ cellId, title, hasInput, onDelete, onDuplicate, onResizeEnd, children }`. Uses `bg-background text-foreground border-border rounded-lg` (Geist tokens, matching NodeShell). Renders NodeResizer (visible on hover). Renders source Handle on right (Position.Right) always. Renders target Handle on left (Position.Left) only when `hasInput=true`. Delete and duplicate buttons on hover (same pattern as NodeShell). Title displayed in header area. No type badges. No type-specific coloring.

---

### t-cell-flow-mapper: Add cell-to-flow mapping in flow-node-mapper | adapter
> **Center:** The flow mapper is the translation layer that makes cells visible on the canvas — without it, cells exist in state but are invisible.
> **Traces:** ac-uniform-cell-presentation, ac-two-transfer-primitives
> **Depends:** t-cell-entity
> **Files:** `src/client/adapters/canvas/flow-node-mapper.ts` (modify), `src/client/adapters/canvas/use-canvas-binding.ts` (modify)
> **Wave:** 4
> **Status:** pending

- **Implements**: da-cell-flow-mapper
- **Done when**: New exported function `cellsToFlowNodes(cells: Cell[], connections: Connection[], callbacks: CellFlowCallbacks) -> Node[]` maps cells to xyflow nodes with type 'cellNode'. `CellFlowCallbacks` type defined with: onContentChange, onInstructionChange, onTitleChange, onTrigger, onDelete, onDuplicate, onResizeEnd, onModelChange. Existing `toFlowNodes` unchanged (legacy nodes continue to work). `use-canvas-binding.ts` updated to: accept cells and cell callbacks, call `cellsToFlowNodes`, combine results with legacy flow nodes via `[...toFlowNodes(...), ...cellsToFlowNodes(...)]`, handle onConnect validation with cells, handle cell node drag stops.

---

### t-mix-panel: Create MixPanel component | component
> **Center:** The Mix is always visible during composition — it closes the feedback loop so the user sees what their topology produces as a whole.
> **Traces:** ac-the-mix
> **Depends:** (none)
> **Files:** `src/client/ui/components/MixPanel.tsx` (create)
> **Wave:** 4
> **Status:** pending

- **Implements**: da-mix-panel
- **Done when**: Component renders with props: `{ entries: MixEntry[] }`. Right-side panel, ~300px wide. Shows each MixEntry with cell title as header and output text as body. Scrollable when multiple terminals. Empty state: "No terminal cells. Connect cells to see composed output." Uses `bg-muted` background, `text-muted-foreground` headers (subordinate visual weight per design). Uses `'use client'` directive.

---

### t-cell-toolbar: Create CellToolbar replacing legacy Toolbar | component
> **Center:** The toolbar offers only Source and AI creation — two buttons, not five — reducing classification burden and keeping attention on the canvas.
> **Traces:** ac-cell-creation-simple
> **Depends:** (none)
> **Files:** `src/client/ui/components/Toolbar.tsx` (modify)
> **Wave:** 4
> **Status:** pending

- **Implements**: da-cell-toolbar
- **Done when**: Toolbar component updated to show Source and AI creation buttons alongside (not replacing) existing legacy buttons. Legacy buttons remain for backward compatibility during strangler fig. Two new buttons: "+ Source" and "+ AI". Each calls its respective creation callback. Positioned absolute top-left over canvas (same as current Toolbar).

---

### t-use-cascade: Create useCascade hook | hook
> **Center:** The cascade hook bridges the trigger UI action to the execution engine — it turns a button click into a wave of signal through the topology.
> **Traces:** ac-manual-trigger-cascade
> **Depends:** t-execute-cascade, t-persistence-cells
> **Files:** `src/client/ui/hooks/use-cascade.ts` (create)
> **Wave:** 5
> **Status:** pending

- **Implements**: da-use-cascade
- **Done when**: Hook `useCascade({ cells, connections, setCells, cellsRef, scheduleSave })` returns `{ triggerCell: (cellId: string) -> Promise<void> }`. Receives AiExecutorPort from `useAdapters()`. On trigger: calls executeCascade with current cells/connections and port, receives Map<string, CellOutput>, updates each cell's output in cells state via setCells (immutable update), calls scheduleSave with updated cells. Sets output.status to 'running' on triggered cell before execution begins.

---

### t-use-mix: Create useMix hook | hook
> **Center:** The Mix hook makes topology-level feedback reactive — every connection change or output change is reflected in the composed output.
> **Traces:** ac-the-mix
> **Depends:** t-compute-terminal-cells, t-compute-mix
> **Files:** `src/client/ui/hooks/use-mix.ts` (create)
> **Wave:** 4
> **Status:** pending

- **Implements**: da-use-mix
- **Done when**: Hook `useMix(cells: Cell[], connections: Connection[]) -> MixEntry[]`. Calls computeTerminalCells then computeMix. Memoized via useMemo — recomputes only when cells or connections change (referential equality). Returns MixEntry[] ready for MixPanel rendering.

---

### Wave 5 — CellNode Component

### t-cell-node: Create CellNode component | component
> **Center:** CellNode is the single visual representation for all cell types — the uniform card that forces topology-reading over classification-reading.
> **Traces:** ac-uniform-cell-presentation, ac-two-transfer-primitives, ac-cell-creation-simple
> **Depends:** t-cell-shell
> **Files:** `src/client/ui/components/CellNode.tsx` (create)
> **Wave:** 5
> **Status:** pending

- **Implements**: da-cell-node-component
- **Done when**: Single xyflow node component registered as 'cellNode'. Renders inside CellShell. Receives cell data and callbacks via xyflow node data prop. For Source cells: renders inline text editor (textarea) for content, hasInput=false. For AI cells: renders inline text editor for instruction, hasInput=true, trigger button (play icon) appears on hover. Output preview shown below editor (truncated to ~3 lines). Running state shows loading indicator. Error state shows error message. Uses `'use client'` directive.

---

### Wave 6 — Canvas Registration

### t-canvas-cell-registration: Register cellNode type in Canvas | integration
> **Center:** Without registration, cells exist in state and in the flow mapper but are invisible on the canvas — this task makes them visible.
> **Traces:** ac-two-transfer-primitives, ac-uniform-cell-presentation
> **Depends:** t-cell-node
> **Files:** `src/client/ui/components/Canvas.tsx` (modify)
> **Wave:** 6
> **Status:** pending

- **Implements**: (integration wiring)
- **Done when**: Canvas component's `nodeTypes` useMemo includes `cellNode: CellNode` alongside existing node types (markdownNode, pdfNode, transformNode, chatNode, aiTransformNode). Import of CellNode added. All existing node types preserved (strangler fig).

---

### Wave 7 — Final Integration

### t-workspace-view-cells: Wire cell operations through WorkspaceView | integration
> **Center:** WorkspaceView is the orchestrator that connects all the pieces — cell creation, editing, triggering, and Mix display converge here to form the working signal field.
> **Traces:** ac-two-transfer-primitives, ac-manual-trigger-cascade, ac-the-mix, ac-cell-creation-simple, ac-directed-connections
> **Depends:** t-use-cascade, t-use-mix, t-cell-flow-mapper, t-persistence-cells, t-cell-toolbar, t-mix-panel, t-canvas-cell-registration
> **Files:** `src/client/ui/components/WorkspaceView.tsx` (modify), `src/app/page.tsx` (modify if layout changes needed)
> **Wave:** 7
> **Status:** pending

- **Implements**: (integration wiring — composition root)
- **Done when**: WorkspaceView renders CellToolbar (Source/AI buttons wired to createSourceCell/createAiCell at canvas center position). WorkspaceView renders MixPanel with entries from useMix hook. WorkspaceView calls useCascade hook and passes triggerCell to cell flow callbacks. Cell content changes (Source) update cells state and call scheduleSave. Cell instruction changes (AI) update cells state and call scheduleSave. Cell model changes (AI) update cells state and call scheduleSave. Cell delete removes cell from state, tracks deletion, removes orphaned connections, calls scheduleSave. Cell duplicate creates copy at offset position. Cell move updates cell position. Cell resize updates cell dimensions. useCanvasBinding receives cells and cell callbacks, combines cell flow nodes with legacy flow nodes. MixPanel layout: right-side panel alongside canvas (flex layout or absolute positioned). Legacy Toolbar and nodes continue to work unchanged. Source cell output auto-updates when content changes (identity function: content IS output). Technical debt note: if WorkspaceView exceeds ~250 lines after this task, extract cell callbacks into a useCellOperations hook in a follow-up.

---

## Execution Waves

| Wave | Tasks | Depends on waves | Shared file risks |
|------|-------|-------------------|-------------------|
| 1 | t-cell-entity, t-connection-gate | (none) | `kernel/entities/index.ts` modified by t-cell-entity only |
| 2 | t-workspace-cells, t-create-source-cell, t-create-ai-cell, t-compute-terminal-cells, t-compute-mix, t-build-execution-schedule, t-validate-connection-cells, t-resolve-cell-inputs, t-update-create-connection | Wave 1 | All tasks create new files or modify unique files |
| 3 | t-transforms-barrel, t-storage-envelope-v11, t-execute-cascade, t-server-migration-v11, t-merge-workspace-cells | Wave 2 | `kernel/transforms/index.ts` modified by t-transforms-barrel only; all other tasks modify different files |
| 4 | t-persistence-cells, t-cell-shell, t-cell-flow-mapper, t-mix-panel, t-cell-toolbar, t-use-mix | Wave 3 | `use-workspace-persistence.ts` modified by t-persistence-cells only; `flow-node-mapper.ts` + `use-canvas-binding.ts` modified by t-cell-flow-mapper only |
| 5 | t-cell-node, t-use-cascade | Wave 4 | (none — different files) |
| 6 | t-canvas-cell-registration | Wave 5 | (none) |
| 7 | t-workspace-view-cells | Wave 4, Wave 6 | (none) |
