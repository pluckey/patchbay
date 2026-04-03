---
feature: context-pipeline
center: "This feature makes the user's context-construction process — what they select, transform, and compose from source material for AI — into a visible, spatial, experimentable object."
stage: tasks
intensity: deep
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

# Tasks: Context Pipeline

## Phase 1 — Domain (entities + use cases + ports)

### t-connection-entity: Create Connection and TransformResult types | create
> **Center:** Gives connections between context fragments a concrete shape — the vocabulary for visible, spatial transform pipelines
> **Traces:** ac-spatial-connection, ac-graph-persistence
> **Depends:** (none)
> **Status:** complete

- **Implements**: da-01, da-02
- **Done when**: `Connection` type (`{ id, sourceId, targetId, transformCode, createdAt }`) and `TransformResult` type (`{ status: 'success', output } | { status: 'error', message }`) defined in `src/domain/entities/connection.ts` and re-exported from `src/domain/entities/index.ts`. `npx tsc --noEmit` passes.

### t-workspace-connections: Add connections array to Workspace entity | modify
> **Center:** Makes connections first-class workspace state — they persist alongside nodes as part of the spatial context
> **Traces:** ac-graph-persistence
> **Depends:** t-connection-entity
> **Status:** complete

- **Implements**: da-03
- **Done when**: `Workspace` type in `src/domain/entities/workspace.ts` has `connections: Connection[]`. `DEFAULT_WORKSPACE` includes `connections: []`. Barrel export updated. `npx tsc --noEmit` passes.

### t-create-connection: createConnection use case | create
> **Center:** Produces the Connection entity that links two nodes — without this factory function, no directed edge can exist on the canvas
> **Traces:** ac-spatial-connection, ac-multiple-transforms-per-source
> **Depends:** t-connection-entity
> **Status:** complete

- **Implements**: da-04
- **Done when**: Pure function in `src/domain/use-cases/create-connection.ts` takes `(sourceId, targetId, transformCode?)` and returns a new `Connection`. Default `transformCode` is `'return input'`. Exported from `src/domain/use-cases/index.ts`. `npx tsc --noEmit` passes.

### t-remove-connection: removeConnection use case | create
> **Center:** Deleting a connection restores the target to its original state — disposable transforms require a clean removal path
> **Traces:** ac-connection-removal, ac-transform-disposability
> **Depends:** t-connection-entity
> **Status:** complete

- **Implements**: da-05
- **Done when**: Pure function in `src/domain/use-cases/remove-connection.ts` takes `(connections, connectionId)` and returns filtered `Connection[]`. Exported from `src/domain/use-cases/index.ts`. `npx tsc --noEmit` passes.

### t-validate-connection: validateConnection use case with cycle detection | create
> **Center:** Prevents incoherent flows — ensures the visible pipeline is always a valid DAG the user can reason about
> **Traces:** ac-incoherent-flow-prevention, ac-multiple-transforms-per-source
> **Depends:** t-connection-entity
> **Status:** complete

- **Implements**: da-06
- **Done when**: Pure function in `src/domain/use-cases/validate-connection.ts` takes `(connections, sourceId, targetId)` and returns `{ valid: boolean; reason?: string }`. Rejects: self-connections, cycles (BFS), target already has incoming connection (v1 constraint). Allows: multiple outgoing from same source. Exported from `src/domain/use-cases/index.ts`. `npx tsc --noEmit` passes.

### t-remove-node-connections: removeNodeConnections use case | create
> **Center:** Ensures connection graph consistency when context fragments are discarded
> **Traces:** ac-source-removal-cascade
> **Depends:** t-connection-entity
> **Status:** complete

- **Implements**: da-07
- **Done when**: Pure function in `src/domain/use-cases/remove-node-connections.ts` takes `(connections, nodeId)` and returns `Connection[]` with all connections involving that nodeId (as source or target) filtered out. Exported from `src/domain/use-cases/index.ts`. `npx tsc --noEmit` passes.

### t-transform-executor-port: TransformExecutorPort interface | create
> **Center:** Defines the boundary for transform execution — the domain declares WHAT it needs without knowing HOW
> **Traces:** ac-live-output, ac-transform-error-visibility
> **Depends:** t-connection-entity
> **Status:** complete

- **Implements**: da-08
- **Done when**: Interface in `src/domain/ports/transform-executor-port.ts` declares `execute(code: string, input: string): Promise<TransformResult>`. Imports `TransformResult` from entities. `npx tsc --noEmit` passes.

### t-pdf-get-page-text-port: Add getPageText to PdfRendererPort | modify
> **Center:** Exposes PDF text content through the renderer port — without this, PDF nodes cannot participate as transform sources
> **Traces:** ac-source-type-agnostic
> **Depends:** (none)
> **Status:** complete

- **Implements**: da-09 (port definition)
- **Done when**: `PdfRendererPort` in `src/domain/ports/pdf-renderer-port.ts` has `getPageText(doc: PdfDocument, pageNum: number): Promise<string>`. Compilation may fail at adapter site until t-pdf-get-page-text-impl.

## Phase 2 — Adapters (implementations + orchestration)

### t-storage-v3: localStorageAdapter v3 with connections persistence | modify
> **Center:** Connections survive page reload — the user's composed pipeline is durable, not ephemeral
> **Traces:** ac-graph-persistence
> **Depends:** t-workspace-connections
> **Status:** complete

- **Implements**: da-15
- **Done when**: `CURRENT_VERSION = 3` in `src/adapters/storage/local-storage-adapter.ts`. `StorageEnvelope` includes `connections: Connection[]`. `migrate()` handles v2->v3 by adding `connections: []`. `save()` serializes connections. `load()` returns connections (defaulting to `[]`). `npx tsc --noEmit` passes.

### t-js-evaluator: jsEvaluator adapter implementing TransformExecutorPort | create
> **Center:** Makes transforms executable — the user's code actually runs, producing visible output
> **Traces:** ac-live-output, ac-transform-error-visibility, ac-first-pipeline-speed
> **Depends:** t-transform-executor-port
> **Status:** complete

- **Implements**: da-10
- **Done when**: Adapter in `src/adapters/execution/js-evaluator.ts` implements `TransformExecutorPort`. Uses `new Function('input', code)` for execution. User code is a function body receiving `input` string, must use explicit `return`. Returns success/error `TransformResult`. `npx tsc --noEmit` passes.

### t-pdf-get-page-text-impl: Implement getPageText in pdf-renderer adapter | modify
> **Center:** Unlocks PDF nodes as transform sources — context construction works with any source material
> **Traces:** ac-source-type-agnostic
> **Depends:** t-pdf-get-page-text-port
> **Status:** complete

- **Implements**: da-09 (implementation)
- **Done when**: `pdfRenderer` in `src/adapters/pdf/pdf-renderer.ts` implements `getPageText`. Uses existing `getProxy()` + `page.getTextContent()`, concatenates `item.str` with spaces. `npx tsc --noEmit` passes.

### t-content-resolver: contentResolver adapter for resolving node text | create
> **Center:** Abstracts source heterogeneity — the pipeline resolves text from any node type uniformly
> **Traces:** ac-source-type-agnostic, ac-output-derives-from-source
> **Depends:** t-pdf-get-page-text-impl
> **Status:** complete

- **Implements**: da-11
- **Done when**: Function in `src/adapters/content/content-resolver.ts` with signature `resolveContent(node: WorkspaceNode, deps: { blobStorage: BlobStoragePort, pdfRenderer: PdfRendererPort }): Promise<string>`. Markdown: returns `node.content`. PDF: retrieves blob, loads document, extracts text from `currentPage`, destroys document, returns text. Returns empty string on failure (does not throw). `npx tsc --noEmit` passes.

### t-execute-pipeline: executePipeline orchestration adapter | create
> **Center:** Chains content resolution and transform execution into a single operation — the complete pipeline made concrete
> **Traces:** ac-live-output, ac-output-derives-from-source, ac-transform-error-visibility
> **Depends:** t-js-evaluator, t-content-resolver
> **Status:** complete

- **Implements**: da-12
- **Done when**: Function in `src/adapters/orchestration/execute-pipeline.ts` takes a `Connection`, source `WorkspaceNode`, and deps. Resolves source content, executes `connection.transformCode` against it, returns `TransformResult`. `npx tsc --noEmit` passes.

### t-remove-node-cleanup-cascade: Extend removeNodeWithCleanup to cascade connections | modify
> **Center:** Ensures graph integrity on node removal — no orphaned connections in the visible pipeline
> **Traces:** ac-source-removal-cascade
> **Depends:** t-remove-node-connections
> **Status:** complete

- **Implements**: da-16
- **Done when**: `removeNodeWithCleanup` in `src/adapters/orchestration/remove-node-with-cleanup.ts` accepts `connections: Connection[]` as third parameter. Returns `{ updatedNodes, updatedConnections, blobIdsToDelete }`. Uses `removeNodeConnections` for cascade. `npx tsc --noEmit` passes.

### t-flow-edge-mapper: toFlowEdges mapping function | modify
> **Center:** Makes connections visible as xyflow edges — the spatial representation of the transform pipeline
> **Traces:** ac-spatial-connection, ac-transform-visible, ac-self-describing-pipeline
> **Depends:** t-connection-entity
> **Status:** complete

- **Implements**: da-13
- **Done when**: New function `toFlowEdges` in `src/adapters/canvas/flow-node-mapper.ts` maps `(connections, pipelineResults, callbacks)` to xyflow `Edge[]`. Each edge: `type: 'transformEdge'`, data includes `transformCode`, `transformResult`, callbacks. `npx tsc --noEmit` passes.

### t-flow-node-derived: Modify toFlowNodes to inject derived content | modify
> **Center:** Derived content flows through existing node rendering — transformed output appears in the workspace
> **Traces:** ac-output-derives-from-source, ac-live-output
> **Depends:** t-connection-entity
> **Status:** complete

- **Implements**: da-14
- **Done when**: `toFlowNodes` in `src/adapters/canvas/flow-node-mapper.ts` accepts optional `derivedContentMap?: Map<string, TransformResult>`. `MarkdownFlowNodeData` gains `isDerived?: boolean` and `derivedContent?: string`. When node ID is in the map with `status: 'success'`, injects `isDerived: true` and `derivedContent`. `npx tsc --noEmit` passes.

## Phase 3 — Hooks (state management + reactivity)

### t-workspace-connection-state: Add connection state and CRUD to useWorkspace | modify
> **Center:** Connections become manageable workspace state — users can create, modify, and persist their pipelines
> **Traces:** ac-spatial-connection, ac-connection-removal, ac-source-removal-cascade, ac-graph-persistence
> **Depends:** t-storage-v3, t-create-connection, t-remove-connection, t-validate-connection, t-remove-node-cleanup-cascade
> **Status:** complete

- **Implements**: da-17
- **Done when**: `useWorkspace` in `src/hooks/use-workspace.ts` has `connections` state. Loads connections on mount. Includes connections in save/flush. Exposes `handleCreateConnection`, `handleRemoveConnection`, `handleUpdateTransformCode`. `handleDelete` cascades connections. Returns `connections` and handlers. `npx tsc --noEmit` passes.

### t-pipeline-execution-hook: usePipelineExecution hook | create
> **Center:** Makes transforms live — source changes flow through the pipeline automatically, enabling real-time experimentation
> **Traces:** ac-live-output, ac-first-pipeline-speed, ac-transform-error-visibility
> **Depends:** t-execute-pipeline
> **Status:** complete

- **Implements**: da-18
- **Done when**: Hook in `src/hooks/use-pipeline-execution.ts` accepts `{ nodes, connections, deps }`. Watches for changes. Debounced re-execution (300ms). Maintains and returns `pipelineResults: Map<string, TransformResult>` keyed by target node ID. `npx tsc --noEmit` passes.

### t-canvas-binding-edges: Modify useCanvasBinding to sync edges | modify
> **Center:** Bridges domain connections to the spatial canvas — connections become draggable, visible edges
> **Traces:** ac-spatial-connection, ac-incoherent-flow-prevention, ac-transform-visible
> **Depends:** t-flow-edge-mapper, t-flow-node-derived, t-workspace-connection-state, t-pipeline-execution-hook
> **Status:** complete

- **Implements**: da-19
- **Done when**: `useCanvasBinding` in `src/hooks/use-canvas-binding.ts` accepts connections, pipelineResults, and connection handlers. Maintains `flowEdges` synced via `toFlowEdges`. Uses modified `toFlowNodes` for derived injection. Exposes `onConnect` and `flowEdges`. `npx tsc --noEmit` passes.

## Phase 4 — Components (UI)

### t-node-shell-handles: Add connection Handles to NodeShell | modify
> **Center:** Gives every node spatial connection points — users can see where to initiate and receive connections
> **Traces:** ac-spatial-connection, ac-source-type-agnostic
> **Depends:** (none)
> **Status:** complete

- **Implements**: da-21
- **Done when**: `NodeShell` in `src/components/NodeShell.tsx` renders xyflow `Handle` components: source (right, `Position.Right`) and target (left, `Position.Left`). Handles styled with semantic tokens, small (8x8px). `npx tsc --noEmit` passes.

### t-transform-edge: TransformEdge custom xyflow edge component | create
> **Center:** Makes transforms visible and editable on connections — the pipeline is self-describing
> **Traces:** ac-transform-visible, ac-self-describing-pipeline, ac-transform-error-visibility
> **Depends:** t-connection-entity
> **Status:** complete

- **Implements**: da-20
- **Done when**: Component in `src/components/TransformEdge.tsx`. Renders bezier path + midpoint label with transform code. Status indicator: green/red/gray dot. Click opens inline editor. Calls `onTransformCodeChange` on edit. Delete button on hover. Styled with semantic tokens. `npx tsc --noEmit` passes.

### t-canvas-edge-registration: Register edge type and pass edges to Canvas | modify
> **Center:** Wires transform edges into canvas rendering — connections become real visual elements
> **Traces:** ac-spatial-connection, ac-transform-visible
> **Depends:** t-canvas-binding-edges, t-transform-edge
> **Status:** complete

- **Implements**: da-22
- **Done when**: `Canvas` in `src/components/Canvas.tsx` accepts `edges`, `onConnect`, registers `edgeTypes: { transformEdge: TransformEdge }`. Passes to `ReactFlow`. `npx tsc --noEmit` passes.

### t-markdown-derived-mode: Add derived content display mode to MarkdownNode | modify
> **Center:** Transformed output appears in the target node — the result of context construction is visible in place
> **Traces:** ac-live-output, ac-output-derives-from-source, ac-transform-disposability
> **Depends:** t-flow-node-derived
> **Status:** complete

- **Implements**: da-23
- **Done when**: `MarkdownNode` in `src/components/MarkdownNode.tsx` reads `isDerived` and `derivedContent`. When derived: renders read-only content with a "Derived" badge. When not derived: normal edit/preview mode. On disconnect: original content reappears. `npx tsc --noEmit` passes.

## Phase 5 — Integration + Verification

### t-workspace-view-wiring: Wire pipeline and connections through WorkspaceView | modify
> **Center:** Composes all hooks into a working whole — the integration point where state, execution, and rendering converge
> **Traces:** ac-live-output, ac-spatial-connection
> **Depends:** t-canvas-binding-edges, t-pipeline-execution-hook, t-canvas-edge-registration
> **Status:** complete

- **Implements**: (integration — wires da-17 + da-18 + da-19 + da-22)
- **Done when**: `WorkspaceView` in `src/components/WorkspaceView.tsx` creates `usePipelineExecution`, passes connections + pipelineResults + handlers to `useCanvasBinding`, passes `flowEdges` + `onConnect` to `Canvas`. `npx tsc --noEmit` passes.

### t-verify-build: Type-check and build verification | CLI
> **Center:** Validates structural integrity of the complete pipeline system — compilation proves all boundaries are correctly wired
> **Traces:** ac-spatial-connection, ac-transform-visible, ac-live-output, ac-output-derives-from-source, ac-transform-error-visibility, ac-multiple-transforms-per-source, ac-connection-removal, ac-source-removal-cascade, ac-graph-persistence, ac-source-type-agnostic, ac-self-describing-pipeline, ac-first-pipeline-speed, ac-transform-disposability, ac-incoherent-flow-prevention
> **Depends:** t-workspace-view-wiring
> **Status:** complete

- **Implements**: (verification)
- **Done when**: `npx tsc --noEmit` and `npm run build` both exit with code 0.
