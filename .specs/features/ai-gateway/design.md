---
feature: ai-gateway
center: "Enabling per-conversation model selection so that the same composed context can engage different AI models."
stage: design
intensity: standard
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

## System Decomposition

| ID | Name | Type | Layer | Action | Key Attributes | Traces to ACs |
|----|------|------|-------|--------|----------------|---------------|
| da-01 | `ModelRosterEntry` | kernel entity | `kernel/entities/` | create | `{ provider: string, model: string, displayName: string }` | ac-model-roster |
| da-02 | `updateChatModel` | kernel transform | `kernel/transforms/` | create | `(nodes, nodeId, provider, model) => nodes` — updates provider+model atomically, preserves messages | ac-node-model-picker, ac-selection-persistence, ac-history-continuity |
| da-03 | `ModelRosterPort` | client port | `client/domain/ports/` | create | `getRoster(): Promise<ModelRosterEntry[]>` | ac-model-roster, ac-default-model |
| da-04 | `modelRosterAdapter` | client adapter | `client/adapters/model-roster/` | create | Fetches `GET /api/models`, returns `ModelRosterEntry[]` | ac-model-roster |
| da-05 | `chatAdapter` fix | client adapter | `client/adapters/chat/` | modify | Add `provider: request.provider` to fetch body (1-line fix) | ac-model-dispatch |
| da-06 | Provider config + roster data | server config | `server/config/` | create | Static `ModelRosterEntry[]` + `ProviderConfig` map (`adapterType`, `baseURL`, `apiKeyEnvVar`, `headers?`). Roster entries sent to client, provider configs never sent | ac-model-roster, ac-model-dispatch, ac-default-model |
| da-07 | OpenAI-compatible streaming adapter | server adapter | `server/adapters/openai-compat/` | create | Uses Vercel AI SDK with `createOpenAI({ baseURL, apiKey })` + `streamText()`. Yields string chunks. Normalizes errors | ac-model-dispatch |
| da-08 | Provider dispatch + `/api/models` | API routes | `app/api/` | modify chat route, create models route | Chat route: receives `provider`, looks up `ProviderConfig`, dispatches to correct server adapter. Models route: returns roster from server config | ac-model-dispatch, ac-model-roster, ac-dispatch-error-recovery |
| da-09 | Model picker UI + wiring | UI + hooks + mapper | `client/ui/components/`, `client/ui/hooks/`, `client/adapters/canvas/` | modify | Popover in ChatNode header, `onModelChange` callback through flow-node-mapper, `handleModelChange` in use-workspace hook, roster fetched via `ModelRosterPort` in adapters context | ac-node-model-picker, ac-default-model |

## Relationship Map

```
KERNEL (innermost — zero dependencies)
  da-01 ModelRosterEntry ←──────────── pure type, no imports
  da-02 updateChatModel ─────────────→ imports kernel/entities only

CLIENT DOMAIN (ports — depend on kernel only)
  da-03 ModelRosterPort ─────────────→ imports da-01 (ModelRosterEntry)
  ChatPort (existing) ───────────────→ imports kernel/entities (unchanged)

CLIENT ADAPTERS (implement ports — depend on kernel + ports + frameworks)
  da-04 modelRosterAdapter ──────────→ implements da-03, uses fetch()
  da-05 chatAdapter (fix) ───────────→ implements ChatPort (unchanged interface)

CLIENT UI (hooks consume ports via DI, components receive props)
  da-09 use-workspace hook ──────────→ imports da-02 (transform), uses da-03 via useAdapters()
  da-09 flow-node-mapper ────────────→ adds onModelChange callback to ChatFlowNodeData
  da-09 ChatNode.tsx ────────────────→ receives roster + callbacks via props, renders picker
  da-09 adapters-context ────────────→ adds modelRoster: ModelRosterPort to Adapters type

SERVER (imports kernel + Node.js only)
  da-06 provider config ─────────────→ imports da-01 (ModelRosterEntry)
  da-07 openai-compat adapter ───────→ imports ai SDK (framework it adapts), Node.js
  existing anthropic adapter ────────→ unchanged

COMPOSITION ROOT (app/ — wires everything)
  da-08 /api/chat route ─────────────→ imports da-06 (config), da-07 + existing anthropic adapter
  da-08 /api/models route ───────────→ imports da-06 (config)
  page.tsx ───────────────────────────→ adds da-04 to adapters (modelRoster: modelRosterAdapter)
```

All arrows point inward or to peers within the same layer. No outward dependencies. No cycles.

## Behavior Plan

1. **Atomic provider+model update (da-02):** `updateChatModel` MUST update both `provider` and `model` in a single transform call. Separate updates would create a temporal coupling bug where a node briefly has mismatched provider/model. Traces: ac-node-model-picker, ac-history-continuity.

2. **Roster caching (da-04/da-09):** The model roster is static configuration. Fetch once on app mount (or lazily on first picker open). Cache in React state. Do not re-fetch on every popover open. Traces: ac-model-roster.

3. **Picker disabled during streaming (da-09):** When `isStreaming` is true for a chat node, the model picker trigger is visually disabled and non-interactive. Traces: ac-node-model-picker.

4. **Dispatch error normalization (da-08):** Unknown provider → 400. Missing API key → 500 (no key leakage). Provider API error during streaming → error chunk appended to stream (existing pattern). Traces: ac-dispatch-error-recovery.

5. **Default model from roster (da-09):** `handleAddChatNode` reads the first entry from the cached roster and passes `provider`/`model` to `createChatNode()`. If roster hasn't loaded yet, fall back to the existing hardcoded default. Traces: ac-default-model.

## UI Plan

**ChatNode header change:**

Current: `[indicator] Chat  claude sonnet  [chat] [details] [reset]`
New: `[indicator] Chat  [claude sonnet ▾]  [chat] [details] [reset]`

The model slug becomes a clickable trigger (same 10px muted text, with a tiny chevron-down to signal interactivity).

**Interaction flow (2 interactions max per ac-node-model-picker):**

1. Click model slug in header → Popover opens
2. Click a model in the list → Popover closes, header updates, node state updated

**Popover content:**

```
Anthropic
  Claude Sonnet 4        ✓
  Claude Haiku 3.5
OpenAI
  GPT-4o
  GPT-4o mini
```

- Grouped by provider (provider name as small muted header)
- Current selection has a check mark
- No search, no filtering (roster is small for solo user)
- Uses shadcn Popover component
- `onPointerDown` stopPropagation to prevent xyflow canvas drag

**Model identity in messages:** Assistant messages labeled with `modelShort` derived from current node model. Per-message model attribution deferred (would require Message entity change).

## Data Plan

**New kernel entity** — `kernel/entities/model-roster-entry.ts`:
```typescript
export type ModelRosterEntry = {
  provider: string
  model: string
  displayName: string
}
```

Added to barrel export in `kernel/entities/index.ts`.

**Server config** — `server/config/model-roster.ts`:
Static `ModelRosterEntry[]` array + `ProviderConfig` map. Provider configs include `adapterType` ("anthropic-native" | "openai-compatible"), `apiKeyEnvVar`, optional `baseURL` and `headers`.

**Workspace schema:** No migration needed. `ChatNodeData` already has `provider: string` and `model: string`. Version envelope stays at `4`.

**Adapters context:** Add `modelRoster: ModelRosterPort` to the `Adapters` type.

## Integration Plan

| Service | Adapter | Auth | Notes |
|---------|---------|------|-------|
| Anthropic API | `server/adapters/anthropic/chat.ts` (existing) | `ANTHROPIC_API_KEY` | No changes needed |
| OpenAI-compatible endpoint | `server/adapters/openai-compat/chat.ts` (new) | Per-provider env var from `ProviderConfig.apiKeyEnvVar` | Uses Vercel AI SDK `createOpenAI()` with custom `baseURL`. Supports Portkey (different `baseURL` + headers), direct OpenAI, or any OpenAI-compatible provider |

| Endpoint | Method | Request | Response | Notes |
|----------|--------|---------|----------|-------|
| `/api/models` (new) | GET | — | `{ models: ModelRosterEntry[] }` | Static config, no auth. First entry is default |
| `/api/chat` (modify) | POST | Add `provider` to body | Stream (unchanged) | Dispatch based on provider → providerConfigs → correct adapter |

**Gateway replacement path:** To switch to Portkey, change `ProviderConfig` entry's `baseURL` and `headers`. No code changes. To switch to Vercel AI SDK gateway, same — the openai-compatible adapter already uses it.

## Verification Strategy

| AC | Method | Key Assertion |
|----|--------|---------------|
| ac-model-roster | Integration: `GET /api/models` | Returns `ModelRosterEntry[]` with at least one entry; first entry has valid provider + model |
| ac-node-model-picker | E2E/Manual | Click model slug → popover shows grouped models → click model → popover closes, header shows new model. Disabled during streaming. |
| ac-model-dispatch | Integration | Send message with provider P, model M → API dispatches to correct adapter → response streams back. Model identity in header matches selection. |
| ac-history-continuity | Unit test on `updateChatModel` | `updateChatModel(nodes, id, newP, newM)` → result node has same messages array. Messages untouched. |
| ac-selection-persistence | E2E | Select non-default model → save → reload → same model shown in header |
| ac-default-model | Unit + E2E | New chat node gets first roster entry's provider/model. Header shows matching displayName. |
| ac-dispatch-error-recovery | Integration/Manual | Invalid key → error in chat → switch model → retry → success. Messages preserved throughout. |
