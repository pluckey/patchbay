---
feature: signal-field
center: "This feature shifts the user's primary activity from configuring individual components to composing connections between them, and from prescribing behavior to observing emergence."
stage: design
intensity: deep
loop_iterations: 1
last_modified: 2026-04-05T22:00:00Z
---

## Panel

**Robert C. Martin (Uncle Bob)** -- SOLID principles, clean architecture, component cohesion. Verified the dependency graph: all source code dependencies point inward. Proposed the Cell discriminated union, insisted the execution engine be a standalone use case (not embedded in flow mapper or persistence hook), identified The Mix as a pure kernel transform. Signed off on the final dependency graph.

**Martin Fowler** -- refactoring, enterprise patterns, evolutionary design. Advocated the Strangler Fig migration strategy: new Cell types alongside legacy WorkspaceNode types, legacy creation disabled, gradual replacement. Proposed the Interpreter pattern for execution scheduling: model the schedule as data, swap scheduling strategies without touching execution logic.

**Kent Beck** -- extreme programming, simple design, test-driven development. Insisted on the minimum change set for Phase 1a: add new types alongside existing, don't replace. Proposed the test-first strategy: all core logic (createSourceCell, computeTerminalCells, executeCascade) testable without React, xyflow, or Next.js. Pushed back on premature cycle-aware engine design with YAGNI, accepted Gall's structural accommodation.

**Valentino Braitenberg** -- synthetic psychology, vehicles framework. Validated that Source + AI produce meaningful emergent composition through three vehicle analyses: direct excitation (Source->AI), comparison via fan-out, and refinement via serial chain. Confirmed the primitives are simple enough -- complexity emerges from connection, not from internal sophistication. Insisted CellShell use port topology (handle presence) as the only type differentiator.

**John Gall** -- systemantics, Gall's Law. Verified Phase 1a is a simple working system end-to-end (create, type, wire, trigger, observe Mix). Non-negotiable requirement: the execution engine must take a pluggable scheduling function, not hard-code topological sort, to avoid a Phase 3 rewrite. Accepted the strangler fig over a clean-break approach as less complex.

**Carl Gustav Jacob Jacobi (The Inverter)** -- "man muss immer umkehren." Five inversions: (1) The decomposition enables but cannot guarantee the activity shift -- the center is aspirational. (2) The Mix could steal attention from the canvas -- must be subordinate in visual weight. (3) Uniform presentation may harm Phase 1a usability with only two types -- port topology is a subtle differentiator. (4) Manual cascade is punctuation in a sentence of configuration -- Phase 2 automatic mode is where the center truly activates. (5) Legacy nodes create visual pollution against the signal-field aesthetic -- render them in CellShell as read-only. Final verdict: the decomposition is architecturally sound; risks are product-level, not structural.

---

## System Decomposition

### Kernel Entities

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|---|---|---|---|---|---|
| da-cell-entity | Cell | Kernel Entity | Create new discriminated union: SourceCellData, AiCellData, CodeCellData (Phase 1b). BaseCell: id, title, position, dimensions?, createdAt, updatedAt, output?: CellOutput. CellOutput: { status: 'success' \| 'error' \| 'running', text?: string, error?: string, durationMs?: number } | Replaces WorkspaceNode for new cells. Coexists with legacy types via strangler fig. Title is user-editable, used as fan-in key. | ac-two-transfer-primitives, ac-code-cell, ac-uniform-cell-presentation |
| da-cell-health | CellHealth | Kernel Entity | Add health: 'current' \| 'stale' \| 'error' to BaseCell in Phase 1b | Derived from comparison of input state at last execution vs. current input state | ac-health-indication |
| da-connection-gate | Connection (extended) | Kernel Entity | Add gate: 'open' \| 'latched' field to Connection entity (default 'open') | Present in schema from Phase 1a. Always 'open' until Phase 3 enables toggling. | ac-connection-gate, dc-cycle-aware-engine |
| da-execution-mode | Workspace (extended) | Kernel Entity | Add executionMode: 'manual' \| 'automatic' to Workspace entity (default 'manual') | Present in schema from Phase 1a. Always 'manual' until Phase 2 enables toggling. | ac-execution-mode-toggle |

### Kernel Transforms

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|---|---|---|---|---|---|
| da-create-source-cell | createSourceCell | Kernel Transform | New file `create-source-cell.ts`. Pure function: (position, content?, title?) -> SourceCellData | Generates id via nanoid, sets type='source', output = { status: 'success', text: content } (identity function: content IS output) | ac-two-transfer-primitives, ac-cell-creation-simple |
| da-create-ai-cell | createAiCell | Kernel Transform | New file `create-ai-cell.ts`. Pure function: (position, instruction?, title?) -> AiCellData | Generates id via nanoid, sets type='ai', default provider/model from roster | ac-two-transfer-primitives, ac-cell-creation-simple |
| da-create-code-cell | createCodeCell | Kernel Transform | New file `create-code-cell.ts` (Phase 1b). Pure function: (position, code?, title?) -> CodeCellData | Generates id via nanoid, sets type='code', default timeoutMs | ac-code-cell |
| da-compute-terminal-cells | computeTerminalCells | Kernel Transform | New file `compute-terminal-cells.ts`. Pure function: (cells, connections) -> Cell[] | Returns cells with no outgoing open (non-latched) connections. Gate-aware from Phase 1a. | ac-the-mix |
| da-compute-mix | computeMix | Kernel Transform | New file `compute-mix.ts`. Pure function: (cells, connections) -> MixEntry[] | MixEntry: { cellId, title, output: string, order: number }. Orders by topological depth. Preserves provenance. | ac-the-mix |
| da-build-execution-schedule | buildExecutionSchedule | Kernel Transform | New file `build-execution-schedule.ts`. Pure function: (triggeredCellId, cells, connections) -> ExecutionStep[] | BFS downstream from triggered cell. Respects gate property (skips latched connections). Returns ordered list of cellIds to execute. Source cells excluded (they are their own output). Architecture accommodates cycles by not hard-coding topological sort as sole mechanism. | ac-manual-trigger-cascade, dc-cycle-aware-engine |
| da-validate-connection-signal-field | validateConnection (updated) | Kernel Transform | Modify existing `validate-connection.ts`. Reject connections targeting Source cells. Permit multiple inputs to AI/Code cells. | Phase 1a: still rejects cycles. Phase 3: cycle rejection lifted when gate support is active. Rejects cross-type connections (Cell↔WorkspaceNode). Strangler fig boundary enforced at validation time. Backward-compatible with legacy node types. | ac-directed-connections |
| da-resolve-cell-inputs | resolveCellInputs | Kernel Transform | New file `resolve-cell-inputs.ts`. Pure function: (cellId, cells, connections, outputs?) -> Record<string, string> | Returns Record&lt;string, string&gt; keyed by source cell title. Phase 1a: single or multiple inputs each keyed by title. Phase 1b: adds user-controllable ordering. Uses cached outputs from prior cascade steps. | ac-fan-in-keyed-input, ac-manual-trigger-cascade |
| da-update-cell-title | updateCellTitle | Kernel Transform | New file `update-cell-title.ts` (Phase 1b). Pure function: (cell, newTitle) -> Cell | Immutable update of title field | ac-fan-in-keyed-input |
| da-compute-staleness | computeStaleness | Kernel Transform | New file `compute-staleness.ts` (Phase 1b). Pure function: (cells, connections) -> Map<cellId, CellHealth> | Propagates staleness downstream: if a cell's input changed since last execution, it and all downstream are stale | ac-health-indication |
| da-cell-inner-state | extractCellInnerState | Kernel Transform | New file `extract-cell-inner-state.ts` (Phase 2). Pure function: (cell) -> ChatContext | Source: content. Code: code + last result + errors. AI: instruction + last input + last output + model. | ac-chat-observation |
| da-toggle-gate | toggleGate | Kernel Transform | New file `toggle-gate.ts` (Phase 3). Pure function: (connection) -> Connection | Toggles gate between 'open' and 'latched' | ac-connection-gate |

### Use Cases

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|---|---|---|---|---|---|
| da-execute-cascade | executeCascade | Use Case | New file `execute-cascade.ts`. Orchestrates: build schedule -> iterate steps -> resolve inputs -> execute cell -> collect outputs | Takes ports: { aiExecutor: AiExecutorPort, transformExecutor?: TransformExecutorPort }. Returns Map<cellId, CellOutput>. Source cells produce output from content (no port needed). AI cells use AiExecutorPort. Code cells use TransformExecutorPort (Phase 1b). | ac-manual-trigger-cascade, dc-cycle-aware-engine |
| da-chat-write-access | chatModifyCell | Use Case | New file `chat-modify-cell.ts` (Phase 2). Applies chat-suggested modifications to a cell's configuration | Receives cell + modification, returns updated cell. Validates modification is within cell type's editable fields. | ac-chat-intervention |

### Adapters

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|---|---|---|---|---|---|
| da-cell-flow-mapper | Cell flow mapper | Adapter | Update `flow-node-mapper.ts`. Add mapping for Cell types -> single 'cellNode' xyflow type. Legacy WorkspaceNode types continue mapping to existing xyflow types. | Single callback set for all cell types: onTitleChange, onContentChange (Source), onInstructionChange (AI), onCodeChange (Code), onTrigger, onDelete, onDuplicate, onResizeEnd | ac-uniform-cell-presentation |
| da-workspace-migration | Workspace migration | Adapter (server) | New file `server/storage/migrate-to-signal-field.ts`. Idempotent migration: markdown->source, transform->code, ai-transform->ai. PDF and chat nodes preserved as legacy read-only. | Triggered lazily on workspace load. Writes migration marker to workspace data. Preserves original data as backup. | (data preservation) |
| da-drag-from-port-creation | Drag-from-port creation | Adapter | New handler in canvas adapter (Phase 1b). Intercepts xyflow's onConnectEnd when dropping on empty canvas. Creates new cell + connection. | Uses xyflow's screenToFlowPosition for placement. Triggers cell type selection (Source/AI/Code). | ac-cell-creation-compositional |

### Components

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|---|---|---|---|---|---|
| da-cell-shell | CellShell | Component | New file `CellShell.tsx`. Replaces NodeShell for cell types. | Props: hasInput (controls target Handle), title, health?, onDelete, onDuplicate, onResizeEnd. Uniform: bg-background, border-border, rounded-lg. No type badges. | ac-uniform-cell-presentation |
| da-cell-node-component | CellNode | Component | New file `CellNode.tsx`. Single xyflow node component for all cell types. | Renders inside CellShell. Shows: title (editable), output preview (truncated), inline editor (Phase 1a: simple text area). Trigger button on hover. No type-specific coloring. | ac-uniform-cell-presentation, ac-output-preview-as-identity, ac-cell-creation-simple |
| da-mix-panel | MixPanel | Component | New file `MixPanel.tsx`. Always-visible panel showing terminal cell outputs. | Persistent right-side panel. Shows MixEntry[] with cell titles as headers and output text. Updates on topology or output changes. Subordinate visual weight to canvas (narrow panel, not takeover). | ac-the-mix |
| da-cell-toolbar | CellToolbar | Component | New file or modify `Toolbar.tsx`. Offers Source and AI creation (Phase 1a), +Code (Phase 1b). | Two buttons in Phase 1a. Three in Phase 1b. Adds to current toolbar. Legacy node creation buttons remain during strangler fig, to be retired only when cell types subsume legacy capabilities. | ac-cell-creation-simple |
| da-scope-view | ScopeView | Component | New file `ScopeView.tsx` (Phase 1b). Three-column focused editing view. | Left: connected inputs (navigable, click -> return to canvas with source selected). Center: type-specific editor. Right: current output + health. I/O visual weight >= editor. One Scope open at a time. | ac-the-scope |
| da-chat-overlay | ChatOverlay | Component | New file `ChatOverlay.tsx` (Phase 2). Chat panel overlaid on selected cell. | Not a cell type. Receives inner state via extractCellInnerState. Can modify observed cell. Ephemeral history (component state). | ac-chat-observation, ac-chat-intervention |

### Hooks

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|---|---|---|---|---|---|
| da-use-cascade | useCascade | Hook | New file `use-cascade.ts`. Bridges trigger UI action to executeCascade use case. | Receives ports from useAdapters(). Returns triggerCell(cellId) -> Promise<void>. Updates cell outputs in workspace state after cascade completes. | ac-manual-trigger-cascade |
| da-use-mix | useMix | Hook | New file `use-mix.ts`. Computes Mix state from workspace cells + connections. | Calls computeTerminalCells + computeMix. Memoized. Updates on topology or output changes. | ac-the-mix |

---

## Relationship Map

```
KERNEL ENTITIES (innermost -- depend on nothing)
  da-cell-entity ──────────────────────────────────┐
  da-cell-health (extends da-cell-entity)           │
  da-connection-gate (extends Connection)           │
  da-execution-mode (extends Workspace)             │
                                                    │
KERNEL TRANSFORMS (depend on entities only)         │
  da-create-source-cell ← da-cell-entity            │
  da-create-ai-cell ← da-cell-entity                │
  da-create-code-cell ← da-cell-entity              │
  da-compute-terminal-cells ← da-cell-entity, Connection
  da-compute-mix ← da-cell-entity, Connection       │
  da-build-execution-schedule ← da-cell-entity, Connection (uses da-connection-gate)
  da-validate-connection-signal-field ← da-cell-entity, Connection
  da-resolve-cell-inputs ← da-cell-entity, Connection
  da-update-cell-title ← da-cell-entity             │
  da-compute-staleness ← da-cell-entity, Connection │
  da-cell-inner-state ← da-cell-entity              │
  da-toggle-gate ← Connection                       │
                                                    │
USE CASES (depend on kernel + ports)                │
  da-execute-cascade                                │
    ├── uses da-build-execution-schedule             │
    ├── uses da-resolve-cell-inputs                  │
    ├── consumes AiExecutorPort                      │
    └── consumes TransformExecutorPort (Phase 1b)    │
  da-chat-write-access ← da-cell-entity             │
                                                    │
ADAPTERS (depend on kernel + ports + framework)     │
  da-cell-flow-mapper                               │
    ├── imports da-cell-entity                       │
    └── imports @xyflow/react types                  │
  da-workspace-migration                            │
    └── imports da-cell-entity + legacy WorkspaceNode│
  da-drag-from-port-creation                        │
    ├── uses da-create-source-cell / da-create-ai-cell
    └── uses createConnection                        │
                                                    │
HOOKS (depend on kernel transforms + use cases + useAdapters)
  da-use-cascade                                    │
    ├── imports da-execute-cascade                   │
    └── consumes useAdapters() for ports             │
  da-use-mix                                        │
    ├── imports da-compute-terminal-cells            │
    └── imports da-compute-mix                       │
                                                    │
COMPONENTS (depend on other components, kernel types via props)
  da-cell-shell ← @xyflow/react (Handle, NodeResizer)
  da-cell-node-component ← da-cell-shell             │
  da-mix-panel ← receives MixEntry[] via props       │
  da-cell-toolbar ← receives callbacks via props     │
  da-scope-view ← receives cell data via props       │
  da-chat-overlay ← receives inner state via props   │
```

### Signal Flow (runtime)

```
User creates Source cell ──→ types content ──→ output = content (identity)
                                                    │
User draws connection ──────────────────────────────┤
                                                    ▼
User creates AI cell ──→ writes instruction ──→ [awaits trigger]
                                                    │
User triggers AI cell ──→ da-use-cascade            │
  ├── da-build-execution-schedule: [AI cell]        │
  ├── da-resolve-cell-inputs: Source.output → AI    │
  ├── da-execute-cascade: AiExecutorPort.execute()  │
  └── AI cell output updated                        │
                                                    ▼
da-use-mix recomputes ──→ da-mix-panel renders terminal outputs
```

### Composition Root Wiring (page.tsx changes)

```
page.tsx
  ├── WorkspaceManagerProvider (unchanged)
  │     ├── WorkspaceSidepanel (unchanged)
  │     └── CanvasProvider (unchanged)
  │           ├── Canvas.tsx (add 'cellNode' to nodeTypes)
  │           ├── CellToolbar (replaces Toolbar)
  │           ├── MixPanel (NEW -- always visible)
  │           └── WorkspaceView (updated for cell operations)
  └── Adapters: existing + no new ports needed for Phase 1a
```

---

## Behavior Plan

### Phase 1a Behaviors

**bh-source-identity** (traces: ac-two-transfer-primitives)
Source cells are identity functions: their output equals their content. When the user edits content, the output updates immediately (no trigger needed). This is the only cell type that updates output without explicit trigger.

**bh-ai-execution** (traces: ac-two-transfer-primitives, ac-manual-trigger-cascade)
AI cells execute when triggered. The cell collects all inputs from incoming connections, constructs a prompt from the instruction + resolved inputs, sends to LLM via AiExecutorPort, and stores the result as CellOutput. During execution, output.status = 'running'. On completion, status = 'success' or 'error'.

**bh-cascade-propagation** (traces: ac-manual-trigger-cascade)
When a cell is triggered, da-build-execution-schedule produces an ordered list of downstream cells. da-execute-cascade iterates the list, executing each cell in order. Each cell's output is available to subsequent cells in the cascade. The cascade is a single wave -- no cell executes twice per cascade.

**bh-mix-reactivity** (traces: ac-the-mix)
The Mix recomputes whenever: (a) a cell's output changes, (b) a connection is added or removed (changing terminal set), or (c) a cell is added or removed. The Mix shows terminal cells (no outgoing open connections) with their current output. If a terminal cell has no output yet, it shows a placeholder.

**bh-source-no-input** (traces: ac-directed-connections)
Source cells expose no input port. Connections targeting a Source cell are rejected by da-validate-connection-signal-field. The CellShell renders no target Handle for Source cells (hasInput=false).

**bh-fan-out** (traces: ac-directed-connections)
Any cell's output can connect to multiple downstream cells. Fan-out is unlimited. Each downstream cell receives the same output independently.

**bh-legacy-coexistence** (traces: data preservation)
Existing workspaces with legacy node types (markdown, pdf, transform, chat, ai-transform) continue to render. Legacy nodes display in CellShell as read-only (no editing). Legacy nodes and cells coexist on the canvas but cannot be connected to each other. Connections between legacy nodes and cells are rejected by validateConnection. This is a strangler fig boundary — the two systems share the canvas but not the signal graph. No migration is forced -- users can continue using legacy nodes indefinitely and create new cells alongside them. Legacy node creation remains available in the toolbar during Phase 1a. The strangler fig removes legacy creation only when cell types fully subsume legacy capabilities.

### Phase 1b Behaviors

**bh-code-execution** (traces: ac-code-cell)
Code cells execute user-written JavaScript in a sandboxed environment (existing TransformExecutorPort). Same input always produces same output. Inputs are keyed by source cell title.

**bh-fan-in-keyed** (traces: ac-fan-in-keyed-input)
When multiple connections target a cell, inputs are structured as `{ [sourceTitle]: outputText }`. The ordering is user-controllable. When a source cell is renamed, the key updates in all downstream cells' input resolution. Code cells reference inputs by title in their logic. AI cells receive all inputs as labeled context.

**bh-health-propagation** (traces: ac-health-indication)
When a cell's output changes, all directly downstream cells transition to 'stale'. Staleness propagates transitively. Triggering a stale cell and completing execution transitions it to 'current'. Error in execution transitions to 'error'. Health is recomputed by da-compute-staleness.

**bh-scope-navigation** (traces: ac-the-scope)
Clicking an input label in the Scope's input column navigates back to the canvas with the source cell selected. This creates a natural flow: canvas -> Scope -> input -> canvas (at source) -> Scope (of source). The pull-back mechanism counters The Scope's tendency to trap attention.

**bh-drag-creation** (traces: ac-cell-creation-compositional)
Dragging from an output port into empty canvas space triggers cell creation. The new cell is automatically connected to the source. The user selects the new cell's type (Source/AI/Code) via a small dropdown at the drop point.

**bh-connection-feedback** (traces: ac-connection-feedback)
When a connection is created: the target cell's health transitions to stale (if it had prior output), the target cell's Scope input list updates, and The Mix updates if the connection changes the terminal set. All feedback occurs within the same interaction frame.

### Phase 2 Behaviors

**bh-automatic-cascade** (traces: ac-execution-mode-toggle)
In automatic mode, any cell output change triggers downstream re-execution without user action. Cascades are non-blocking -- the user can continue composing while execution proceeds. Multiple concurrent cascades are permitted (each operates on a snapshot of state).

**bh-mode-transition** (traces: ac-mode-switch-continuity)
Manual to automatic: all stale cells fire immediately. Automatic to manual: in-progress executions complete, no new propagation starts. No inputs are discarded. Transition is immediate, no confirmation dialog.

**bh-chat-inner-state** (traces: ac-chat-observation)
The chat overlay receives cell-type-specific inner state via da-cell-inner-state. Source: content. Code: code + last result + errors. AI: instruction + last input + last output + model identity. The LLM receives this as system context for the conversation.

**bh-chat-modification** (traces: ac-chat-intervention)
Chat can modify the observed cell's editable fields: Source content, Code logic, AI instruction. Modifications are applied immediately and trigger health updates (downstream cells become stale). The cell's Scope reflects modifications immediately.

### Phase 3 Behaviors

**bh-gate-toggle** (traces: ac-connection-gate)
Any connection can be toggled between open and latched with a single click on the edge. Latched connections are visually distinct (dashed line or muted color). Gate state is identical in manual and automatic modes -- a latched connection always blocks.

**bh-cycle-execution** (traces: ac-cycles-permitted)
Cycles are permitted when all connections in the cycle are open. A latched connection breaks the cycle. The user can release one quantum through a latched connection in a cycle -- executing one step of the cycle's trajectory. The system does not impose iteration limits. The UI remains responsive during cycle execution -- the user can always latch a connection to halt a cycle.

---

## UI Plan

### Layout (Phase 1a)

```
+------------------------------------------------------------------+
|  [Source] [AI]                                    Manual Mode   |
|  toolbar (left)                                   (future toggle)|
+------------------------------------------------------------------+
|                                              |                    |
|                                              |   THE MIX          |
|              CANVAS                          |                    |
|                                              |   Terminal cell    |
|   +--------+         +--------+              |   outputs with     |
|   | Source  |-------->|   AI   |              |   titles as        |
|   | cell   |         |  cell  |              |   headers          |
|   +--------+         +--------+              |                    |
|                                              |   Updates on       |
|                                              |   topology or      |
|                                              |   output change    |
|                                              |                    |
+----------------------------------------------+--------------------+
```

### Cell Appearance (at rest)

```
+----------------------------------+
|  Title (editable)          [x]   |  <- hover shows delete/duplicate
|----------------------------------|
|                                  |
|  Output preview (truncated)      |  <- or inline editor if no output
|                                  |
|  O (output port, right side)     |
|  I (input port, left side)       |  <- Source cells: no input port
+----------------------------------+
```

- All cells identical at rest: `bg-background text-foreground border-border`
- No type badges, no type-specific coloring
- Port topology is the only type differentiator
- Trigger button appears on hover (play icon)

### The Mix Panel

- Right-side panel, always visible, ~300px wide
- Shows terminal cell outputs with cell title as header
- Scrollable if multiple terminals
- Empty state: "No terminal cells. Connect cells to see composed output."
- Updates immediately on topology changes (before re-execution, shows which cells WILL contribute)
- Subordinate visual weight: `bg-muted` background, `text-muted-foreground` headers

### The Scope (Phase 1b)

```
+------------------------------------------------------------------+
|                         [x] Close                                 |
+------------------------------------------------------------------+
|  INPUTS          |  EDITOR                    |  OUTPUT           |
|                  |                            |                   |
|  source_1: ...   |  [type-specific editor]    |  Current output   |
|  source_2: ...   |  Source: text area          |  text             |
|                  |  Code: code editor          |                   |
|  (click input    |  AI: instruction +          |  Health: current  |
|   to navigate    |      model selector         |  Duration: 1.2s   |
|   to source)     |                            |                   |
+------------------------------------------------------------------+
```

- Three equal-width columns (inputs and output together >= editor in visual weight)
- One Scope open at a time
- ESC or close button returns to canvas

### Chat Overlay (Phase 2)

- Slide-in panel from right, overlays The Mix
- Keyboard shortcut to invoke on selected cell
- Shows conversation with cell inner state as context
- Can modify observed cell -- changes appear immediately
- Ephemeral history (lost on close)

---

## Data Plan

### New Entity: Cell (kernel/entities/cell.ts)

```typescript
type CellOutput =
  | { status: 'success'; text: string; durationMs: number }
  | { status: 'error'; error: string; durationMs: number }
  | { status: 'running' }

type BaseCell = {
  id: string
  title: string
  position: Position
  dimensions?: Dimensions
  createdAt: number
  updatedAt: number
  output?: CellOutput
}

type SourceCellData = BaseCell & {
  type: 'source'
  content: string
}

type AiCellData = BaseCell & {
  type: 'ai'
  instruction: string
  provider: string
  model: string
}

type CodeCellData = BaseCell & {
  type: 'code'
  code: string
  timeoutMs: number
}

type Cell = SourceCellData | AiCellData | CodeCellData
```

### Extended Connection (kernel/entities/connection.ts)

```typescript
type Connection = {
  id: string
  sourceId: string
  targetId: string
  label: string
  createdAt: number
  gate: 'open' | 'latched'  // NEW -- default 'open'
}
```

### Extended Workspace (kernel/entities/workspace.ts)

```typescript
type Workspace = {
  id: string
  name: string
  nodes: WorkspaceNode[]      // legacy -- preserved
  cells: Cell[]               // NEW -- signal-field cells
  connections: Connection[]   // shared -- connects both nodes and cells
  viewport: Viewport
  executionMode: 'manual' | 'automatic'  // NEW -- default 'manual'
}
```

### Migration Strategy

**Phase 1a -- additive, no breaking changes:**
1. Add `cells: Cell[]` field to Workspace (default empty array)
2. Add `gate: 'open' | 'latched'` field to Connection (default 'open')
3. Add `executionMode: 'manual' | 'automatic'` to Workspace (default 'manual')
4. Existing `nodes: WorkspaceNode[]` preserved unchanged
5. Storage version bump: envelope version 10 -> 11

**Server-side migration (lazy, idempotent):**
- On workspace load, if version < 11: add empty `cells`, default `gate`/`executionMode`
- No automatic conversion of legacy nodes to cells (user-initiated or explicit migration tool later)
- Existing `migrate-to-multi-workspace.ts` pattern followed

**Legacy node rendering:**
- Existing node components (MarkdownNode, PdfNode, etc.) remain registered in Canvas nodeTypes
- Legacy nodes render alongside cells
- Toolbar only offers cell creation (Source, AI, Code)
- Legacy node creation disabled

### Persistence Compatibility

- StoragePort interface unchanged: `load() -> Workspace | null`, `save(workspace) -> void`
- The Workspace type grows but the port contract is stable
- Server storage reads/writes the expanded Workspace JSON
- localStorage cache key and envelope structure unchanged (version bump only)
- Merge-on-save and deletion manifest work unchanged (they operate on the Workspace shape)

---

## Verification Strategy

### Phase 1a

| AC | Verification Method | Key Assertions |
|---|---|---|
| ac-two-transfer-primitives | Unit test: createSourceCell, createAiCell produce correct types. Integration test: Source cell output equals content. AI cell executes via AiExecutorPort and stores output. | Source has no input port. AI receives inputs and produces output. Both types coexist on canvas. |
| ac-directed-connections | Unit test: validateConnection rejects Source as target, permits AI as target, permits fan-out. Integration test: connections render as directed edges with arrows. | Connections are sole composition mechanism. No implicit wiring. |
| ac-manual-trigger-cascade | Unit test: buildExecutionSchedule produces correct downstream order. executeCascade executes cells in order. Integration test: triggering an AI cell cascades to all downstream AI cells. | One trigger per chain. Cascade completes without user intervention. Cells without upstream input do not execute. |
| ac-the-mix | Unit test: computeTerminalCells returns cells with no outgoing connections. computeMix produces MixEntry[] with titles and outputs. Integration test: MixPanel visible during composition, updates on topology change. | Mix always visible. Updates on topology and output changes. Terminal set reflects connection changes before re-execution. |
| ac-cell-creation-simple | Integration test: one click creates cell. User can type immediately. | One action creation. Inline editing works. Type selection (Source/AI) available. |
| dc-cycle-aware-engine | Unit test: buildExecutionSchedule respects gate property (skips latched connections). Architecture review: execution engine accepts scheduling function, does not hard-code topological sort. | Engine design does not preclude cycle support. Gate property in schema. |

### Phase 1b

| AC | Verification Method | Key Assertions |
|---|---|---|
| ac-code-cell | Unit test: createCodeCell produces correct type. Code cell executes JS and returns result. | Deterministic: same input -> same output. |
| ac-fan-in-keyed-input | Unit test: resolveCellInputs returns Record<title, output>. Rename propagation test: renaming source updates downstream input keys. | Inputs keyed by title. Ordering user-controllable. Rename does not break downstream. |
| ac-the-scope | Integration test: click cell opens three-column view. Input click navigates to source. | I/O visual weight >= editor. One Scope at a time. |
| ac-health-indication | Unit test: computeStaleness propagates stale downstream. | Three states visible. Staleness propagates. |
| ac-output-preview-as-identity | Integration test: output preview visible at rest. Source/Code/AI show distinct previews. | Preview conveys function. Topology still needed for full comprehension. |
| ac-uniform-cell-presentation | Visual test: all cells identical at rest. No type badges. | Port topology only difference. |
| ac-cell-creation-compositional | Integration test: drag from output port to empty space creates connected cell. | Cell type selection at drop point. Connection auto-created. |
| ac-connection-feedback | Integration test: creating connection produces visible change within same frame. | Health transitions to stale. Scope input list updates. Mix terminal set updates. |

### Phase 2

| AC | Verification Method | Key Assertions |
|---|---|---|
| ac-execution-mode-toggle | Integration test: toggle switches mode. Auto mode triggers cascade on output change. Manual mode requires explicit trigger. | Non-blocking cascades. Canvas remains interactive during execution. |
| ac-mode-switch-continuity | Integration test: manual->auto fires stale cells. Auto->manual completes in-progress. | No inputs discarded. Immediate transition. |
| ac-chat-observation | Integration test: chat overlay on each cell type receives appropriate inner state. | Productive diagnostic conversation possible for all cell types. |
| ac-chat-intervention | Integration test: chat modifies cell config, changes reflected in Scope, health updates. | Modifications immediate. All editable fields accessible. |

### Phase 3

| AC | Verification Method | Key Assertions |
|---|---|---|
| ac-connection-gate | Integration test: single action toggles gate. Latched connection blocks signal. Visual distinction. | Gate identical in manual and automatic modes. |
| ac-cycles-permitted | Integration test: cycle created and executed. Latched connection breaks cycle. Quantum release executes one step. User can halt running cycle. | System responsive during cycle execution. No automatic iteration limits. |

### Validation Criteria

| VC | Verification Method |
|---|---|
| vc-composition-primary | User testing: measure canvas-level interactions (create/remove connections, rearrange, trigger) vs. Scope-level interactions (edit content/code/instruction). Canvas interactions should dominate. |

---

## Panel Risks and Mitigations

| Risk | Source | Mitigation |
|---|---|---|
| The Mix steals attention from canvas | Jacobi inversion 2 | Mix panel subordinate in visual weight (narrow, muted colors). Canvas remains dominant. |
| Port topology too subtle for type differentiation | Jacobi inversion 3 | Phase 1a user testing evaluates. If illegible, consider construction-phase type hints (subtle, temporary). |
| Legacy nodes create visual pollution | Jacobi inversion 5 | Legacy nodes render in CellShell as read-only. Uniform appearance preserved. |
| Manual cascade makes composition punctuated, not primary | Jacobi inversion 4 | Phase 2 automatic mode is where the center fully activates. Phase 1a is infrastructure. |
| Execution engine rewrite in Phase 3 | Gall's Law | buildExecutionSchedule respects gate property from Phase 1a. Engine parameterized by scheduling function. |
| Migration data loss | Fowler | Additive schema changes only. No field removal. Legacy nodes preserved. Version-gated migration. |
| Fan-in key instability on rename | Deming | da-update-cell-title propagation. Downstream resolution uses live title, not cached key. |
