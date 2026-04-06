---
feature: signal-field
center: "This feature shifts the user's primary activity from configuring individual components to composing connections between them, and from prescribing behavior to observing emergence."
stage: tasks
intensity: deep
execution_mode: parallel
loop_iterations: 1
last_modified: 2026-04-05T23:30:00Z
verification_protocol: |
  Wave gates: tsc --noEmit + next build
  Kernel waves: unit tests for new transforms
  UI waves: next build + dev server renders without errors
  Final wave: manual smoke test (documented in last task)
---

## Panel

**Robert C. Martin (Uncle Bob)** — SOLID principles, clean architecture. Dictated inside-out construction order: entities → transforms → use cases → persistence → adapters → hooks → cards → Scope → integration. Insisted on callback split between card (lifecycle) and Scope (editing). Verified all source dependencies point inward.

**Martin Fowler** — refactoring, evolutionary design. Compressed 9 initial waves to 7 by identifying independent components that can parallelize. Identified that Scope editors (Source, Code, AI) are leaf components with no adapter or hook dependencies — they can build in Wave 4 alongside adapters.

**John Carmack** — systems optimization, shipping discipline. Traced the minimum viable path: 42 tasks from cell entity to working Scope. Identified WorkspaceView as the highest-risk file and proposed extracting cell operations into a useCellOperations hook to keep integration manageable. Flagged that persistence hook's scheduleSave must never receive empty arrays.

**Valentino Braitenberg** — synthetic psychology, vehicles framework. Verified that after Wave 2, the complete signal flow (create cells, connect, schedule, resolve inputs, compute mix, compute staleness) is exercisable in pure unit tests. The vehicle is wired at the unit test level before UI exists. First user-observable behavior arrives at Wave 6.

**John Gall** — systemantics, Gall's Law. Applied acid test to each wave. Accepted that Waves 1-5 produce no user-visible change but build testable infrastructure. Wave 6 is where everything converges. Accepted single integration wave with useCellOperations extraction and post-wave smoke test.

**Carl Gustav Jacob Jacobi (The Inverter)** — Five inversions: (1) Parallel transforms may have inconsistent signatures — type system enforces via done-when criteria. (2) Persistence hook may repeat Bug 1 (empty array wipes nodes) — done-when explicitly forbids this. (3) Creation state machine may fire on every keystroke — resolved: transition on blur, not content change. (4) ScopeView resize is outside ReactFlow tree — safe. (5) Integration wave may break — mitigated by hook extraction and smoke test guardrail.

---

## Tasks

### Wave 1 — Kernel Entities

### t-cell-entity: Create Cell discriminated union type with all three primitives | kernel entity
> **Center:** The Cell type is the atomic unit of the signal field — Source, Code, and AI are the three irreducible primitives that make composition meaningful.
> **Traces:** ac-two-transfer-primitives, ac-code-cell, ac-uniform-cell-presentation
> **Depends:** (none)
> **Files:** `src/kernel/entities/cell.ts` (create), `src/kernel/entities/index.ts` (modify)
> **Wave:** 1
> **Status:** pending

- **Implements**: da-cell-entity
- **Done when**: `cell.ts` exports `CellOutput` (status union: success/error/running with text/error/durationMs), `BaseCell` (id, title, position, dimensions?, createdAt, updatedAt, output?, lastInputHash?: string), `SourceCellData` (type: 'source', content: string), `AiCellData` (type: 'ai', instruction: string, provider: string, model: string, outputMode: 'text' | 'structured', schemaMode: 'single' | 'collection', schema: SchemaField[]), `CodeCellData` (type: 'code', code: string, timeoutMs: number), and `Cell` (SourceCellData | AiCellData | CodeCellData). All types re-exported from `kernel/entities/index.ts`. File imports only from `workspace-node.ts` (Position, Dimensions) and `schema-field.ts` (SchemaField). Zero framework imports.

---

### t-connection-gate: Add gate field to Connection entity | kernel entity
> **Center:** The gate field is the structural foundation for flow control — present from the start so the schema never needs a breaking migration when cycles arrive.
> **Traces:** ac-connection-gate
> **Depends:** (none)
> **Files:** `src/kernel/entities/connection.ts` (modify)
> **Wave:** 1
> **Status:** pending

- **Implements**: da-connection-gate
- **Done when**: `Connection` type includes `gate: 'open' | 'latched'` field. Default value semantics documented in comment. All downstream compile errors fixed (create-connection.ts, storage-envelope.ts).

---

### t-workspace-cells: Add cells and executionMode to Workspace type | kernel entity
> **Center:** The Workspace type is the container that makes cells first-class citizens — without this, cells have no home.
> **Traces:** ac-two-transfer-primitives, ac-execution-mode-toggle
> **Depends:** t-cell-entity
> **Files:** `src/kernel/entities/workspace.ts` (modify)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-execution-mode
- **Done when**: `Workspace` type includes `cells?: Cell[]` (optional — strangler fig) and `executionMode?: 'manual' | 'automatic'` (optional). Import of `Cell` from `./cell`. Both fields optional to avoid compile-time cascade. Existing code compiles unchanged.

---

### Wave 2 — Kernel Transforms

### t-create-source-cell: Create createSourceCell transform | kernel transform
> **Center:** Source cells are identity functions — the simplest possible signal originator.
> **Traces:** ac-two-transfer-primitives, ac-cell-creation-simple
> **Depends:** t-cell-entity
> **Files:** `src/kernel/transforms/create-source-cell.ts` (create)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-create-source-cell
- **Done when**: Pure function `createSourceCell(position: Position, content?: string, title?: string) -> SourceCellData`. Generates id via nanoid. Sets type='source', createdAt/updatedAt to Date.now(), output to `{ status: 'success', text: content ?? '', durationMs: 0 }`. Default title 'Source'.

---

### t-create-ai-cell: Create createAiCell transform | kernel transform
> **Center:** AI cells are the stochastic transformer — the complement to Source that makes composition meaningful.
> **Traces:** ac-two-transfer-primitives, ac-cell-creation-simple
> **Depends:** t-cell-entity
> **Files:** `src/kernel/transforms/create-ai-cell.ts` (create)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-create-ai-cell
- **Done when**: Pure function `createAiCell(position: Position, instruction?: string, title?: string) -> AiCellData`. Generates id via nanoid. Sets type='ai', createdAt/updatedAt to Date.now(), output undefined. Default provider/model 'anthropic'/'claude-sonnet-4-20250514'. Default outputMode='text', schemaMode='single', schema=[]. Default title 'AI'.

---

### t-create-code-cell: Create createCodeCell transform | kernel transform
> **Center:** Code cells add deterministic transformation — the user can express extract, filter, format as visible steps in the signal flow.
> **Traces:** ac-code-cell, ac-cell-creation-simple
> **Depends:** t-cell-entity
> **Files:** `src/kernel/transforms/create-code-cell.ts` (create)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-create-code-cell
- **Done when**: Pure function `createCodeCell(position: Position, code?: string, title?: string) -> CodeCellData`. Generates id via nanoid. Sets type='code', createdAt/updatedAt to Date.now(), output undefined. Default timeoutMs=5000, code=''. Default title 'Code'.

---

### t-compute-terminal-cells: Create computeTerminalCells transform | kernel transform
> **Center:** Terminal cells are the topology's natural output points — computing them makes The Mix possible.
> **Traces:** ac-the-mix
> **Depends:** t-cell-entity, t-connection-gate
> **Files:** `src/kernel/transforms/compute-terminal-cells.ts` (create)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-compute-terminal-cells
- **Done when**: Pure function `computeTerminalCells(cells: Cell[], connections: Connection[]) -> Cell[]`. Returns cells with no outgoing connections where `gate === 'open'`. A cell with only latched outgoing connections IS terminal. Empty cells returns empty.

---

### t-compute-mix: Create computeMix transform | kernel transform
> **Center:** The Mix closes the composition feedback loop — the user sees what their topology produces as a whole.
> **Traces:** ac-the-mix
> **Depends:** t-cell-entity, t-connection-gate
> **Files:** `src/kernel/transforms/compute-mix.ts` (create)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-compute-mix
- **Done when**: Pure function `computeMix(cells: Cell[], connections: Connection[]) -> MixEntry[]`. `MixEntry` exported: `{ cellId: string, title: string, output: string, order: number }`. Orders terminal cells by topological depth. Cells without output produce empty string.

---

### t-build-execution-schedule: Create buildExecutionSchedule transform | kernel transform
> **Center:** The execution schedule turns a single trigger into a cascade through the topology.
> **Traces:** ac-manual-trigger-cascade
> **Depends:** t-cell-entity, t-connection-gate
> **Files:** `src/kernel/transforms/build-execution-schedule.ts` (create)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-build-execution-schedule
- **Done when**: Pure function `buildExecutionSchedule(triggeredCellId: string, cells: Cell[], connections: Connection[]) -> ExecutionStep[]`. `ExecutionStep` exported: `{ cellId: string }`. BFS downstream from triggered cell, following outgoing open connections (skips latched). Source cells excluded from schedule. Uses BFS traversal (not hard-coded topological sort) to accommodate future cycle support.

---

### t-resolve-cell-inputs: Create resolveCellInputs transform | kernel transform
> **Center:** Input resolution turns topology into data — reads the wiring and assembles what a cell receives.
> **Traces:** ac-manual-trigger-cascade, ac-fan-in-keyed-input
> **Depends:** t-cell-entity
> **Files:** `src/kernel/transforms/resolve-cell-inputs.ts` (create)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-resolve-cell-inputs
- **Done when**: Pure function `resolveCellInputs(cellId: string, cells: Cell[], connections: Connection[], outputs?: Map<string, CellOutput>) -> Record<string, string>`. Keys are source cell titles, values are output text. Checks outputs map first (cascade accumulator), falls back to cell.output. Only includes 'success' outputs. Returns empty object if no inputs.

---

### t-validate-connection-cells: Update validateConnection for cell types | kernel transform
> **Center:** Validation rules enforce the signal field's grammar — Source cells cannot receive input.
> **Traces:** ac-directed-connections
> **Depends:** t-cell-entity
> **Files:** `src/kernel/transforms/validate-connection.ts` (modify)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-validate-connection-signal-field
- **Done when**: Function gains optional `cells?: Cell[]` parameter. When cells provided: rejects connections targeting Source cells, permits multiple inputs to AI/Code cells, rejects self-connections, rejects Cell↔WorkspaceNode cross-type connections. Existing legacy logic unchanged. Cycle detection operates across both.

---

### t-update-create-connection: Update createConnection for cell source types | kernel transform
> **Center:** Connection labels from cell sources must be meaningful for topology readability.
> **Traces:** ac-directed-connections
> **Depends:** t-cell-entity
> **Files:** `src/kernel/transforms/create-connection.ts` (modify)
> **Wave:** 2
> **Status:** pending

- **Implements**: (gap — cell label generation)
- **Done when**: Function gains optional `cells?: Cell[]` parameter. When sourceId matches a cell, label generated from cell type: 'source', 'ai', 'code'. Collision avoidance works across both node and cell labels. Existing legacy logic unchanged.

---

### t-compute-staleness: Create computeStaleness transform | kernel transform
> **Center:** Health indication is topology-level feedback — the user sees signal freshness across the graph at a glance.
> **Traces:** ac-health-indication
> **Depends:** t-cell-entity
> **Files:** `src/kernel/transforms/compute-staleness.ts` (create)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-compute-staleness
- **Done when**: Pure function `computeStaleness(cells: Cell[], connections: Connection[]) -> Map<string, 'current' | 'stale' | 'error'>`. Cells with output.status === 'error' are 'error'. For each cell with upstream connections: compute deterministic hash of resolveCellInputs result; if hash differs from cell.lastInputHash (or lastInputHash is absent), cell is 'stale'. Propagates transitively downstream. Cells with matching lastInputHash are 'current'. Cells with no output are 'stale'. Cells with no upstream connections and output present are 'current'.

---

### t-update-cell-title: Create updateCellTitle transform | kernel transform
> **Center:** Title updates maintain fan-in key readability without breaking downstream references.
> **Traces:** ac-fan-in-keyed-input
> **Depends:** t-cell-entity
> **Files:** `src/kernel/transforms/update-cell-title.ts` (create)
> **Wave:** 2
> **Status:** pending

- **Implements**: da-update-cell-title
- **Done when**: Pure function `updateCellTitle(cells: Cell[], cellId: string, title: string) -> Cell[]`. Immutable update. Returns new array with updated cell.

---

### Wave 3 — Use Case + Persistence + Barrel

### t-execute-cascade: Create executeCascade use case | use case
> **Center:** The cascade is what makes trigger a topology-level decision — one action propagates through the graph.
> **Traces:** ac-manual-trigger-cascade
> **Depends:** t-build-execution-schedule, t-resolve-cell-inputs
> **Files:** `src/client/domain/use-cases/execute-cascade.ts` (create)
> **Wave:** 3
> **Status:** pending

- **Implements**: da-execute-cascade
- **Done when**: Async function `executeCascade(triggeredCellId, cells, connections, ports: { aiExecutor: AiExecutorPort, transformExecutor: TransformExecutorPort }) -> { outputs: Map<string, CellOutput>, updatedCells: Cell[] }`. Orchestrates: build schedule → iterate → resolve inputs → execute cell → set lastInputHash. Source cells produce output from content (no port). AI cells use AiExecutorPort (instruction + concatenated inputs as userMessage + provider/model + optional schema). Code cells use TransformExecutorPort (code + resolved inputs as input object + timeoutMs). After executing each cell, sets lastInputHash on the cell to a deterministic hash of the resolved inputs used for that execution. Captures durationMs. Error handling per-step (one failure doesn't abort cascade).

---

### t-storage-envelope-v11: Migrate storage envelope to version 11 | adapter
> **Center:** Without schema migration, cells vanish on reload — persistence bridges sessions.
> **Traces:** ac-two-transfer-primitives
> **Depends:** t-cell-entity, t-workspace-cells, t-connection-gate
> **Files:** `src/client/adapters/storage/storage-envelope.ts` (modify)
> **Wave:** 3
> **Status:** pending

- **Implements**: da-workspace-migration (client-side)
- **Done when**: CURRENT_VERSION bumped to 11. StorageEnvelope includes `cells?: Cell[]`, `executionMode?: 'manual' | 'automatic'`. migrate() has v10→v11 step: adds `cells: []` if absent, `executionMode: 'manual'` if absent, `gate: 'open'` to connections missing gate. toWorkspace() populates cells and executionMode with defaults. toEnvelope() serializes them.

---

### t-server-migration-v11: Create server-side migration | server adapter
> **Center:** Server migration ensures existing workspaces gain cells infrastructure transparently.
> **Traces:** ac-two-transfer-primitives
> **Depends:** t-cell-entity, t-connection-gate
> **Files:** `src/server/storage/migrate-to-signal-field.ts` (create)
> **Wave:** 3
> **Status:** pending

- **Implements**: da-workspace-migration (server-side)
- **Done when**: Idempotent function `migrateToSignalField(workspaceJson: string) -> string`. If version < 11: adds cells, executionMode, gate. Bumps to 11. Returns JSON string. Wire into GET `/api/workspaces/[id]` route.

---

### t-merge-workspace-cells: Update merge logic for cells array | server adapter
> **Center:** Without cell-aware merging, externally-added cells are silently dropped on save.
> **Traces:** ac-two-transfer-primitives
> **Depends:** t-workspace-cells
> **Files:** `src/server/storage/merge-workspace.ts` (modify)
> **Wave:** 3
> **Status:** pending

- **Implements**: (Jacobi inversion #5 — merge data loss)
- **Done when**: mergeWorkspace() merges `cells` array with same preserve-absent-unless-deleted logic as nodes/connections. When incoming has no cells (legacy client), disk cells fully preserved.

---

### t-transforms-barrel: Update kernel transforms barrel with all new exports | barrel
> **Center:** The barrel is the public API of the transforms layer.
> **Traces:** ac-two-transfer-primitives, ac-the-mix, ac-manual-trigger-cascade, ac-code-cell, ac-health-indication
> **Depends:** t-create-source-cell, t-create-ai-cell, t-create-code-cell, t-compute-terminal-cells, t-compute-mix, t-build-execution-schedule, t-resolve-cell-inputs, t-compute-staleness, t-update-cell-title
> **Files:** `src/kernel/transforms/index.ts` (modify)
> **Wave:** 3
> **Status:** pending

- **Implements**: (infrastructure — SINGLE BARREL OWNER per G4)
- **Done when**: All nine new transforms plus their exported types (MixEntry, ExecutionStep) are exported. Existing exports unchanged. This is the ONLY task that modifies the transforms barrel.

---

### Wave 4 — Adapters + Persistence Hook + Standalone UI Components

### t-persistence-cells: Update persistence hook for cells state management | hook
> **Center:** Cells must persist, load, poll, and survive tab close — without this, the signal field is ephemeral.
> **Traces:** ac-two-transfer-primitives
> **Depends:** t-workspace-cells, t-storage-envelope-v11
> **Files:** `src/client/ui/hooks/use-workspace-persistence.ts` (modify)
> **Wave:** 4
> **Status:** pending

- **Implements**: (persistence infrastructure for cells)
- **Done when**: Hook manages `cells` state (useState<Cell[]>) with cellsRef. Load populates from `workspace.cells ?? []`. scheduleSave signature: `(updatedNodes: WorkspaceNode[], updatedConnections?: Connection[], updatedCells?: Cell[])`. Save payload includes `cells: updatedCells ?? cellsRef.current` — NEVER empty array for nodes or cells. Polling absorbs externally-added cells. beforeunload flush includes cells. Returns cells, setCells, cellsRef.

---

### t-cell-flow-mapper: Add cell-to-flow mapping with card-only callbacks | adapter
> **Center:** The flow mapper makes cells visible on the canvas as compact signal indicators.
> **Traces:** ac-uniform-cell-presentation, ac-two-transfer-primitives
> **Depends:** t-cell-entity
> **Files:** `src/client/adapters/canvas/flow-node-mapper.ts` (modify)
> **Wave:** 4
> **Status:** pending

- **Implements**: da-cell-flow-mapper
- **Done when**: New `CellCardCallbacks` type: onOpenScope, onTrigger, onDelete, onDuplicate, onResizeEnd. New `CellFlowNodeData` type: cellId, cellType, title, output?, health?, hasInput, callbacks. New function `cellsToFlowNodes(cells, connections, callbacks, healthMap?) -> Node[]` maps all cell types to xyflow nodes with type 'cellNode'. Existing toFlowNodes unchanged.

---

### t-canvas-binding-cells: Update useCanvasBinding for cells | adapter
> **Center:** The canvas binding bridges cell domain state to xyflow rendering.
> **Traces:** ac-uniform-cell-presentation
> **Depends:** t-cell-flow-mapper
> **Files:** `src/client/adapters/canvas/use-canvas-binding.ts` (modify)
> **Wave:** 5
> **Status:** pending

- **Implements**: da-cell-flow-mapper (binding portion)
- **Done when**: UseCanvasBindingArgs gains: cells?, cellCardCallbacks?, onCellMove?, onNodeDoubleClick?. Flow nodes sync combines legacy + cell nodes. onNodeDragStop routes to onCellMove for cellNode type. onNodeDoubleClick callback fires for all node types (WorkspaceView uses it for Scope).

---

### t-cell-shell: Create CellShell component with health dot | component
> **Center:** CellShell enforces visual uniformity — all cells look identical at rest.
> **Traces:** ac-uniform-cell-presentation, ac-health-indication
> **Depends:** (none)
> **Files:** `src/client/ui/components/CellShell.tsx` (create)
> **Wave:** 4
> **Status:** pending

- **Implements**: da-cell-shell
- **Done when**: Props: cellId, title, hasInput, health?, onDelete, onDuplicate, onResizeEnd, children. Uses bg-background text-foreground border-border rounded-lg. NodeResizer visible on hover. Source Handle on right always. Target Handle on left only when hasInput. Health dot in header: green (current), amber (stale), red (error), gray (no output). Delete/duplicate buttons on hover.

---

### t-mix-panel: Create MixPanel component | component
> **Center:** The Mix closes the composition feedback loop — always visible during composition.
> **Traces:** ac-the-mix
> **Depends:** (none)
> **Files:** `src/client/ui/components/MixPanel.tsx` (create)
> **Wave:** 4
> **Status:** pending

- **Implements**: da-mix-panel
- **Done when**: Props: entries: MixEntry[], collapsible?: boolean. Right-side panel, w-[300px], h-full, border-l. bg-muted, text-muted-foreground headers. Each entry: cell title as header, output text as body. Empty state: "No terminal cells." Scrollable.

---

### t-cell-toolbar: Update Toolbar with Source/AI/Code primary + Legacy collapsible | component
> **Center:** Three creation buttons reduce classification burden — the user thinks in primitives, not legacy types.
> **Traces:** ac-cell-creation-simple
> **Depends:** (none)
> **Files:** `src/client/ui/components/Toolbar.tsx` (modify)
> **Wave:** 4
> **Status:** pending

- **Implements**: da-cell-toolbar
- **Done when**: Props gain: onAddSource?, onAddAi?, onAddCode?, showLegacy?. Three primary buttons: "+ Source", "+ AI", "+ Code". Legacy buttons (Markdown, Transform, Chat, AI Transform, PDF) in a collapsible "Legacy" section, collapsed by default. Primary buttons use default Button variant. Legacy buttons use outline variant.

---

### t-scope-source-editor: Create ScopeSourceEditor component | component
> **Center:** Source cells need a rich editing surface — markdown with preview toggle — that lives in The Scope, not the card.
> **Traces:** ac-the-scope
> **Depends:** (none)
> **Files:** `src/client/ui/components/ScopeSourceEditor.tsx` (create)
> **Wave:** 4
> **Status:** pending

- **Implements**: da-scope-source-editor
- **Done when**: Props: content, onContentChange. Renders markdown editor with edit/preview toggle (adapts MarkdownContent pattern: ReactMarkdown rendering, draft state, Switch toggle). Full-width. No xyflow constraints needed (outside ReactFlow tree). 'use client' directive.

---

### t-scope-code-editor: Create ScopeCodeEditor component | component
> **Center:** Code cells need a proper code editor with input awareness and timeout control.
> **Traces:** ac-the-scope, ac-code-cell
> **Depends:** (none)
> **Files:** `src/client/ui/components/ScopeCodeEditor.tsx` (create)
> **Wave:** 4
> **Status:** pending

- **Implements**: da-scope-code-editor
- **Done when**: Props: code, timeoutMs, inputLegend: InputLegendEntry[], onCodeChange, onTimeoutChange. Renders lazy-loaded CodeMirror editor (adapts TransformCodeEditor pattern). Input legend section showing label → sourceName. Timeout dropdown with presets (1s/5s/10s/30s/60s). Full-width. 'use client' directive.

---

### t-scope-ai-editor: Create ScopeAiEditor component | component
> **Center:** AI cells need model selection, structured output, and instruction editing — the full composition control surface.
> **Traces:** ac-the-scope, ac-two-transfer-primitives
> **Depends:** (none)
> **Files:** `src/client/ui/components/ScopeAiEditor.tsx` (create)
> **Wave:** 4
> **Status:** pending

- **Implements**: da-scope-ai-editor
- **Done when**: Props: instruction, provider, model, outputMode, schemaMode, schema, roster: ModelRosterEntry[], onInstructionChange, onModelChange, onOutputModeChange, onSchemaChange, onSchemaModeChange. Renders: instruction textarea with placeholder, model selector Popover (adapts AiTransformNode pattern: grouped by provider, checkmark on current), output mode toggle (text/structured), SchemaBuilder when structured, schema mode toggle (single/collection). 'use client' directive.

---

### t-scope-output-column: Create ScopeOutputColumn component | component
> **Center:** The output column with trigger completes the edit→run→inspect cycle entirely within The Scope.
> **Traces:** ac-the-scope, ac-manual-trigger-cascade
> **Depends:** (none)
> **Files:** `src/client/ui/components/ScopeOutputColumn.tsx` (create)
> **Wave:** 4
> **Status:** pending

- **Implements**: da-scope-view (output portion)
- **Done when**: Props: output?: CellOutput, health?: 'current' | 'stale' | 'error', cellType, onTrigger?, structuredData?. Renders: trigger/run button at top (AI and Code cells only, disabled when running), full output text (scrollable, not truncated), health dot with label, duration display, error message display. StructuredOutputDisplay for structured AI output. Running state shows loading indicator. 'use client' directive.

---

### t-scope-inputs-column: Create ScopeInputsColumn component | component
> **Center:** The inputs column shows topological context — what this cell receives from the graph — reinforcing compositional thinking during editing.
> **Traces:** ac-the-scope, ac-fan-in-keyed-input
> **Depends:** (none)
> **Files:** `src/client/ui/components/ScopeInputsColumn.tsx` (create)
> **Wave:** 4
> **Status:** pending

- **Implements**: da-scope-view (inputs portion)
- **Done when**: Props: inputs: Array<{ cellId: string, title: string, text: string }>, onNavigateToCell: (cellId: string) => void. Renders each input: source cell title as header, output text as body (truncated with expand), click handler calls onNavigateToCell. Empty state for Source cells: "Source cells have no inputs." 'use client' directive.

---

### Wave 5 — Hooks + Composite Components

### t-use-scope-state: Create useScopeState hook | hook
> **Center:** The Scope state management enables the card→Scope→canvas interaction loop.
> **Traces:** ac-the-scope
> **Depends:** (none)
> **Files:** `src/client/ui/hooks/use-scope-state.ts` (create)
> **Wave:** 5
> **Status:** pending

- **Implements**: da-use-scope-state
- **Done when**: Hook returns `{ scopeCellId: string | null, openScope: (cellId: string) => void, closeScope: () => void }`. One Scope at a time. openScope sets the focused cell ID. closeScope clears it. ESC key listener closes Scope when open. 'use client' directive.

---

### t-use-scope-data: Create useScopeData hook | hook
> **Center:** Reactive input resolution makes The Scope a live view of the topology, not a stale snapshot.
> **Traces:** ac-the-scope, ac-fan-in-keyed-input
> **Depends:** t-resolve-cell-inputs
> **Files:** `src/client/ui/hooks/use-scope-data.ts` (create)
> **Wave:** 5
> **Status:** pending

- **Implements**: da-use-scope-data
- **Done when**: Hook `useScopeData(cellId: string | null, cells: Cell[], connections: Connection[]) -> { inputs: Array<{ cellId: string, title: string, text: string }>, inputLegend: InputLegendEntry[] }`. Calls resolveCellInputs for the focused cell. Builds inputs array with cell metadata for ScopeInputsColumn. Builds inputLegend for ScopeCodeEditor. Memoized — recomputes on cellId, cells, or connections change. Returns empty arrays when cellId is null.

---

### t-use-cascade: Create useCascade hook | hook
> **Center:** The cascade hook bridges the trigger UI action to the execution engine.
> **Traces:** ac-manual-trigger-cascade
> **Depends:** t-execute-cascade, t-persistence-cells
> **Files:** `src/client/ui/hooks/use-cascade.ts` (create)
> **Wave:** 5
> **Status:** pending

- **Implements**: da-use-cascade
- **Done when**: Hook `useCascade({ cells, connections, setCells, cellsRef, nodesRef, scheduleSave })` returns `{ triggerCell: (cellId: string) -> Promise<void> }`. Gets aiExecutor and transformExecutor from useAdapters(). On trigger: calls executeCascade, updates each cell's output in state via setCells (immutable), calls scheduleSave with nodesRef.current (NEVER empty array).

---

### t-use-mix: Create useMix hook | hook
> **Center:** The Mix hook makes topology-level feedback reactive.
> **Traces:** ac-the-mix
> **Depends:** t-compute-mix
> **Files:** `src/client/ui/hooks/use-mix.ts` (create)
> **Wave:** 5
> **Status:** pending

- **Implements**: da-use-mix
- **Done when**: Hook `useMix(cells: Cell[], connections: Connection[]) -> MixEntry[]`. Memoized via useMemo on cells/connections.

---

### t-use-health: Create useHealth hook | hook
> **Center:** Health computation makes signal freshness visible as a reactive derived state.
> **Traces:** ac-health-indication
> **Depends:** t-compute-staleness
> **Files:** `src/client/ui/hooks/use-health.ts` (create)
> **Wave:** 5
> **Status:** pending

- **Implements**: da-compute-staleness (hook wrapper)
- **Done when**: Hook `useHealth(cells: Cell[], connections: Connection[]) -> Map<string, 'current' | 'stale' | 'error'>`. Memoized via useMemo on cells/connections. Calls computeStaleness.

---

### t-use-cell-operations: Create useCellOperations hook | hook
> **Center:** Extracting cell CRUD into a dedicated hook keeps WorkspaceView manageable and prevents the integration task from becoming a monolith.
> **Traces:** ac-two-transfer-primitives, ac-cell-creation-simple, ac-code-cell
> **Depends:** t-persistence-cells
> **Files:** `src/client/ui/hooks/use-cell-operations.ts` (create)
> **Wave:** 5
> **Status:** pending

- **Implements**: (architectural extraction)
- **Done when**: Hook takes `{ cells, setCells, cellsRef, nodesRef, connections, connectionsRef, setConnections, scheduleSave, trackDeletion, roster }`. Returns handlers: handleAddSourceCell, handleAddAiCell, handleAddCodeCell, handleCellContentChange, handleCellInstructionChange, handleCellCodeChange, handleCellTitleChange, handleCellModelChange, handleCellTimeoutChange, handleCellOutputModeChange, handleCellSchemaChange, handleCellSchemaModeChange, handleCellDelete (with orphaned connection cleanup), handleCellDuplicate, handleCellMove, handleCellResize. Source cell content changes auto-update output (identity). All handlers call scheduleSave with nodesRef.current (NEVER empty array).

---

### t-cell-node: Create CellNode with output preview + creation state machine | component
> **Center:** CellNode forces topology-reading over classification-reading — compact uniform cards that expand into The Scope for editing.
> **Traces:** ac-uniform-cell-presentation, ac-output-preview-as-identity, ac-cell-creation-simple
> **Depends:** t-cell-shell, t-cell-flow-mapper
> **Files:** `src/client/ui/components/CellNode.tsx` (create)
> **Wave:** 5
> **Status:** pending

- **Implements**: da-cell-node-component
- **Done when**: Single xyflow node component registered as 'cellNode'. Receives CellFlowNodeData via data prop. Renders inside CellShell. **Creation state machine**: empty cells (no content/code/instruction) show inline textarea with nodrag/nowheel classes; transition to preview mode on BLUR (not on content change). **Preview mode**: truncated output preview (~3 lines, line-clamp-3). Source: shows content. Code/AI: shows last output text or "No output yet." Running state shows loading indicator. Error shows error message. Trigger button on hover for AI/Code cells (nodrag class). No inline editing once cell has content — double-click opens Scope.

---

### t-scope-view: Create ScopeView container | component
> **Center:** The Scope is the core interaction model — where compositionally-aware configuration happens.
> **Traces:** ac-the-scope
> **Depends:** t-scope-source-editor, t-scope-code-editor, t-scope-ai-editor, t-scope-output-column, t-scope-inputs-column
> **Files:** `src/client/ui/components/ScopeView.tsx` (create)
> **Wave:** 5
> **Status:** pending

- **Implements**: da-scope-view
- **Done when**: Bottom panel component. Props: cell (focused Cell), inputs (from useScopeData), inputLegend, health, onNavigateToCell, onTrigger, plus all editing callbacks (onContentChange, onInstructionChange, onCodeChange, onModelChange, onTimeoutChange, onOutputModeChange, onSchemaChange, onSchemaModeChange), roster, onClose. Three-column CSS Grid layout: inputs (20%) | editor (50%) | output (30%). Resizable height via drag handle (~40% default). Close button in header. Delegates to ScopeSourceEditor/ScopeCodeEditor/ScopeAiEditor based on cell.type. Renders ScopeInputsColumn on left, ScopeOutputColumn on right. 'use client' directive.

---

### Wave 6 — Integration

### t-canvas-cell-registration: Register cellNode type in Canvas | integration
> **Center:** Without registration, cells exist in state but are invisible on canvas.
> **Traces:** ac-two-transfer-primitives, ac-uniform-cell-presentation
> **Depends:** t-cell-node
> **Files:** `src/client/ui/components/Canvas.tsx` (modify)
> **Wave:** 6
> **Status:** pending

- **Implements**: (integration wiring)
- **Done when**: Canvas nodeTypes includes `cellNode: CellNode`. Import added. All existing node types preserved.

---

### t-use-workspace-cells: Extend useWorkspace hook to expose cell state | hook
> **Center:** Without cell state exposure, no hook or component can read or mutate cells — this is the data foundation for all integration.
> **Traces:** ac-two-transfer-primitives, ac-directed-connections
> **Depends:** t-persistence-cells
> **Files:** `src/client/ui/hooks/use-workspace.ts` (modify)
> **Wave:** 7
> **Status:** pending

- **Implements**: (integration wiring — state exposure)
- **Done when**: (1) useWorkspace extended to expose cells, setCells, cellsRef from persistence. (2) handleCreateConnection passes cellsRef.current to validateConnection.

---

### t-workspace-view-hooks: Wire cell hooks into WorkspaceView | integration
> **Center:** Hook wiring connects the signal-field domain logic to the UI orchestrator — cascade, mix, health, and scope become live reactive state.
> **Traces:** ac-manual-trigger-cascade, ac-the-mix, ac-health-indication, ac-the-scope, ac-fan-in-keyed-input
> **Depends:** t-use-workspace-cells, t-use-cascade, t-use-mix, t-use-health, t-use-scope-state, t-use-scope-data, t-use-cell-operations, t-cell-flow-mapper, t-canvas-binding-cells, t-canvas-cell-registration
> **Files:** `src/client/ui/components/WorkspaceView.tsx` (modify)
> **Wave:** 8
> **Status:** pending

- **Implements**: (integration wiring — hook composition)
- **Done when**: (1) useCellOperations called with cell state + deps, returns all cell handlers. (2) useCascade called, returns triggerCell. (3) useMix called, returns mixEntries. (4) useHealth called, returns healthMap. (5) useScopeState called, returns scopeCellId/openScope/closeScope. (6) useScopeData called with scopeCellId, returns inputs/inputLegend. (7) CellCardCallbacks created: onOpenScope→openScope, onTrigger→triggerCell, onDelete/onDuplicate/onResizeEnd from cell operations. (8) useCanvasBinding receives cells + cardCallbacks + onCellMove + onNodeDoubleClick→openScope.

---

### t-workspace-view-layout: Render cell UI components in WorkspaceView layout | integration
> **Center:** Layout wiring makes composition visible — the canvas, Mix, Scope, and toolbar converge into a spatial medium the user can see and interact with.
> **Traces:** ac-cell-creation-simple, ac-the-scope, ac-the-mix, ac-output-preview-as-identity, ac-uniform-cell-presentation, ac-code-cell, ac-directed-connections
> **Depends:** t-workspace-view-hooks, t-cell-toolbar, t-mix-panel, t-scope-view
> **Files:** `src/client/ui/components/WorkspaceView.tsx` (modify)
> **Wave:** 9
> **Status:** pending

- **Implements**: (integration wiring — layout and rendering)
- **Done when**: (1) Layout: flex column with canvas area (flex-1) + ScopeView (conditional, resizable bottom panel). MixPanel on right spanning full height. (2) ScopeView rendered when scopeCellId is set, receives focused cell + all editing callbacks + inputs + inputLegend + health + roster + triggerCell + onNavigateToCell + onClose. (3) Toolbar renders with Source/AI/Code creation + Legacy collapsible.

---

### Wave 10 — Testing

### t-kernel-tests: Unit tests for kernel transforms | test
> **Center:** Tests verify that the signal-field primitives compose correctly at the kernel level.
> **Traces:** ac-two-transfer-primitives, ac-code-cell, ac-the-mix, ac-manual-trigger-cascade, ac-health-indication
> **Depends:** t-transforms-barrel, t-execute-cascade
> **Files:** `src/kernel/transforms/__tests__/signal-field.test.ts` (create)
> **Wave:** 10
> **Status:** pending

- **Implements**: (verification — G1 guardrail)
- **Done when**: Tests cover: (1) createSourceCell/createAiCell/createCodeCell produce correct types. (2) computeTerminalCells returns cells with no outgoing open connections. (3) computeMix orders by topological depth. (4) buildExecutionSchedule follows BFS, skips latched, excludes Source. (5) resolveCellInputs returns keyed inputs from connected cells. (6) computeStaleness propagates downstream. (7) executeCascade with mock ports executes Source→Code→AI chain correctly. All tests pass.

---

### t-smoke-test: Manual smoke test of complete signal-field flow | test
> **Center:** The smoke test verifies the center is served: composition over configuration with observable signal flow.
> **Traces:** ac-two-transfer-primitives, ac-the-scope, ac-the-mix, ac-manual-trigger-cascade, ac-cell-creation-simple, ac-health-indication
> **Depends:** t-workspace-view-layout
> **Files:** (none — manual verification)
> **Wave:** 10
> **Status:** pending

- **Implements**: (verification — G3 guardrail)
- **Done when**: Manual test executed and passing: (1) Create Source cell — verify inline editor appears (creation state machine). Type content, click away — verify transition to output preview. (2) Double-click Source — verify Scope opens with markdown editor. (3) Create Code cell — write extraction logic in Scope. (4) Create AI cell — select model in Scope, write instruction, enable structured output with schema. (5) Wire Source→Code→AI. (6) Trigger from Code cell's Scope — verify cascade runs all three. (7) Verify health dots update (stale→running→current). (8) Verify Mix shows terminal output. (9) Verify Scope input navigation: click input in AI Scope → navigates to Code cell on canvas. (10) Reload page — verify cells persist. (11) Legacy nodes still render and function.

---

## Execution Waves

| Wave | Tasks | Depends on waves | Shared file risks |
|------|-------|-------------------|-------------------|
| 1 | t-cell-entity, t-connection-gate | (none) | `kernel/entities/index.ts` modified by t-cell-entity only |
| 2 | t-workspace-cells, t-create-source-cell, t-create-ai-cell, t-create-code-cell, t-compute-terminal-cells, t-compute-mix, t-build-execution-schedule, t-resolve-cell-inputs, t-validate-connection-cells, t-update-create-connection, t-compute-staleness, t-update-cell-title | Wave 1 | All create new files or modify unique files. Barrel NOT touched (Wave 3). |
| 3 | t-execute-cascade, t-storage-envelope-v11, t-server-migration-v11, t-merge-workspace-cells, t-transforms-barrel | Wave 2 | `transforms/index.ts` modified by t-transforms-barrel ONLY (G4). |
| 4 | t-persistence-cells, t-cell-flow-mapper, t-cell-shell, t-mix-panel, t-cell-toolbar, t-scope-source-editor, t-scope-code-editor, t-scope-ai-editor, t-scope-output-column, t-scope-inputs-column | Wave 3 | `use-workspace-persistence.ts` by t-persistence-cells only. `flow-node-mapper.ts` by t-cell-flow-mapper only. `Toolbar.tsx` by t-cell-toolbar only. |
| 5 | t-canvas-binding-cells, t-use-scope-state, t-use-scope-data, t-use-cascade, t-use-mix, t-use-health, t-use-cell-operations, t-cell-node, t-scope-view | Wave 4 | `use-canvas-binding.ts` by t-canvas-binding-cells only. All others create new files. |
| 6 | t-canvas-cell-registration | Wave 5 | `Canvas.tsx` only |
| 7 | t-use-workspace-cells | Wave 4 | `use-workspace.ts` only |
| 8 | t-workspace-view-hooks | Wave 5, Wave 6, Wave 7 | `WorkspaceView.tsx` only |
| 9 | t-workspace-view-layout | Wave 8 | `WorkspaceView.tsx` only |
| 10 | t-kernel-tests, t-smoke-test | Wave 9 | (none) |
