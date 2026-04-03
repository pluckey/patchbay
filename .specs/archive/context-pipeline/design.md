---
feature: context-pipeline
center: "This feature makes the user's context-construction process — what they select, transform, and compose from source material for AI — into a visible, spatial, experimentable object."
stage: design
intensity: deep
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

# Design: Context Pipeline

## System Decomposition

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|----|------|------|--------|---------------|---------------|
| da-01 | Connection | Entity | Create | `{ id, sourceId, targetId, transformCode, createdAt }` | ac-spatial-connection, ac-graph-persistence |
| da-02 | TransformResult | Entity | Create | `{ status: 'success', output } \| { status: 'error', message }` | ac-transform-error-visibility, ac-live-output |
| da-03 | Workspace | Entity | Modify | Add `connections: Connection[]` to existing type | ac-graph-persistence |
| da-04 | createConnection | Use Case | Create | Pure fn: `(sourceId, targetId, transformCode?) => Connection` | ac-spatial-connection, ac-first-pipeline-speed |
| da-05 | removeConnection | Use Case | Create | Pure fn: `(connections, connectionId) => Connection[]` | ac-connection-removal |
| da-06 | validateConnection | Use Case | Create | Pure fn: cycle detection + self-connection check via BFS | ac-incoherent-flow-prevention |
| da-07 | removeNodeConnections | Use Case | Create | Pure fn: `(connections, nodeId) => Connection[]` | ac-source-removal-cascade |
| da-08 | TransformExecutorPort | Port | Create | `execute(code, input): Promise<TransformResult>` | ac-live-output, ac-output-derives-from-source, ac-transform-error-visibility |
| da-09 | PdfRendererPort.getPageText | Port | Modify | Add `getPageText(doc, pageNum): Promise<string>` | ac-source-type-agnostic |
| da-10 | jsEvaluator | Adapter | Create | Implements TransformExecutorPort via `new Function()` + try-catch | ac-output-derives-from-source, ac-transform-error-visibility |
| da-11 | contentResolver | Adapter | Create | Resolves text from any node type; composes BlobStoragePort + PdfRendererPort | ac-source-type-agnostic |
| da-12 | executePipeline | Orchestration | Create | Async: resolve source text -> execute transform -> return TransformResult | ac-live-output, ac-output-derives-from-source |
| da-13 | toFlowEdges | Adapter (mapper) | Create | Maps domain Connection[] + TransformResult -> xyflow Edge[] | ac-spatial-connection, ac-transform-visible |
| da-14 | toFlowNodes (derived injection) | Adapter (mapper) | Modify | Injects isDerived + derivedContent into flow node data for targets | ac-live-output, ac-connection-removal |
| da-15 | localStorageAdapter v3 | Adapter (storage) | Modify | Envelope v3 with connections[]; migration from v2 adds empty array | ac-graph-persistence |
| da-16 | removeNodeWithCleanup | Orchestration | Modify | Extend to cascade connection removal via da-07 | ac-source-removal-cascade |
| da-17 | useWorkspace (connections) | Hook | Modify | Connection state + CRUD handlers + persistence integration | ac-spatial-connection, ac-connection-removal, ac-graph-persistence |
| da-18 | usePipelineExecution | Hook | Create | Watches nodes/connections, debounced re-execution, manages output state map | ac-live-output, ac-transform-error-visibility |
| da-19 | useCanvasBinding (edges) | Hook | Modify | Syncs connections -> flow edges; handles onConnect, onConnectEnd, onEdgesChange | ac-spatial-connection, ac-connection-removal |
| da-20 | TransformEdge | Component | Create | Custom xyflow edge: inline transform editor, error display, delete button | ac-transform-visible, ac-transform-error-visibility, ac-self-describing-pipeline |
| da-21 | NodeShell (handles) | Component | Modify | Source handle (right), target handle (left); visible on hover | ac-spatial-connection, ac-source-type-agnostic |
| da-22 | Canvas (edges) | Component | Modify | Register transformEdge type; pass edges, onConnect, onConnectEnd to ReactFlow | ac-spatial-connection |
| da-23 | MarkdownNode (derived mode) | Component | Modify | Render derivedContent when isDerived; show disconnected state; read-only when derived | ac-live-output, ac-connection-removal, ac-self-describing-pipeline |

## Relationship Map

```
DOMAIN ENTITIES (innermost)
  da-01 Connection -----> consumed by da-04, da-05, da-06, da-07
  da-02 TransformResult -> returned by da-08, da-12
  da-03 Workspace -------> persisted by da-15, managed by da-17

DOMAIN USE CASES
  da-04 createConnection ----> called by da-17 (useWorkspace)
  da-05 removeConnection ----> called by da-17 (useWorkspace)
  da-06 validateConnection --> called by da-19 (useCanvasBinding, on connect attempt)
  da-07 removeNodeConnections -> called by da-16 (removeNodeWithCleanup)

DOMAIN PORTS
  da-08 TransformExecutorPort --> implemented by da-10 (jsEvaluator)
  da-09 PdfRendererPort -------> used by da-11 (contentResolver)

ADAPTERS
  da-10 jsEvaluator ---------> called by da-12 (executePipeline)
  da-11 contentResolver -----> called by da-12 (executePipeline)
  da-12 executePipeline -----> called by da-18 (usePipelineExecution)
  da-13 toFlowEdges ---------> called by da-19 (useCanvasBinding)
  da-14 toFlowNodes (derived)-> called by da-19 (useCanvasBinding)
  da-15 storage v3 ----------> called by da-17 (useWorkspace, load/save)
  da-16 removeNodeWithCleanup -> called by da-17 (useWorkspace, handleDelete)

HOOKS
  da-17 useWorkspace --------> provides [connections, handlers] to da-18, da-19
  da-18 usePipelineExecution -> provides outputs to da-13, da-14
  da-19 useCanvasBinding ----> provides [flowEdges, handlers] to da-22

COMPONENTS (outermost)
  da-20 TransformEdge -------> registered in da-22 (Canvas)
  da-21 NodeShell (handles) -> enables da-22 (Canvas onConnect)
  da-22 Canvas (edges) ------> renders flow edges + nodes
  da-23 MarkdownNode --------> consumes derived data from da-14
```

All dependency arrows point inward (Components -> Hooks -> Adapters -> Ports -> Use Cases -> Entities).

## Behavior Plan

| ID | Behavior | Trigger | Domain Path | Traces to ACs |
|----|----------|---------|-------------|---------------|
| B-01 | Drag-to-connect | User drags from source handle to target handle | da-19 onConnect -> da-06 validate -> da-04 create -> da-17 setState -> da-18 execute -> da-12 pipeline | ac-spatial-connection, ac-incoherent-flow-prevention |
| B-02 | Drag-to-empty (auto-create) | User drags from source handle to empty canvas | da-19 onConnectEnd -> createNode (existing) -> da-04 create -> da-17 setState -> da-18 execute | ac-spatial-connection, ac-first-pipeline-speed |
| B-03 | Transform edit | User modifies code in TransformEdge editor | da-20 onChange -> da-17 updateConnectionTransform -> da-18 debounced re-execute | ac-transform-visible, ac-live-output |
| B-04 | Source content change | User edits markdown node or navigates PDF page | existing handleContentChange/handleNavigatePage -> da-18 detects change -> da-12 re-execute affected connections | ac-live-output |
| B-05 | Transform error | JS execution throws | da-10 catches -> da-02 error result -> da-18 stores -> da-20 displays error, da-23 shows error state | ac-transform-error-visibility |
| B-06 | Connection removal | User deletes edge | da-19 onEdgesChange -> da-05 removeConnection -> da-17 setState -> da-18 clears output -> da-23 shows disconnected | ac-connection-removal |
| B-07 | Source deletion cascade | User deletes source node | da-17 handleDelete -> da-16 removeNodeWithCleanup (extended) -> da-07 removeNodeConnections -> da-18 clears outputs | ac-source-removal-cascade |
| B-08 | Cycle rejection | User attempts cyclic connection | da-19 onConnect -> da-06 validateConnection (BFS detects cycle) -> reject | ac-incoherent-flow-prevention |
| B-09 | Graph persistence | Any mutation settles | da-17 scheduleSave (300ms debounce) -> da-15 save (nodes + connections + viewport) | ac-graph-persistence |
| B-10 | Graph reload | Page load | da-15 load (v3 envelope) -> da-17 setState (nodes + connections) -> da-18 executes all pipelines | ac-graph-persistence |

## UI Plan

**U-01: Connection Handles.** NodeShell gains a source handle (right edge, `type="source"`) and target handle (left edge, `type="target"`). Handles appear on hover, matching the existing visibility pattern for resize handles and delete buttons. Styled with semantic tokens: `bg-muted-foreground border-border`. All node types get handles via NodeShell, satisfying ac-source-type-agnostic.

**U-02: TransformEdge.** A custom xyflow edge component. Renders the connection path plus a midpoint card. Collapsed state: truncated first line of transform code. Expanded state (on click): code textarea (`font-mono`, `bg-background`, `border-input`). Error state: `border-destructive`, error message below code. Delete button on hover (same pattern as NodeShell). Styled with `bg-background border-border rounded shadow-sm`.

**U-03: Derived Node.** When MarkdownNode has an incoming connection, it renders the transform output as read-only content. A subtle "Derived" badge in `bg-muted text-muted-foreground` appears in the node header. Content uses prose styling for rendered output.

**U-04: Disconnected State.** When a connection is severed, the target shows "Disconnected" in `text-muted-foreground`. The node becomes editable again.

**U-05: Connection Creation Flow.** Drag from handle shows xyflow's built-in preview line. Drop on handle: edge appears, identity transform executes, target shows source content. Drop on empty canvas: node auto-created at drop position, edge appears with identity transform. Validation failure: connection rejected silently (cycle attempt).

## Data Plan

**D-01: New entity file** `src/domain/entities/connection.ts`:
- `Connection`: `{ id, sourceId, targetId, transformCode, createdAt }`
- `TransformResult`: `{ status: 'success', output } | { status: 'error', message }`

**D-02: Workspace modification** in `src/domain/entities/workspace.ts`:
- Add `connections: Connection[]` to `Workspace` type and `DEFAULT_WORKSPACE`

**D-03: Storage envelope v3** in `src/adapters/storage/local-storage-adapter.ts`:
- Version bump to 3. Add `connections: Connection[]` to envelope
- Migration from v2: add `connections: []`

**D-04: PdfRendererPort extension** in `src/domain/ports/pdf-renderer-port.ts`:
- Add `getPageText(doc: PdfDocument, pageNum: number): Promise<string>`

**D-05: Flow mapper extensions** in `src/adapters/canvas/flow-node-mapper.ts`:
- `toFlowNodes` gains `connections` and `outputs` parameters for derived content injection
- New `toFlowEdges` function for Connection[] -> xyflow Edge[]
- New `TransformEdgeData` type for edge data shape

## Verification Strategy

| AC ID | Method | What to Assert |
|-------|--------|----------------|
| ac-spatial-connection | Integration (hook + component) | `connections.length` increments; flow edges include new edge |
| ac-transform-visible | Visual + integration | TransformEdge renders code textarea; onChange updates domain state |
| ac-live-output | Integration (hook) | `outputs[connectionId].output` reflects transform applied to new content |
| ac-output-derives-from-source | Unit (adapter) | `execute('return input.toUpperCase()', 'hello')` -> `{ status: 'success', output: 'HELLO' }` |
| ac-transform-error-visibility | Unit (adapter) | `execute('throw new Error("bad")', '')` -> `{ status: 'error', message: 'bad' }` |
| ac-multiple-transforms-per-source | Integration (hook) | Two outputs map entries with different connection IDs, different content |
| ac-connection-removal | Integration (hook + component) | Connection absent from state; output cleared; target renders disconnected |
| ac-source-removal-cascade | Unit (use case) | `removeNodeConnections(connections, nodeId)` returns filtered array |
| ac-graph-persistence | Integration (storage + hook) | Storage envelope contains connections; load restores; pipelines re-execute |
| ac-source-type-agnostic | Integration (adapter) | contentResolver returns string for both PDF and markdown node types |
| ac-self-describing-pipeline | Visual / Playwright | Canvas renders complete pipeline chain; edge label shows transform code |
| ac-first-pipeline-speed | Manual timing | End-to-end flow under 2 minutes |
| ac-transform-disposability | Manual comparison | Create/eval/discard cycle faster than manual copy-paste |
| ac-incoherent-flow-prevention | Unit (use case) | `validateConnection` returns invalid for A->B->A and A->A |

## Risks

1. **Main-thread JS execution (HIGH).** Infinite loops in transform code freeze the browser tab. Accepted for v1. TransformExecutorPort enables Web Worker swap for v2. Mitigation: do not auto-execute transforms on page load to avoid persisted infinite loops blocking reload.
2. **PDF text extraction quality (MEDIUM).** pdf.js text extraction can produce messy output. Product risk, not architecture risk.
3. **No transform timeout/cancellation in v1 (MEDIUM).** `new Function()` cannot be cancelled. Web Worker with `terminate()` is the v2 solution.
4. **One incoming connection per target (SCOPE).** v1 simplification. Multi-input transforms require a different content resolution model. Architecture does not preclude this.
