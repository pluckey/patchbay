---
feature: ai-transform-node
center: "The AI Transform lets users define a single LLM processing instruction that operates as a composable, low-friction step in a spatial information pipeline."
stage: tasks
intensity: standard
execution_mode: parallel
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

### t-entity: Add AiTransformNodeData to WorkspaceNode discriminated union | kernel entity
> **Center:** The AI Transform cannot exist as a composable pipeline step without a domain-level identity in the type system.
> **Traces:** ac-pipeline-input, ac-pipeline-output, ac-instruction-field, ac-model-selection, ac-execution-toggle, ac-input-mode-freetext, ac-input-mode-named, ac-visual-distinction, ac-no-conversation-ui
> **Depends:** (none)
> **Files:** `src/kernel/entities/workspace-node.ts`, `src/kernel/entities/index.ts`
> **Wave:** 1
> **Status:** pending

- **Implements**: da-10
- **Done when**: `AiTransformNodeData` type exists with fields `type: 'ai-transform'`, `instruction: string`, `provider: string`, `model: string`, `autoExecute: boolean`, `inputMode: 'concat' | 'named'`, `result?: TransformResult`. `WorkspaceNode` union includes `AiTransformNodeData`. Barrel export updated. TypeScript compilation succeeds (all exhaustive switch/case sites updated with placeholder cases for `'ai-transform'` in `flow-node-mapper.ts`, `execute-pipeline.ts`, `resolve-chat-prompts.ts`).

### t-transforms-crud: Create AI Transform kernel transforms including resolveAiTransformPrompt | kernel transforms
> **Center:** Each transform provides a single, testable mutation path for the AI Transform's configurable properties, and prompt resolution converts pipeline connections into LLM input.
> **Traces:** ac-instruction-field, ac-model-selection, ac-execution-toggle, ac-input-mode-freetext, ac-input-mode-named, ac-pipeline-input, ac-upstream-error-halt
> **Depends:** t-entity
> **Files:** `src/kernel/transforms/create-ai-transform-node.ts`, `src/kernel/transforms/update-ai-instruction.ts`, `src/kernel/transforms/update-ai-transform-model.ts`, `src/kernel/transforms/toggle-auto-execute.ts`, `src/kernel/transforms/update-ai-input-mode.ts`, `src/kernel/transforms/resolve-ai-transform-prompt.ts`, `src/kernel/transforms/index.ts`
> **Wave:** 2
> **Status:** pending

- **Implements**: da-11, da-12, da-13, da-14, da-15, da-16
- **Done when**: Six pure functions exported from barrel. `createAiTransformNode(position, provider?, model?)` returns a new node with defaults (empty instruction, autoExecute false, inputMode 'concat'). Each update transform follows the `(nodes, nodeId, value) => nodes` signature. `resolveAiTransformPrompt(instruction, inputs, inputMode)` where `inputs` is `Record<string, string>`: in `'concat'` mode concatenates with labeled headers as user message; in `'named'` mode replaces `{{label}}` placeholders, unresolved placeholders produce error. Returns `{ systemPrompt: string, userMessage: string } | { error: string }`. All compile.

### t-executor-port: Define AiExecutorPort interface | client port
> **Center:** The port defines the contract for AI execution without coupling to any provider, keeping the domain layer framework-agnostic.
> **Traces:** ac-pipeline-input, ac-pipeline-output, ac-streaming-feedback, ac-error-surfacing
> **Depends:** t-entity
> **Files:** `src/client/domain/ports/ai-executor-port.ts`
> **Wave:** 2

> **Status:** pending

- **Implements**: da-17
- **Done when**: `AiExecutorPort` interface exported with `execute(request: { instruction: string, userMessage: string, provider: string, model: string }): AsyncIterable<string>`. Interface imports only from kernel entities.

### t-execute-use-case: Create execute-ai-transform use-case | domain use-case
> **Center:** This use-case orchestrates the full execution path: resolve inputs, build prompt, call AI executor, stream results — the runtime embodiment of the composable pipeline step.
> **Traces:** ac-pipeline-input, ac-pipeline-output, ac-execution-status, ac-output-display, ac-error-surfacing, ac-upstream-error-halt, ac-streaming-feedback
> **Depends:** t-executor-port, t-transforms-crud
> **Files:** `src/client/domain/use-cases/execute-ai-transform.ts`
> **Wave:** 3
> **Status:** pending

- **Implements**: da-19 (orchestration)
- **Done when**: `executeAiTransform` is an async generator yielding update objects with types: `'resolving'`, `'streaming'` (partial output), `'complete'` (final TransformResult), `'error'` (error TransformResult). Reuses `resolveSourceContent` for input resolution. Calls `resolveAiTransformPrompt` to build the prompt. On upstream resolution error, yields error immediately without calling the LLM.

### t-pipeline-seed: Seed pipelineResults with cached AI Transform outputs | hook extension
> **Center:** Without seeding cached results into the pipeline map, downstream transforms cannot read AI Transform output — breaking composability.
> **Traces:** ac-pipeline-output
> **Depends:** t-entity
> **Files:** `src/client/ui/hooks/use-workspace.ts`
> **Wave:** 3
> **Status:** pending

- **Implements**: da-19
- **Done when**: Before `executePipelineGraph` runs, all `'ai-transform'` nodes with `result.status === 'success'` are pre-seeded into the results map. Downstream `'transform'` nodes connected to an `'ai-transform'` source can read its output via `priorResults`.

### t-resolve-source: Extend resolveSourceContent for ai-transform output | use-case extension
> **Center:** An AI Transform that cannot serve as a pipeline source is a dead end, not a composable step.
> **Traces:** ac-pipeline-output
> **Depends:** t-entity
> **Files:** `src/client/domain/use-cases/execute-pipeline.ts`
> **Wave:** 3
> **Status:** pending

- **Implements**: da-20
- **Done when**: `resolveSourceContent` handles `sourceNode.type === 'ai-transform'` explicitly. If the node has `result` with `status === 'success'`, returns `{ text: result.output, type: 'derived' }`. If no result or error status, returns `{ text: '', type: 'derived' }`.

### t-executor-adapter: Implement aiExecutorAdapter calling /api/chat | client adapter
> **Center:** The adapter bridges the domain's execution contract to the existing chat API, proving that AI Transforms compose with existing server infrastructure.
> **Traces:** ac-pipeline-input, ac-streaming-feedback, ac-error-surfacing
> **Depends:** t-executor-port
> **Files:** `src/client/adapters/ai-executor/ai-executor-adapter.ts`
> **Wave:** 3
> **Status:** pending

- **Implements**: da-18
- **Done when**: `aiExecutorAdapter` implements `AiExecutorPort`. Its `execute` method sends a POST to `/api/chat` with `messages: [{ role: 'user', content: request.userMessage }]`, `systemPrompt: request.instruction`, `provider: request.provider`, `model: request.model`. Yields string chunks from the response stream. Handles HTTP errors by throwing with status text.

### t-flow-mapper: Add AiTransformFlowNodeData and toFlowNodes case | adapter extension
> **Center:** The flow mapper bridges domain state to canvas rendering — without it, the AI Transform is invisible on the canvas.
> **Traces:** ac-visual-distinction, ac-instruction-field, ac-output-display, ac-execution-status, ac-streaming-feedback, ac-model-selection
> **Depends:** t-entity
> **Files:** `src/client/adapters/canvas/flow-node-mapper.ts`, `src/client/adapters/canvas/use-canvas-binding.ts`
> **Wave:** 3

> **Status:** pending

- **Implements**: da-22
- **Done when**: `AiTransformFlowNodeData` type defined with: `nodeId`, `instruction`, `provider`, `model`, `autoExecute`, `inputMode`, `roster`, `inputLegend`, `result`, `isStreaming`, plus callbacks: `onInstructionChange`, `onModelChange`, `onInputModeChange`, `onAutoExecuteToggle`, `onExecute`, `onDelete`, `onResizeEnd`. Added to `FlowNodeData` union. `toFlowNodes` has `'ai-transform'` case returning `type: 'aiTransformNode'`. `FlowCallbacks` extended. `useCanvasBinding` accepts and passes through new callbacks.

### t-adapters-context: Add aiExecutor to Adapters type and DI wiring | DI extension
> **Center:** Without DI registration, the AI executor adapter cannot be injected into hooks, breaking clean architecture.
> **Traces:** ac-pipeline-input, ac-streaming-feedback
> **Depends:** t-executor-port, t-executor-adapter
> **Files:** `src/client/ui/app/adapters-context.tsx`, `src/app/page.tsx`
> **Wave:** 4
> **Status:** pending

- **Implements**: da-25
- **Done when**: `Adapters` type includes `aiExecutor: AiExecutorPort`. `page.tsx` creates `aiExecutorAdapter` instance and passes to `AdaptersProvider`. `useAdapters()` return type includes `aiExecutor`.

### t-workspace-handlers: Add AI Transform handlers to use-workspace | hook extension
> **Center:** The workspace hook is the single coordination point where user actions become domain state changes — AI Transform operations must flow through the same channel.
> **Traces:** ac-instruction-field, ac-execution-status, ac-output-display, ac-error-surfacing, ac-streaming-feedback, ac-model-selection, ac-execution-toggle, ac-input-mode-freetext, ac-input-mode-named
> **Depends:** t-transforms-crud, t-execute-use-case, t-adapters-context, t-flow-mapper
> **Files:** `src/client/ui/hooks/use-workspace.ts`
> **Wave:** 5
> **Status:** pending

- **Implements**: da-23
- **Done when**: `useWorkspace` exposes: `handleAddAiTransformNode(position)`, `handleAiInstructionChange(nodeId, instruction)`, `handleAiModelChange(nodeId, provider, model)`, `handleAiInputModeChange(nodeId, inputMode)`, `handleAiAutoExecuteToggle(nodeId)`, `handleExecuteAiTransform(nodeId)`. Execute handler follows `handleSendMessage` pattern: sets streaming state, iterates async generator, updates node with final result, clears streaming state. All handlers call `scheduleSave`.

### t-component: Build AiTransformNode.tsx component | React component
> **Center:** The component is the user's direct interface to the AI Transform — where they write instructions, see results, and control execution.
> **Traces:** ac-instruction-field, ac-execution-status, ac-output-display, ac-error-surfacing, ac-streaming-feedback, ac-model-selection, ac-execution-toggle, ac-input-mode-freetext, ac-input-mode-named, ac-visual-distinction, ac-no-conversation-ui, ac-upstream-error-halt
> **Depends:** t-flow-mapper, t-workspace-handlers
> **Files:** `src/client/ui/components/AiTransformNode.tsx`
> **Wave:** 6
> **Status:** pending

- **Implements**: da-21
- **Done when**: Component renders inside `NodeShell`. Header: status indicator dot, "AI Transform" label, model picker (reuses ChatNode popover pattern), auto/manual toggle, execute button. Body: input legend, instruction textarea, input mode toggle (concat/named), output panel (shows result or error or streaming content). No message list, no conversation UI. Uses `bg-background text-foreground`. All pointer events stopped on interactive elements.

### t-toolbar-canvas: Add AI Transform to toolbar and register node type | UI wiring
> **Center:** Users cannot create AI Transform nodes without a toolbar entry and canvas type registration.
> **Traces:** ac-visual-distinction
> **Depends:** t-component, t-workspace-handlers
> **Files:** `src/client/ui/components/WorkspaceView.tsx`, `src/client/ui/components/Canvas.tsx`
> **Wave:** 7
> **Status:** pending

- **Implements**: da-24
- **Done when**: WorkspaceView toolbar has "+ AI Transform" button that calls `handleAddAiTransformNode`. `Canvas.tsx` registers `aiTransformNode: AiTransformNode` in `nodeTypes`. Feature is end-to-end functional: create node, write instruction, connect source, execute, see output.

### t-auto-execute: Implement autoExecute reactive behavior | hook extension
> **Center:** AutoExecute transforms the AI Transform from a manual tool into a reactive pipeline participant — when upstream content changes, the instruction re-runs automatically.
> **Traces:** ac-execution-toggle
> **Depends:** t-workspace-handlers, t-component
> **Files:** `src/client/ui/hooks/use-ai-auto-execute.ts`, `src/client/ui/components/WorkspaceView.tsx`
> **Wave:** 8
> **Status:** pending

- **Implements**: da-14 (behavioral extension)
- **Done when**: When an ai-transform node has `autoExecute: true` and at least one incoming connection, changing upstream source content triggers re-execution after a 1-second debounce. Re-execution does NOT trigger if the node is already streaming. Toggle autoExecute off mid-stream does NOT cancel current execution but prevents future auto-triggers.

## Execution Waves

| Wave | Tasks | Depends on waves | Shared file risks |
|------|-------|-------------------|-------------------|
| 1 | t-entity | (none) | Creates compile-error ripple in mapper/pipeline/chat files (placeholder cases). |
| 2 | t-transforms-crud | Wave 1 | Sole owner of `kernel/transforms/index.ts` and all new transform files. |
| 3 | t-executor-port, t-execute-use-case, t-pipeline-seed, t-resolve-source, t-executor-adapter, t-flow-mapper | Wave 2 | No intra-wave file conflicts. Each task owns distinct files. `use-workspace.ts` touched by t-pipeline-seed (Wave 5 also touches it). |
| 4 | t-adapters-context | Wave 3 | `adapters-context.tsx` + `page.tsx` — sole owner. |
| 5 | t-workspace-handlers | Wave 4 | `use-workspace.ts` — sole owner in this wave. |
| 6 | t-component | Wave 5 | New file — no conflicts. |
| 7 | t-toolbar-canvas | Wave 6 | `WorkspaceView.tsx` + `Canvas.tsx` — sole owner. |
| 8 | t-auto-execute | Wave 7 | New hook file + `WorkspaceView.tsx`. |
