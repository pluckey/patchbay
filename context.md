<!-- Feature Architect context module. Architecture, conventions, and rules live in CLAUDE.md. This file supplements it with protocol-specific sections that CLAUDE.md doesn't cover. -->

## System Identity

Context Canvas is a spatial workspace for composing AI context, built with Next.js 16, TypeScript, Tailwind CSS 4, and @xyflow/react. It serves knowledge workers who spatially arrange source material — markdown text, PDFs, JS transforms, AI chat, and AI transforms — to compose and test context for AI consumption. The codebase lives at `/Users/home/Documents/projects/context-canvas`. Current state: multi-workspace application with 5 legacy node types, visible pipeline execution, server-side persistence (scoped per workspace), multi-provider AI chat (Anthropic native + OpenAI-compatible direct), structured output mode (single object or collection) for AI transforms, and a collapsible workspace sidepanel for creating, switching, renaming, and deleting workspaces.

Most recently, the **signal-field** layer adds three atomic Cell primitives (Source, Code, AI) that coexist with the legacy node types via a strangler-fig boundary. Cells are composed via directional connections, executed manually with cascade propagation (BFS downstream from the triggered cell, gate-aware on connections), observed via **The Mix** (a persistent right-side panel showing terminal-cell outputs), and edited via **The Scope** (a focused three-column bottom panel: Inputs | Editor | Output) that opens on cell double-click. Cell freshness is tracked by `lastInputHash` on each cell and computed by the pure `computeStaleness` transform. Cells and legacy WorkspaceNodes share the canvas but cannot be wired to each other — `validateConnection` rejects cross-type connections. Storage envelope is at version 12; the v10→v11 migration adds `cells`, `executionMode`, and `connection.gate`, and the v11→v12 migration renames `connection.sourceHandle`/`targetHandle` to `sourcePort`/`targetPort` so the kernel stops echoing xyflow's vocabulary. Connections also carry optional `sourcePort`/`targetPort` strings that the canvas adapter translates to xyflow's required `sourceHandle`/`targetHandle` Edge API at the boundary, used to pin a line to a specific attachment point on the node. All markdown surfaces (cell output, chat messages, markdown nodes, source-cell previews) render through a shared `MarkdownView` that supports GFM tables/task lists and inline-renders fenced ```mermaid blocks as SVG, and structured-output cells expose a table/JSON tree toggle (`StructuredViewSwitcher`).

## Discovery Protocol

- Read `CLAUDE.md` for authoritative architectural rules, conventions, and known traps
- Read `package.json` for dependencies and scripts
- Glob `src/kernel/entities/*.ts` for domain types
- Glob `src/kernel/entities/cell.ts` for the signal-field Cell discriminated union (`SourceCellData | CodeCellData | AiCellData`, BaseCell with `lastInputHash` for staleness)
- Glob `src/kernel/transforms/*.ts` for pure transform functions
- Glob `src/kernel/transforms/{create-source-cell,create-ai-cell,create-code-cell,compute-terminal-cells,compute-mix,build-execution-schedule,resolve-cell-inputs,compute-staleness,update-cell-title}.ts` for the nine signal-field kernel transforms
- Glob `src/kernel/entities/workspace-ref.ts` for WorkspaceRef (multi-workspace registry metadata)
- Glob `src/client/domain/ports/*.ts` for port interfaces (StoragePort, BlobStoragePort, PdfRendererPort, TransformExecutorPort, ChatPort, ModelRosterPort, AiExecutorPort, WorkspaceRegistryPort, DeletionManifestPort — AiExecutorPort accepts optional schema and schemaMode for single/collection structured output)
- Glob `src/client/domain/use-cases/*.ts` for orchestration logic (execute-pipeline, send-chat-message, execute-ai-transform, etc.) — note `execute-cascade.ts` is the signal-field cascade orchestrator (build schedule → resolve inputs → execute via AiExecutorPort/TransformExecutorPort → set lastInputHash)
- Glob `src/client/ui/components/*.tsx` for UI components (MarkdownNode, PdfNode, TransformNode, ChatNode, AiTransformNode for legacy; CellShell, CellNode, MixPanel, ScopeView, ScopeSourceEditor, ScopeCodeEditor, ScopeAiEditor, ScopeInputsColumn, ScopeOutputColumn for signal-field)
- Glob `src/client/ui/hooks/use-{cascade,mix,health,scope-state,scope-data,cell-lifecycle,cell-editing,workspace-view-model}.ts` for the signal-field hook layer
- Check `.specs/archive/` for completed feature specs
- Check `.specs/features/` for active feature specs

## Decomposition Patterns

### Atoms
- **Kernel Entity**: Pure data type in `src/kernel/entities/`
- **Kernel Transform**: Pure function in `src/kernel/transforms/`
- **Port**: Interface in `src/client/domain/ports/`
- **Use Case**: Orchestration in `src/client/domain/use-cases/`
- **Adapter**: Port implementation in `src/client/adapters/`
- **Component**: React component in `src/client/ui/components/`
- **Hook**: React hook in `src/client/ui/hooks/`
- **Cell variant** (signal-field): New primitive added to the `Cell` discriminated union in `src/kernel/entities/cell.ts`. Do NOT add to `WorkspaceNode` — the two systems are separated by a strangler-fig boundary.

### Strangler Fig Boundary

The codebase contains two parallel composition systems on the same canvas:

- **Legacy WorkspaceNodes** (`MarkdownNode`, `PdfNode`, `TransformNode`, `ChatNode`, `AiTransformNode`) — pre-existing, still rendered, still functional. New features should NOT extend this union.
- **Signal-field Cells** (`SourceCellData`, `CodeCellData`, `AiCellData`) — atomic primitives composed via directional connections. New compositional work goes here.

`validateConnection` rejects Cell↔WorkspaceNode connections — the two systems share the canvas but not the signal graph. Both render via xyflow but `flow-node-mapper.ts` has separate `toFlowNodes` (legacy) and `cellsToFlowNodes` paths. Persistence (`Workspace`) carries both `nodes: WorkspaceNode[]` and `cells?: Cell[]` arrays. The Mix operates only on cells.

### Decision Heuristics
| Signal in the requirement | Result |
|---|---|
| New data structure (node type, connection variant) | Kernel Entity in `kernel/entities/` |
| New pure data transformation | Kernel Transform in `kernel/transforms/` |
| New external capability (storage, rendering, execution) | Port in `client/domain/ports/`, Adapter in `client/adapters/` |
| New orchestration across ports + transforms | Use Case in `client/domain/use-cases/` |
| New visual element | Component in `client/ui/components/` |
| New UI-to-domain bridge | Hook in `client/ui/hooks/` (compose in `useWorkspace` like `usePdfOperations`, `useAiTransformHandlers`) |
| New server-side capability | Adapter in `server/adapters/` or `server/storage/` |
| New workspace lifecycle operation (create, delete, rename, switch) | Use Case in `client/domain/use-cases/`, consuming `WorkspaceRegistryPort` |
| New cell type or signal-field primitive | New variant in `Cell` union at `kernel/entities/cell.ts` (do NOT add to `WorkspaceNode`); add a `create*Cell` transform; extend `executeCascade` execution branch if it has a new transfer function |
| DON'T create a service class — use cases are functions, not classes |
| DON'T import concrete adapters in hooks — use `useAdapters()` context |

## Construction Patterns

| Tool/Skill | Produces | When to use | Invocation |
|---|---|---|---|
| npm install | Dependencies | Adding packages | `npm install {package}` |
| shadcn | UI components | Standard UI elements | `npx shadcn@latest add <component>` |
| feature-architect-v6 | Feature spec + implementation | New features | `/feature-architect-v6` |
