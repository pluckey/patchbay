---
feature: ai-gateway
center: "Enabling per-conversation model selection so that the same composed context can engage different AI models."
stage: requirements
intensity: standard
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

## Acceptance Criteria

### ac-model-roster: Available models are configured and surfaced
> **Center:** Without knowing what models are available, the user cannot select one — the roster is the prerequisite data that populates the selection mechanism.

The system provides a configured list of provider-model pairs. The client can retrieve this list. Each entry identifies the provider and a human-readable model name. If no providers are configured, the system indicates this clearly rather than showing an empty or broken picker.

### ac-node-model-picker: User selects provider and model per chat node
> **Center:** This is the direct mechanism of per-conversation model selection — the user exercises choice at the node level through a two-level picker.

Each chat node offers a two-level selection: provider first, then model. The current selection is visible in the node's header without opening a menu or switching tabs. Changing selection requires no more than two interactions. The picker only shows models available from the selected provider.

### ac-model-dispatch: Messages route to the selected model
> **Center:** Selection is meaningless without dispatch — this AC proves the chosen model actually receives and responds to the user's messages.

When the user sends a message in a chat node, the request is dispatched to the provider and model currently selected on that node. The response streams back from that specific model. The user can verify which model responded (model identity is shown alongside responses).

### ac-history-continuity: Conversation history carries over on model switch
> **Center:** History continuity is the mechanism that makes model switching a comparison tool rather than a restart — without it, each model change discards the composed conversation.

When the user changes the selected model on a chat node mid-conversation, all prior messages remain visible and are included in subsequent requests to the new model. No messages are lost, transformed, or sanitized. The user can continue the conversation with the new model immediately.

### ac-selection-persistence: Model selection survives save and reload
> **Center:** If model selection is lost on reload, the user must reconfigure every node on every session — defeating the purpose of per-conversation selection.

The selected provider and model for each chat node persist as part of the workspace. When the workspace is reloaded (page refresh, reopen), each chat node retains its previously selected provider and model.

### ac-default-model: New chat nodes start with a usable default
> **Center:** A sensible default ensures model selection enhances but does not gate the chat experience — users can chat immediately and change models when motivated.

When a new chat node is created, it is pre-configured with a default provider and model from the available roster. The user can send messages immediately without first configuring model selection.

### ac-dispatch-error-recovery: Dispatch failures are visible and recoverable **(E)**
> **Center:** If a dispatch failure leaves the conversation broken, the user loses both their composed context and conversation history — the opposite of model freedom.

If a request to the selected model fails (network error, invalid credentials, model unavailable), the error is displayed in the chat node. The conversation history is preserved. The user can switch to a different model and continue the conversation without data loss.

## Scope

**IN (building):**
- Configured roster of provider-model pairs
- Two-level provider > model picker on chat nodes
- Request dispatch to selected model with streaming response
- Conversation history preservation across model switches
- Model selection persistence in workspace
- Default model for new chat nodes
- Error display and recovery

**OUT (explicitly not building):**
- Gateway configuration UI (gateways are deployment infrastructure)
- Model-specific parameter tuning (temperature, max tokens, top-p)
- Automatic model routing or recommendation
- Side-by-side multi-model comparison
- Cross-node model coherence or workspace-level model defaults
- Dynamic model discovery or gateway introspection
- Provider-specific feature support (vision, function calling, etc.)
- BYOK (bring your own key) user interface

**DEFERRED:**
- BYOK credential management for non-deployer users
- Second gateway integration (build for one, design for replacement)
- Model-specific parameter controls
- Model availability health monitoring
- Gateway abstraction layer (premature until second gateway exists)

## Dependencies

- Existing chat node infrastructure (ChatNodeData entity with provider and model fields, ChatPort interface with ChatRequest, streaming chat API route)
- Existing workspace persistence (StoragePort with save/load, server-side state persistence)
- Existing node creation flow (create-chat-node transform, workspace hooks)

## User Scenarios

**Scenario 1 — First model switch** (ac-node-model-picker, ac-model-dispatch):
A user has been chatting with the default model about a code review. They want a second perspective. They glance at the chat node header and see the current model displayed prominently. They click to open the picker, select a different provider, then select a model from that provider. They type their next question. The response streams back from the newly selected model, and the model's identity is visible next to its response.

**Scenario 2 — Model exploration mid-conversation** (ac-history-continuity, ac-model-dispatch):
A user has a five-message conversation with Model A about a design problem. They switch to Model B. Model B receives the full conversation history and responds in the context of the prior exchange. The user can see which messages came from which model. They switch back to Model A to follow up on its earlier suggestion — history is intact, Model A responds coherently.

**Scenario 3 — Workspace reload** (ac-selection-persistence, ac-default-model):
A user has three chat nodes, each configured with different models for different tasks. They close the browser and return later. All three nodes load with their previously selected models intact. They create a fourth chat node — it appears with the default model pre-selected and ready to use immediately.

**Scenario 4 — Error and recovery** (ac-dispatch-error-recovery, ac-node-model-picker):
A user selects a model whose provider credentials have expired. They send a message. The node displays an error message indicating the failure. Their conversation history is untouched. They open the picker, switch to a different provider's model, and continue their conversation seamlessly.
