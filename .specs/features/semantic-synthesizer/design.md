---
feature: semantic-synthesizer
center: "This feature makes connection the primary creative act, so that what each element IS emerges from how it's composed rather than being declared in advance."
stage: design
intensity: deep
loop_iterations: 1
last_modified: 2026-04-05T00:00:00Z
---

# Semantic Synthesizer — System Decomposition

## Panel

- **Robert C. Martin (Uncle Bob)** — Author of *Clean Architecture*, SOLID principles, Agile Manifesto co-author
- **Martin Fowler** — Chief Scientist at ThoughtWorks, author of *Refactoring* and *Patterns of Enterprise Application Architecture*
- **Kent Beck** — Creator of Extreme Programming, pioneer of TDD, author of *Test-Driven Development: By Example*
- **Rich Hickey** — Creator of Clojure and Datomic, known for "Simple Made Easy" and data-oriented design

## Deliberation Summary

### Key Agreements (all four panelists)

1. **Two-type discriminated union** (SignalCell | SynthesizerCell) replaces the 5-type WorkspaceNode. Entity-level simplification.
2. **PipelineStage as a discriminated union** (ChatStage | CodeStage | AiStage) with result co-located on each stage — not separated into a parallel execution-state structure.
3. **inputOrder lives on SynthesizerCell**, not on Connection. The receiving cell owns the ordering of its inputs.
4. **No new ports needed.** The `executePipeline` use case dispatches to existing ChatPort, TransformExecutorPort, and AiExecutorPort. Stage-type dispatch IS domain logic and belongs in the use case, not behind another port abstraction.
5. **computeHealth is a pure kernel transform** — derives current/stale/error from stage results and input freshness. Never persisted.
6. **Migration is a pure kernel transform** — `migrateV10ToV11` maps 5 types to 2 with zero port dependencies.
7. **Cycle support deferred** — entity model doesn't preclude it, but no execution code is built.
8. **Chat assistant deferred** to component state — not persisted, not a pipeline concern.

### Key Debates Resolved

**PipelineExecutorPort vs. use-case orchestration** (Bob vs. Kent): Bob initially proposed a single PipelineExecutorPort. Kent argued the use case should orchestrate stage-by-stage, calling existing ports directly. Bob conceded — a new port would add indirection without value. The dispatch logic (chat→ChatPort, code→TransformExecutorPort, ai→AiExecutorPort) is domain knowledge that belongs in the use case.

**Result co-location vs. separation** (Rich vs. Kent): Rich proposed separating stage configuration from execution results (StageExecution indexed by stageId). Kent and Bob argued the UI needs them together, and index/ID correlation adds accidental complexity. Rich conceded with the compromise that `lastExecutedAt` on the cell tracks overall execution freshness.

**PDF in Signal** (Bob vs. Martin): Bob proposed a `contentType` discriminant on SignalCell. Martin proposed an optional `source` field that carries PDF-specific metadata. Kent sided with Martin — more extensible, no sub-hierarchy. Consensus: `source?: PdfSource` on SignalCell.

**StageResult.output type** (Rich): Rich pushed for `unknown` instead of `string` to satisfy ac-stage-handoff ("JS objects"). All agreed. This widens the current `TransformResult.output: string` to `StageResult.output: unknown`.

---

## System Decomposition

### Kernel Entities

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|----|------|------|--------|---------------|---------------|
| da-e01 | Cell | Kernel Entity | Create | Union: SignalCell \| SynthesizerCell. BaseCell: id, position, dimensions?, title, createdAt, updatedAt | ac-two-primitives, ac-signal-as-source, ac-synthesizer-as-effect, ac-title-labels |
| da-e02 | SignalCell | Kernel Entity | Create | type:"signal", content:string, source?:PdfSource | ac-signal-as-source, ac-two-primitives |
| da-e03 | SynthesizerCell | Kernel Entity | Create | type:"synthesizer", pipeline:PipelineStage[], inputOrder:string[], lastExecutedAt?:number | ac-synthesizer-as-effect, ac-two-primitives, ac-input-ordering |
| da-e04 | PipelineStage | Kernel Entity | Create | Union: ChatStage \| CodeStage \| AiStage. BaseStage: id, result?:StageResult | ac-pipeline-stage-types, ac-stage-handoff |
| da-e05 | ChatStage | Kernel Entity | Create | type:"chat", prompt, provider, model | ac-pipeline-stage-types |
| da-e06 | CodeStage | Kernel Entity | Create | type:"code", code, timeoutMs | ac-pipeline-stage-types |
| da-e07 | AiStage | Kernel Entity | Create | type:"ai", instruction, provider, model, outputMode, schema?, schemaMode? | ac-pipeline-stage-types |
| da-e08 | StageResult | Kernel Entity | Create | success{output:unknown, durationMs} \| error{message, durationMs, timedOut?} \| running. Replaces TransformResult with widened output | ac-error-halt, ac-health-indicator, ac-stage-handoff |
| da-e09 | PdfSource | Kernel Entity | Create | kind:"pdf", blobId, filename, currentPage, totalPages, zoomLevel, darkMode, annotations | ac-migration-from-existing |
| da-e10 | HealthStatus | Kernel Entity | Create | "current" \| "stale" \| "error" — derived, never persisted | ac-health-indicator |
| da-e11 | Connection | Kernel Entity | Preserve | id, sourceId, targetId, label, createdAt — unchanged | ac-connection-changes-output, ac-canvas-primacy |
| da-e12 | Workspace | Kernel Entity | Modify | cells:Cell[] replaces nodes:WorkspaceNode[]; rest unchanged | ac-two-primitives |

### Kernel Transforms

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|----|------|------|--------|---------------|---------------|
| da-t01 | createSignalCell | Kernel Transform | Create | (position, content?, source?) → SignalCell | ac-signal-as-source |
| da-t02 | createSynthesizerCell | Kernel Transform | Create | (position) → SynthesizerCell with empty pipeline | ac-synthesizer-as-effect |
| da-t03 | addStage | Kernel Transform | Create | (cell, stageType, config?) → SynthesizerCell with new stage appended | ac-pipeline-stage-types |
| da-t04 | removeStage | Kernel Transform | Create | (cell, stageId) → SynthesizerCell without that stage | ac-pipeline-stage-types |
| da-t05 | reorderStages | Kernel Transform | Create | (cell, stageIds) → SynthesizerCell with reordered pipeline | ac-pipeline-subordination |
| da-t06 | updateStageConfig | Kernel Transform | Create | (cell, stageId, partial) → SynthesizerCell with updated stage config | ac-pipeline-stage-types |
| da-t07 | computeHealth | Kernel Transform | Create | (cell, connections, allCells) → HealthStatus | ac-health-indicator |
| da-t08 | findTerminalCells | Kernel Transform | Create | (cells, connections) → Cell[] with no outgoing connections | ac-terminal-identification, ac-mix-view |
| da-t09 | resolveInputs | Kernel Transform | Create | (cell, connections, allCells) → Record<string, unknown> ordered by inputOrder | ac-pipeline-subordination, ac-input-ordering |
| da-t10 | migrateV10ToV11 | Kernel Transform | Create | (oldWorkspace) → Workspace — maps 5 node types to 2 cell types | ac-migration-from-existing |
| da-t11 | updateInputOrder | Kernel Transform | Create | (cell, orderedSourceIds) → SynthesizerCell | ac-input-ordering |
| da-t12 | updateCellTitle | Kernel Transform | Create | (cell, title) → Cell | ac-title-labels |
| da-t13 | updateCellContent | Kernel Transform | Create | (cell, content) → SignalCell | ac-signal-as-source |
| da-t14 | moveCell | Kernel Transform | Modify | Rename from moveNode, works with Cell | -- |
| da-t15 | removeCell | Kernel Transform | Modify | Rename from removeNode, works with Cell | -- |
| da-t16 | resizeCell | Kernel Transform | Modify | Rename from resizeNode, works with Cell | -- |
| da-t17 | createConnection | Kernel Transform | Preserve | Unchanged | ac-canvas-primacy |
| da-t18 | removeConnection | Kernel Transform | Preserve | Unchanged | ac-canvas-primacy |
| da-t19 | validateConnection | Kernel Transform | Modify | Reject connections targeting Signal cells | ac-signal-as-source |
| da-t20 | duplicateCell | Kernel Transform | Modify | Rename from duplicateNode, works with Cell | -- |

### Ports

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|----|------|------|--------|---------------|---------------|
| da-p01 | StoragePort | Port | Preserve | load/save unchanged; Workspace internal shape changes transparently | ac-migration-from-existing |
| da-p02 | ChatPort | Port | Preserve | sendMessage → AsyncIterable<string>. Used by chat stages and assistant | ac-pipeline-stage-types |
| da-p03 | TransformExecutorPort | Port | Preserve | execute(code, input, timeout). Used by code stages | ac-pipeline-stage-types |
| da-p04 | AiExecutorPort | Port | Preserve | execute(request). Used by AI stages | ac-pipeline-stage-types |
| da-p05 | BlobStoragePort | Port | Preserve | PDF blob storage | ac-migration-from-existing |
| da-p06 | PdfRendererPort | Port | Preserve | PDF rendering in Scope editor | ac-migration-from-existing |
| da-p07 | ModelRosterPort | Port | Preserve | Model selection in chat/AI stages | ac-pipeline-stage-types |

### Use Cases

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|----|------|------|--------|---------------|---------------|
| da-u01 | executePipeline | Use Case | Create | (cell, inputs, ports, onStageComplete?) → Promise<SynthesizerCell>. Folds over stages, dispatches to appropriate port per stage type, halts on error | ac-synthesizer-as-effect, ac-stage-handoff, ac-error-halt, ac-pipeline-subordination |
| da-u02 | loadWorkspace | Use Case | Modify | Applies migrateV10ToV11 when old format detected | ac-migration-from-existing |

### Adapters

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|----|------|------|--------|---------------|---------------|
| da-a01 | flow-node-mapper | Adapter | Modify | Collapse 5 FlowNodeData types + 44 callbacks to 1 CellFlowNodeData with minimal callbacks | ac-compact-display |
| da-a02 | use-canvas-binding | Adapter | Modify | Map Cell types instead of WorkspaceNode types | -- |
| da-a03 | storage-envelope | Adapter | Modify | Version bump 10→11, migration on deserialize | ac-migration-from-existing |

### Hooks

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|----|------|------|--------|---------------|---------------|
| da-h01 | use-workspace-persistence | Hook | Modify | Works with cells instead of nodes | -- |
| da-h02 | use-pipeline-execution | Hook | Create | Triggers executePipeline, manages execution state, auto-executes on connection change | ac-connection-changes-output, ac-synthesizer-as-effect |
| da-h03 | use-cell-scope | Hook | Create | Manages scope open/close state, provides panel data for 3-panel layout | ac-stable-scope-layout, ac-scope-as-extension |
| da-h04 | use-mix-view | Hook | Create | Computes terminal cells and aggregates outputs | ac-mix-view, ac-terminal-identification |

### Components

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|----|------|------|--------|---------------|---------------|
| da-c01 | CellNode | Component | Create | Compact canvas card: title, HealthDot, output preview, ports. Replaces 5 node components | ac-compact-display, ac-health-indicator, ac-error-visibility, ac-title-labels |
| da-c02 | CellScope | Component | Create | 3-panel container: InputPanel \| EditorPanel \| OutputPanel | ac-stable-scope-layout, ac-scope-as-extension, ac-scope-depth |
| da-c03 | InputPanel | Component | Create | Connected inputs with drag-to-reorder. Empty for signals | ac-input-ordering, ac-stable-scope-layout |
| da-c04 | EditorPanel | Component | Create | Delegates to TextEditor, PdfViewer, or PipelineEditor by cell type | ac-stable-scope-layout |
| da-c05 | OutputPanel | Component | Create | Cell output display with health indicator | ac-stable-scope-layout, ac-health-indicator |
| da-c06 | PipelineEditor | Component | Create | Stage list (add/remove/reorder) + stage config side-by-side. No drill-down | ac-scope-depth, ac-pipeline-stage-types |
| da-c07 | StageConfig | Component | Create | Per-type config: ChatStageConfig, CodeStageConfig, AiStageConfig | ac-pipeline-stage-types |
| da-c08 | MixView | Component | Create | Composed output of all terminal cells | ac-mix-view |
| da-c09 | HealthDot | Component | Create | Green/amber/red circle | ac-health-indicator, ac-error-visibility |
| da-c10 | NodeShell | Component | Modify | Simplified for uniform cell display | ac-compact-display |
| da-c11 | ConnectionEdge | Component | Create | Custom xyflow edge with visual prominence | ac-connection-presence |
| da-c12 | EmptyCanvasPrompt | Component | Create | Welcome UI for empty workspace | ac-empty-canvas |
| da-c13 | MarkdownNode | Component | Remove | Replaced by CellNode | ac-two-primitives |
| da-c14 | PdfNode | Component | Remove | Replaced by CellNode | ac-two-primitives |
| da-c15 | TransformNode | Component | Remove | Replaced by CellNode | ac-two-primitives |
| da-c16 | ChatNode | Component | Remove | Replaced by CellNode | ac-two-primitives |
| da-c17 | AiTransformNode | Component | Remove | Replaced by CellNode | ac-two-primitives |

---

## Relationship Map

```
Workspace (da-e12)
  |-- cells: Cell[] (da-e01)
  |     |-- SignalCell (da-e02)
  |     |     |-- content: string
  |     |     '-- source?: PdfSource (da-e09)
  |     '-- SynthesizerCell (da-e03)
  |           |-- pipeline: PipelineStage[] (da-e04)
  |           |     |-- ChatStage (da-e05) --has--> StageResult? (da-e08)
  |           |     |-- CodeStage (da-e06) --has--> StageResult? (da-e08)
  |           |     '-- AiStage (da-e07) --has--> StageResult? (da-e08)
  |           '-- inputOrder: string[] --references--> Cell.id
  |-- connections: Connection[] (da-e11)
  |     |-- sourceId --references--> Cell.id
  |     '-- targetId --references--> Cell.id
  '-- viewport: Viewport

Dependency flow (all arrows point INWARD):
  Components (da-c01..c12) --props--> Hooks (da-h01..h04)
  Hooks --useAdapters()--> Ports (da-p01..p07)
  Hooks --call--> Use Cases (da-u01..u02)
  Use Cases --import--> Kernel Transforms (da-t01..t20)
  Use Cases --accept params--> Ports (da-p01..p07)
  Adapters (da-a01..a03) --implement--> Ports
  Kernel Transforms --import--> Kernel Entities (da-e01..e12)
  Kernel Entities --import--> NOTHING

executePipeline (da-u01) dispatch:
  ChatStage (da-e05) --> ChatPort (da-p02)
  CodeStage (da-e06) --> TransformExecutorPort (da-p03)
  AiStage (da-e07) --> AiExecutorPort (da-p04)
```

---

## Behavior Plan

| Behavior | Description | Traces to | Implementation |
|----------|-------------|-----------|----------------|
| Pipeline fold execution | Stages execute sequentially; each stage's output becomes next stage's input | ac-synthesizer-as-effect, ac-stage-handoff, ac-pipeline-subordination | da-u01 (executePipeline) |
| Stage-type dispatch | chat→ChatPort, code→TransformExecutorPort, ai→AiExecutorPort | ac-pipeline-stage-types | da-u01 internal dispatch |
| Chat stream collection | Pipeline chat stages collect AsyncIterable into complete string | ac-pipeline-stage-types | da-u01 helper |
| Error halt | Error at stage N stops execution; stages N+1..M marked blocked | ac-error-halt | da-u01 |
| Per-stage progress | onStageComplete callback fires between stages for UI updates | ac-stage-handoff | da-u01 param + da-h02 |
| Connection-triggered reactivity | Connection add/remove marks downstream cells stale; optionally auto-executes | ac-connection-changes-output | da-h02 |
| Health derivation | Compute current/stale/error from stage results + input freshness | ac-health-indicator | da-t07 (computeHealth) |
| Signal input rejection | validateConnection prevents connections targeting Signal cells | ac-signal-as-source | da-t19 |
| Input ordering | SynthesizerCell.inputOrder determines input feed order to first stage | ac-input-ordering | da-t09 (resolveInputs) + da-c03 |
| Terminal identification | Cells with zero outgoing connections | ac-terminal-identification | da-t08 (findTerminalCells) |
| Mix view aggregation | Compose all terminal cell outputs into single view | ac-mix-view | da-h04 + da-c08 |
| Migration on load | Detect v10 envelope, apply migrateV10ToV11, re-persist as v11 | ac-migration-from-existing | da-u02 + da-a03 |
| Empty canvas detection | Zero cells triggers invitation UI | ac-empty-canvas | da-c12 |

---

## UI Plan

**Canvas at rest:** Compact CellNode cards showing title, HealthDot (green/amber/red), truncated output preview, and connection ports. Signal cells have source port only (right side). Synthesizer cells have both target (left) and source (right) ports. Error message text visible below title when health is red. Connections rendered with visual weight via custom ConnectionEdge. Empty canvas shows EmptyCanvasPrompt.

**Scope (opened from cell):** Slides out or overlays as spatial extension of the canvas node. Uniform 3-panel CellScope layout for all cells:
- **Input panel** (left): Connected inputs with drag-to-reorder for Synthesizers. Empty for Signals.
- **Editor panel** (center): TextEditor or PdfViewer for Signals. PipelineEditor for Synthesizers — stage list on left with add/remove/reorder, selected stage config on right. Two levels maximum: stage list and stage config coexist, no drill-down.
- **Output panel** (right): Cell output with health indicator. Error details when applicable.

**Mix View:** Single action opens read-only view showing all terminal cells' titles and outputs composed together.

**Chat Assistant (deferred):** Separate panel/overlay on any cell, visually distinct from pipeline chat stages, using ChatPort directly. History in component state only.

---

## Data Plan

**Storage version:** 10 → 11

**Migration mapping (da-t10):**

| Old Type | New Type | Field Mapping |
|----------|----------|--------------|
| MarkdownNode | SignalCell | content → content, title = "Untitled" |
| PdfNode | SignalCell | title = filename, content = "", source = {kind:"pdf", blobId, filename, currentPage, totalPages, zoomLevel, darkMode, annotations} |
| TransformNode | SynthesizerCell | pipeline = [{type:"code", code: transformCode, timeoutMs}], inputOrder = [] |
| ChatNode | SynthesizerCell | pipeline = [{type:"chat", prompt: "", provider, model}], inputOrder = []. **Message history is lost.** |
| AiTransformNode | SynthesizerCell | pipeline = [{type:"ai", instruction, provider, model, outputMode, schema, schemaMode}], inputOrder = [] |

**Post-migration:** inputOrder populated from existing connections sorted by createdAt.

**Connection migration:** None. Connections transfer directly with unchanged sourceId/targetId.

**Field rename:** `Workspace.nodes` → `Workspace.cells`. Ripples through all transforms, use cases, adapters, hooks.

**localStorage:** Same key format, version bumps to 11. Migrate in-memory on load if version < 11.

**Blob storage:** Unchanged. PdfSource.blobId references existing blobs.

---

## Verification Strategy

| AC ID | Verification |
|-------|-------------|
| ac-two-primitives | Unit: Cell union type-checks only signal/synthesizer. Integration: canvas renders only CellNode |
| ac-signal-as-source | Unit: validateConnection rejects signal targets. Unit: SignalCell has content field |
| ac-synthesizer-as-effect | Unit: executePipeline processes stages in order. Integration: signal→synthesizer produces output |
| ac-connection-changes-output | Integration: add connection, verify health transitions to stale or auto-executes |
| ac-canvas-primacy | Design review: no input mechanism besides canvas connections |
| ac-pipeline-subordination | Unit: executePipeline threads output — stage 1 gets cell inputs, stage 2 gets stage 1 output |
| ac-connection-presence | Visual review: ConnectionEdge renders with weight and prominence |
| ac-input-ordering | Unit: resolveInputs respects inputOrder. Integration: drag-reorder in InputPanel updates state |
| ac-stable-scope-layout | Component test: CellScope renders 3 panels for both cell types |
| ac-scope-as-extension | UX review: qualitative (E requirement) |
| ac-scope-depth | Design review: PipelineEditor has stage list + stage config, no further nesting |
| ac-pipeline-stage-types | Unit: addStage accepts chat/code/ai. Integration: mixed pipeline executes |
| ac-stage-handoff | Unit: stage N output (unknown) becomes stage N+1 input |
| ac-compact-display | Component test: CellNode shows title, HealthDot, preview, ports. No config |
| ac-health-indicator | Unit: computeHealth returns correct status for all scenarios |
| ac-title-labels | Integration: title editable. Unit: updateCellTitle works |
| ac-error-halt | Unit: executePipeline halts on error, downstream stages untouched |
| ac-error-visibility | Component test: CellNode shows red dot + error text |
| ac-mix-view | Unit: findTerminalCells. Integration: MixView aggregates outputs |
| ac-terminal-identification | Unit: findTerminalCells correct with add/remove connection |
| ac-empty-canvas | Component test: EmptyCanvasPrompt renders when cells.length === 0 |
| ac-cycle-support | Deferred. Verified: entity model allows cycles, validateConnection does not reject them |
| ac-chat-configuration-assistant | Deferred. Architecture supports: ChatPort available for any cell |
| ac-chat-distinct-from-pipeline | Deferred. Design note: separate component, distinct styling |
| ac-migration-from-existing | Unit: migrateV10ToV11 maps all 5 types. Integration: load old workspace, verify new shape |

---

## Flags for the User

1. **ChatNode message history is lost on migration.** Chat stages in the new model execute once per run — they don't accumulate messages. Old chat history cannot be preserved in the new pipeline model.

2. **PDF Signal output is the PdfSource object.** A PDF signal's downstream output is its `PdfSource` metadata (blobId, filename, currentPage, totalPages, annotations, etc.), not its `content` field. Downstream Code stages use `pdf.*` helpers or direct property access to extract what they need. The `content` field on SignalCell is for text-based signals only.

3. **Cycle execution is deferred but cycles are not prevented.** The entity model allows circular connections. If a user creates one before cycle execution is implemented, a cycle detection guard in the execution hook should show a graceful warning rather than infinite-loop.

4. **flow-node-mapper is effectively a rewrite** (325 lines, 5 types, 44 callbacks → ~100 lines, 1 type, ~10 callbacks). Plan as a new file, not incremental modification.

5. **`Workspace.nodes` → `Workspace.cells` is a mechanical ripple** affecting every file that touches workspace data. Expect 20-30 files to change for this rename alone.
