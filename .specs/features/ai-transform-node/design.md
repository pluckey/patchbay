---
feature: ai-transform-node
center: "The AI Transform lets users define a single LLM processing instruction that operates as a composable, low-friction step in a spatial information pipeline."
stage: design
intensity: standard
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

## System Decomposition

| ID | Name | Type | Layer | Action | Key Attributes | Traces to ACs |
|----|------|------|-------|--------|----------------|---------------|
| da-10 | `AiTransformNodeData` | kernel entity | `kernel/entities/` | create | `BaseNode & { type: 'ai-transform', instruction, provider, model, autoExecute, inputMode, result }` | ac-pipeline-input, ac-instruction-field, ac-execution-toggle, ac-input-mode-freetext, ac-input-mode-named, ac-model-selection |
| da-11 | `createAiTransformNode` | kernel transform | `kernel/transforms/` | create | `(position, provider?, model?) => WorkspaceNode` — uses defaults from roster | ac-pipeline-input, ac-model-selection |
| da-12 | `updateAiInstruction` | kernel transform | `kernel/transforms/` | create | `(nodes, nodeId, instruction) => nodes` — pure, immutable | ac-instruction-field |
| da-13 | `updateAiTransformModel` | kernel transform | `kernel/transforms/` | create | `(nodes, nodeId, provider, model) => nodes` — atomic update | ac-model-selection |
| da-14 | `toggleAutoExecute` | kernel transform | `kernel/transforms/` | create | `(nodes, nodeId) => nodes` — flips autoExecute boolean | ac-execution-toggle |
| da-15 | `updateAiInputMode` | kernel transform | `kernel/transforms/` | create | `(nodes, nodeId, inputMode) => nodes` — switches concat/named | ac-input-mode-freetext, ac-input-mode-named |
| da-16 | `resolveAiTransformPrompt` | kernel transform | `kernel/transforms/` | create | `(instruction, inputs, inputMode) => { systemPrompt, userMessage }` — handles concat vs named templating | ac-input-mode-freetext, ac-input-mode-named |
| da-17 | `AiExecutorPort` | client port | `client/domain/ports/` | create | `execute(instruction, inputs, inputMode, provider, model) => AsyncIterable<string>` | ac-pipeline-input, ac-pipeline-output, ac-streaming-feedback |
| da-18 | `aiExecutorAdapter` | client adapter | `client/adapters/ai-executor/` | create | Calls `/api/chat` with resolved prompt, streams text chunks | ac-pipeline-input, ac-streaming-feedback |
| da-19 | `executePipelineGraph` extension | use case | `client/domain/use-cases/` | modify | Add `ai-transform` dispatch to `AiExecutorPort`; handle streaming accumulation into `TransformResult` | ac-pipeline-input, ac-pipeline-output, ac-upstream-error-halt |
| da-20 | `resolveSourceContent` extension | use case | `client/domain/use-cases/` | modify | Add `ai-transform` case: return result.output (same as transform derived content path) | ac-pipeline-output |
| da-21 | `AiTransformNode.tsx` | UI component | `client/ui/components/` | create | Instruction textarea, model picker, auto/manual toggle, input legend, output display, run button | ac-visual-distinction, ac-no-conversation-ui, ac-instruction-field, ac-execution-status, ac-output-display, ac-error-surfacing, ac-streaming-feedback |
| da-22 | Flow node mapper extension | adapter | `client/adapters/canvas/` | modify | Add `AiTransformFlowNodeData` type, map ai-transform nodes | ac-pipeline-input, ac-visual-distinction |
| da-23 | `useWorkspace` extension | hook | `client/ui/hooks/` | modify | Add `handleAddAiTransformNode`, `handleAiInstructionChange`, `handleAiModelChange`, `handleToggleAutoExecute`, `handleAiInputModeChange` | ac-instruction-field, ac-model-selection, ac-execution-toggle, ac-input-mode-freetext, ac-input-mode-named |
| da-24 | `WorkspaceView` extension | UI component | `client/ui/components/` | modify | Add "AI Transform" to the node creation toolbar | ac-visual-distinction |
| da-25 | `adapters-context` extension | DI provider | `client/ui/app/` | modify | Add `aiExecutor: AiExecutorPort` to Adapters type | ac-pipeline-input |

## Relationship Map

```
KERNEL (innermost — zero dependencies)
  da-10 AiTransformNodeData ─────────→ extends BaseNode (kernel/entities only)
  da-11 createAiTransformNode ───────→ imports kernel/entities only
  da-12 updateAiInstruction ─────────→ imports kernel/entities only
  da-13 updateAiTransformModel ──────→ imports kernel/entities only
  da-14 toggleAutoExecute ───────────→ imports kernel/entities only
  da-15 updateAiInputMode ───────────→ imports kernel/entities only
  da-16 resolveAiTransformPrompt ────→ imports kernel/entities only (pure string transform)

CLIENT DOMAIN (ports — depend on kernel only)
  da-17 AiExecutorPort ─────────────→ imports TransformResult from kernel

CLIENT ADAPTERS (implement ports — depend on kernel + ports + frameworks)
  da-18 aiExecutorAdapter ──────────→ implements da-17, uses fetch() to /api/chat
  da-22 flow-node-mapper ───────────→ adds AiTransformFlowNodeData, maps ai-transform nodes

CLIENT USE CASES (depend on kernel + ports)
  da-19 executePipelineGraph ───────→ imports da-17 (AiExecutorPort), dispatches ai-transform execution
  da-20 resolveSourceContent ───────→ handles ai-transform output (existing derived content path)

CLIENT UI (hooks consume ports via DI, components receive props)
  da-21 AiTransformNode.tsx ────────→ receives all data + callbacks via props
  da-23 useWorkspace (extended) ────→ imports da-11..15 (transforms), uses da-17 via useAdapters()
  da-24 WorkspaceView (extended) ───→ adds button to create ai-transform nodes

COMPOSITION ROOT
  da-25 adapters-context ───────────→ adds da-18 to adapters (aiExecutor: aiExecutorAdapter)
  page.tsx ──────────────────────────→ passes aiExecutorAdapter instance
```

All arrows point inward. No cycles. No outward dependencies.

## Behavior Plan

1. **Input resolution — concat mode (da-16):** All resolved inputs are concatenated into a single text block with labeled headers (`--- [label] ---\n[content]\n`). The concatenated text is sent as the user message, with the instruction as the system prompt. Traces: ac-input-mode-freetext.

2. **Input resolution — named mode (da-16):** `{{label}}` placeholders in the instruction are replaced with the corresponding connection's resolved content. Unresolved references (labels that don't match any connection) produce a clear error — the transform does not execute. Traces: ac-input-mode-named.

3. **Atomic provider+model update (da-13):** Same pattern as existing `updateChatModel` — updates both fields in one transform call. No temporal mismatch. Traces: ac-model-selection.

4. **Auto-execute behavior (da-14, da-19):** When `autoExecute: true`, the pipeline executor includes the ai-transform node in automatic pipeline runs triggered by upstream changes. When `autoExecute: false`, the node only executes on manual "Run" button press. Default is `false` (manual) because LLM calls are expensive and their outputs require inspection. Traces: ac-execution-toggle.

5. **Streaming execution (da-17, da-18):** The `AiExecutorPort.execute()` returns `AsyncIterable<string>`, matching the existing `ChatPort.sendMessage()` pattern. The adapter calls `/api/chat` with instruction as `systemPrompt` and resolved input as the user message. The pipeline executor accumulates chunks into a final `TransformResult { status: 'success', output: fullText, durationMs }`. Traces: ac-pipeline-input, ac-streaming-feedback.

6. **Running status feedback (da-19, da-21):** Before dispatching the LLM call, the pipeline executor sets the node's result to `{ status: 'running' }`. The AiTransformNode component shows a running indicator. Partial streaming text may be shown in the output area during generation. Traces: ac-execution-status, ac-streaming-feedback.

7. **Error propagation (da-19):** LLM errors are caught and returned as `TransformResult { status: 'error', message }`. Upstream errors prevent execution — the node shows "waiting for upstream" state. Traces: ac-error-surfacing, ac-upstream-error-halt.

8. **Reuse of `/api/chat` (da-18):** The AI Transform adapter composes a standard chat request: instruction as `systemPrompt`, resolved input as a single user message, provider and model from node data. No new API endpoint needed. Traces: ac-pipeline-input, ac-model-selection.

## UI Plan

**AiTransformNode layout:**

```
[indicator] AI Transform  [@anthropic/claude-sonnet-4 v]  [auto|manual]  [▶]
+------------------------------------------------------------------------+
| Instruction                                              [concat|named] |
| [textarea: "Summarize the key arguments..."]                           |
+------------------------------------------------------------------------+
| Inputs: source_a (Document.md), source_b (Paper.pdf)                   |
+------------------------------------------------------------------------+
| Output                                                   [running...]  |
| [rendered output text or error message]                                |
+------------------------------------------------------------------------+
```

- **Header:** "AI Transform" label with indicator dot (idle=muted, running=animated, success=green, error=red). Model picker (reuses ChatNode popover pattern). Auto/manual toggle (small switch). Run button (play icon, disabled during auto or running). Delete button on hover (existing NodeShell pattern).
- **Instruction area:** Resizable textarea. In named mode, `{{label}}` references are visually distinct. Input mode toggle (concat/named) in the section header.
- **Input legend:** Shows connected input labels and source node names. Same pattern as TransformNode's input display.
- **Output area:** Shows TransformResult output (rendered text) or error message. Running state shows partial streaming text or spinner.
- **Visual distinction from Chat:** No message list, no message input field, no reset button, no role labels. Visually compact — instruction + output, not conversation.
- **Visual distinction from Transform:** No code editor, no timeout control. Uses a plain textarea instead of a monospace code block.

## Data Plan

**New kernel entity fields** — added to `WorkspaceNode` discriminated union:

```typescript
type AiTransformNodeData = {
  type: 'ai-transform'
  instruction: string
  provider: string
  model: string
  autoExecute: boolean
  inputMode: 'concat' | 'named'
  result: TransformResult | null
}
```

Added to barrel export in `kernel/entities/index.ts`.

**WorkspaceNode union:** `type WorkspaceNode = ... | (BaseNodeFields & AiTransformNodeData)`

**Workspace schema:** No version bump needed. Existing workspaces have no ai-transform nodes. New nodes appear in the nodes array with `type: 'ai-transform'`. Loading a workspace without ai-transform nodes works unchanged.

**New port** — `client/domain/ports/ai-executor-port.ts`:

```typescript
export interface AiExecutorPort {
  execute(params: {
    instruction: string
    inputs: Record<string, string>
    inputMode: 'concat' | 'named'
    provider: string
    model: string
  }): AsyncIterable<string>
}
```

**Adapters context:** Add `aiExecutor: AiExecutorPort` to the `Adapters` type.

## Integration Plan

| Service | Adapter | Auth | Notes |
|---------|---------|------|-------|
| LLM providers (via Portkey) | Reuses `/api/chat` route + `openai-compat` adapter | `PORTKEY_API_KEY` | AI Transform calls are indistinguishable from chat calls at the API level |

| Endpoint | Method | Request | Response | Notes |
|----------|--------|---------|----------|-------|
| `/api/chat` (existing) | POST | `{ messages, systemPrompt, model, provider }` | Stream | Instruction as systemPrompt, resolved input as user message |
| `/api/models` (existing) | GET | — | `ModelRosterEntry[]` | Reused for AI Transform model picker |

No new API endpoints needed.

## Verification Strategy

| AC | Method | Key Assertion |
|----|--------|---------------|
| ac-pipeline-input | Integration + E2E | Connect markdown to ai-transform; resolved text arrives as input; output available to downstream |
| ac-pipeline-output | Integration | AI Transform output consumable by downstream Transform, Chat, or AI Transform nodes |
| ac-instruction-field | E2E | Write instruction, save workspace, reload — instruction persists |
| ac-execution-status | E2E | Node shows idle → running → success/error states with visual distinction |
| ac-output-display | E2E | Successful execution shows output in node body; same content available downstream |
| ac-error-surfacing | Integration/Manual | Invalid API key → error displayed; rate limit → error displayed; instruction preserved |
| ac-upstream-error-halt | E2E | Upstream error → AI Transform shows waiting state, does not execute |
| ac-execution-toggle | E2E | Auto: re-executes on upstream change. Manual: only on button press. Toggle persists. |
| ac-input-mode-freetext | Unit + E2E | Concat mode: inputs joined with labeled headers, sent as user message |
| ac-input-mode-named | Unit + E2E | Named mode: `{{label}}` replaced; unresolved reference → error, not silent empty |
| ac-model-selection | E2E | Select model, execute, verify provider+model in request. Persists across reload. |
| ac-visual-distinction | Manual | Side-by-side with Chat node — visually distinct, no conversation elements |
| ac-no-conversation-ui | Manual | No message list, no turn-taking. Re-run replaces output, not appends. |
| ac-streaming-feedback | E2E (evaluate) | Running state shows indicator; output appears progressively or on completion |
