---
feature: ai-gateway
center: "Enabling per-conversation model selection so that the same composed context can engage different AI models."
stage: tasks
intensity: standard
execution_mode: parallel
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

### t-model-roster-entity: Define `ModelRosterEntry` type in kernel entities | kernel entity
> **Center:** Gives the entire system a shared vocabulary for provider+model pairs
> **Traces:** ac-model-roster, ac-default-model
> **Depends:** (none)
> **Files:** `src/kernel/entities/model-roster.ts`, `src/kernel/entities/index.ts`
> **Wave:** 1
> **Status:** complete

- **Implements**: da-01
- **Done when**: `ModelRosterEntry` type with `{ provider: string; model: string; displayName: string }` exported from `kernel/entities/index.ts`; no framework imports in the file

### t-update-chat-model-transform: Pure transform to update a chat node's provider+model | kernel transform
> **Center:** Atomic provider+model swap is the mechanism that preserves conversation history during model switching
> **Traces:** ac-node-model-picker, ac-history-continuity, ac-selection-persistence
> **Depends:** (none)
> **Files:** `src/kernel/transforms/update-chat-model.ts`
> **Wave:** 1
> **Status:** complete

- **Implements**: da-02
- **Done when**: `updateChatModel(nodes, nodeId, provider, model)` returns new array with updated provider+model on the target chat node; messages array unchanged; `updatedAt` refreshed; non-chat nodes and other chat nodes untouched

### t-model-roster-port: Define `ModelRosterPort` interface in client domain | port interface
> **Center:** Decouples model discovery from any specific data source via dependency inversion
> **Traces:** ac-model-roster
> **Depends:** (none)
> **Files:** `src/client/domain/ports/model-roster-port.ts`
> **Wave:** 1
> **Status:** complete

- **Implements**: da-03
- **Done when**: `ModelRosterPort` interface exported with `getRoster(): Promise<ModelRosterEntry[]>`; imports only from `kernel/entities`

### t-chat-adapter-send-provider: Add `provider` field to chat adapter fetch body | 1-line fix
> **Center:** Ensures the server knows which provider to dispatch to for each message
> **Traces:** ac-model-dispatch
> **Depends:** (none)
> **Files:** `src/client/adapters/chat/chat-adapter.ts`
> **Wave:** 1
> **Status:** complete

- **Implements**: da-05
- **Done when**: `JSON.stringify` in `chatAdapter.sendMessage` includes `provider: request.provider` in the body object

### t-server-provider-config: Static provider roster and config on the server | server config
> **Center:** Single source of truth for which models are available and how to reach each provider
> **Traces:** ac-model-roster, ac-default-model
> **Depends:** (none)
> **Files:** `src/server/config/providers.ts`
> **Wave:** 1
> **Status:** complete

- **Implements**: da-06
- **Done when**: File exports (1) `MODEL_ROSTER: ModelRosterEntry[]` containing at least Anthropic Claude Sonnet and one other model entry, (2) `PROVIDER_CONFIG` map keyed by provider name with `{ adapterType, apiKeyEnvVar, baseURL?, headers? }`, (3) `DEFAULT_MODEL` entry; imports only from `kernel/entities`

### t-model-roster-adapter: Client adapter that fetches roster from GET /api/models | client adapter
> **Center:** Connects the client's model discovery port to the server's roster endpoint
> **Traces:** ac-model-roster
> **Depends:** t-model-roster-port
> **Files:** `src/client/adapters/model-roster/model-roster-adapter.ts`
> **Wave:** 2
> **Status:** complete

- **Implements**: da-04
- **Done when**: `modelRosterAdapter` implements `ModelRosterPort`; calls `GET /api/models`; parses JSON response into `ModelRosterEntry[]`; throws on non-OK response

### t-openai-streaming-adapter: OpenAI-compatible streaming chat adapter on the server | server adapter
> **Center:** The second provider is the proof that model selection works — without it, "multi-model" is an empty claim
> **Traces:** ac-model-dispatch
> **Depends:** t-server-provider-config
> **Files:** `src/server/adapters/openai-compat/chat.ts`, `package.json`
> **Wave:** 2
> **Status:** complete

- **Implements**: da-07
- **Done when**: `streamChat(params)` exported as `AsyncGenerator<string>` yielding plain text chunks; uses Vercel AI SDK or OpenAI SDK internally; reads API key from env var specified in provider config; params shape matches Anthropic adapter (`messages`, `systemPrompt`, `model`); error thrown on missing API key or API failure

### t-provider-dispatch-route: Dispatch chat route by provider + add GET /api/models | API routes
> **Center:** The server-side switching point that routes messages to the correct AI provider
> **Traces:** ac-model-dispatch, ac-model-roster, ac-dispatch-error-recovery
> **Depends:** t-server-provider-config, t-chat-adapter-send-provider
> **Files:** `src/app/api/chat/route.ts`, `src/app/api/models/route.ts`
> **Wave:** 2
> **Status:** complete

- **Implements**: da-08
- **Done when**: (1) POST `/api/chat` reads `provider` from body, dispatches to provider-specific adapter via lookup; Anthropic entry works identically to current behavior; unknown provider returns 400; missing API key returns 500 (no key leakage); (2) GET `/api/models` returns roster as JSON array

### t-model-change-plumbing: Thread onModelChange callback from hook through flow mapper | callback wiring
> **Center:** Creates the data path for model selection to flow from UI to domain state
> **Traces:** ac-node-model-picker, ac-history-continuity, ac-selection-persistence
> **Depends:** t-update-chat-model-transform
> **Files:** `src/client/adapters/canvas/flow-node-mapper.ts`, `src/client/ui/hooks/use-workspace.ts`
> **Wave:** 2
> **Status:** complete

- **Implements**: da-09
- **Done when**: `ChatFlowNodeData` has `onModelChange: (nodeId: string, provider: string, model: string) => void`; `FlowCallbacks` includes `onModelChange`; `toFlowNodes` passes it through for chat nodes; `useWorkspace` exports `handleModelChange` that calls `updateChatModel` + `scheduleSave`

### t-openai-dispatch-wiring: Wire OpenAI adapter into provider dispatch map | route wiring
> **Center:** Activates the second provider in the dispatch, completing multi-model support
> **Traces:** ac-model-dispatch
> **Depends:** t-openai-streaming-adapter, t-provider-dispatch-route
> **Files:** `src/app/api/chat/route.ts`
> **Wave:** 3
> **Status:** complete

- **Implements**: da-08
- **Done when**: Provider dispatch map in `route.ts` includes entry for OpenAI-compatible provider; sending a message with an OpenAI-compatible provider routes to the OpenAI adapter and streams a response

### t-roster-context-wiring: Add ModelRosterPort to adapters context + roster hook + page.tsx wiring | DI wiring
> **Center:** Makes the model roster available throughout the React tree via dependency injection
> **Traces:** ac-model-roster, ac-default-model
> **Depends:** t-model-roster-adapter, t-provider-dispatch-route
> **Files:** `src/client/ui/app/adapters-context.tsx`, `src/client/ui/hooks/use-model-roster.ts`, `src/app/page.tsx`, `src/client/ui/hooks/use-workspace.ts`
> **Wave:** 3
> **Status:** complete

- **Implements**: da-09
- **Done when**: (1) `Adapters` type includes `modelRoster: ModelRosterPort`; (2) `useModelRoster()` hook returns `{ roster: ModelRosterEntry[], isLoading: boolean }`; (3) `page.tsx` passes `modelRosterAdapter` in adapters; (4) `handleAddChatNode` passes roster default provider+model to `createChatNode` (falls back to hardcoded defaults if roster not loaded)

### t-model-picker-ui: Two-level model picker popover in ChatNode header | UI component
> **Center:** The picker is the user's direct mechanism for exercising per-conversation model choice
> **Traces:** ac-node-model-picker, ac-model-roster, ac-history-continuity
> **Depends:** t-model-change-plumbing, t-roster-context-wiring
> **Files:** `src/client/ui/components/ChatNode.tsx`
> **Wave:** 4
> **Status:** complete

- **Implements**: da-09
- **Done when**: (1) Chat node header shows current model as a clickable element; (2) clicking opens a popover with models grouped by provider; (3) selecting a model calls `onModelChange(nodeId, provider, model)`; (4) picker is disabled during streaming; (5) popover has pointer event stopPropagation to prevent xyflow drag; (6) selected model shown with check indicator

## Execution Waves

| Wave | Tasks | Depends on waves | Shared file risks |
|------|-------|-------------------|-------------------|
| 1 | t-model-roster-entity, t-update-chat-model-transform, t-model-roster-port, t-chat-adapter-send-provider, t-server-provider-config | (none) | `kernel/entities/index.ts` (additive export only — low risk) |
| 2 | t-model-roster-adapter, t-openai-streaming-adapter, t-provider-dispatch-route, t-model-change-plumbing | Wave 1 | `use-workspace.ts` shared with Wave 3 |
| 3 | t-openai-dispatch-wiring, t-roster-context-wiring | Wave 2 | `app/api/chat/route.ts` touched by both waves 2 and 3; `use-workspace.ts` touched in waves 2 and 3 |
| 4 | t-model-picker-ui | Wave 3 | `ChatNode.tsx` (sole owner) |
