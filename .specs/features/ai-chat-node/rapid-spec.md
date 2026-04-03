---
feature: ai-chat-node
center: "The chat node closes the feedback loop between spatial context arrangement and AI interpretation, letting users discover what their composition actually communicates and refine it conversationally."
center_test:
  excludes: "Batch export to static document — produces output but no feedback loop"
  boundary: "Context preview pane — visibility without conversation"
mode: express
analogues: []
---

## Design Decision: Gall's Law

Build the dumbest possible chat node. One input (pipeline-composed context = system prompt), one provider (Claude via API route), streaming response, messages on the node. Use it. Let the system tell you what it needs next.

**Not in v1:** multi-provider switching, context quality feedback, context-change warnings, fan-in composition, prompt templates, sycophancy detection. These are future features, not missing features.

## Acceptance Criteria

### ac-chat-node-type: Chat is a new node type on the canvas
A ChatNodeData entity with `messages: Message[]`, `provider: string`, `model: string`. Created from toolbar ("+ Chat"). Resizable, deletable, same NodeShell chrome as other nodes.

### ac-pipeline-input: Chat node receives pipeline-composed text as system prompt
When a transform node's output edge connects to a chat node, the derived content becomes the system prompt for the AI conversation. The chat node displays a truncated preview of the system prompt so the user can see what context the AI received.

### ac-send-message: User can type and send a message
Input field at the bottom of the chat node. Enter to send. The message, plus the system prompt (pipeline input), plus conversation history, is sent to the AI. The input clears after sending.

### ac-streaming-response: AI response streams into the chat node without blocking the canvas
The response appears token-by-token. The user can move other nodes, edit transforms, and interact with the canvas while the response streams. The chat node shows a visual indicator while streaming.

### ac-message-history: Conversation persists on the node across page reload
Messages are stored on the ChatNodeData entity and saved via the existing workspace persistence. Full conversation loads on page reload.

### ac-api-route: AI calls go through a Next.js API route, not directly from the browser
The API key is never in client code. The API route accepts messages + system prompt, streams back the response. Provider/model configurable per node.

### ac-context-reinjection: Full pipeline context is re-sent as system prompt on every message
The chat node always uses the CURRENT pipeline output as the system prompt, even if upstream transforms changed since the last message. No caching, no freezing. Gall: if this causes incoherence, you'll notice.

## Tasks

### t-chat-entity: Add ChatNodeData to kernel entities
> **Traces:** ac-chat-node-type, ac-message-history
> **Status:** pending

- Add `ChatNodeData` to WorkspaceNode union in `kernel/entities/workspace-node.ts`: `{ type: "chat", messages: Message[], provider: string, model: string }`
- Add `Message` type: `{ role: "user" | "assistant", content: string, createdAt: number }`
- Add `createChatNode` kernel transform
- Update barrel exports
- Storage migration v5: existing nodes unaffected (additive type)

### t-chat-port: Create ChatPort interface in client domain
> **Traces:** ac-api-route, ac-streaming-response
> **Status:** pending

- `ChatPort` in `client/domain/ports/chat-port.ts`
- Method: `sendMessage(params: { messages: Message[], systemPrompt: string, provider: string, model: string }): AsyncIterable<string>`
- Returns an async iterable of text chunks (streaming)

### t-api-route: Create Next.js API route for AI chat
> **Traces:** ac-api-route, ac-streaming-response
> **Status:** pending

- `src/app/api/chat/route.ts` — POST endpoint
- Accepts `{ messages, systemPrompt, provider, model }`
- Calls Anthropic API (Claude) with streaming
- Returns a ReadableStream of text chunks
- API key from environment variable (`ANTHROPIC_API_KEY`)
- Install `@anthropic-ai/sdk`

### t-chat-adapter: Create ChatPort adapter that calls the API route
> **Traces:** ac-api-route, ac-streaming-response
> **Status:** pending

- `src/client/adapters/chat/chat-adapter.ts`
- Implements ChatPort via `fetch('/api/chat', ...)` with streaming response
- Parses the ReadableStream into an AsyncIterable of text chunks
- Wire into AdaptersContext

### t-chat-node-component: Create ChatNode component
> **Traces:** ac-chat-node-type, ac-send-message, ac-streaming-response, ac-message-history, ac-pipeline-input, ac-context-reinjection
> **Status:** pending

- `src/client/ui/components/ChatNode.tsx`
- Header: "Chat" label, model indicator, streaming status
- Body: scrollable message list (user messages right-aligned, assistant left-aligned)
- System prompt preview: truncated, expandable
- Footer: text input + send button
- On send: calls `useAdapters().chat.sendMessage(...)` with current pipeline output as systemPrompt
- Streams response into a temporary assistant message, finalized on completion
- Messages saved to node entity after each exchange
- Register in Canvas.tsx nodeTypes + flow-node-mapper

### t-chat-workspace-wiring: Wire chat CRUD into useWorkspace and pipeline
> **Traces:** ac-chat-node-type, ac-message-history, ac-pipeline-input, ac-context-reinjection
> **Status:** pending

- Add `handleSendChatMessage`, `handleAddChatNode` to useWorkspace
- Chat node reads derived content from pipeline results (same as MarkdownNode derived mode)
- The derived content = the system prompt for the AI
- Toolbar gets "+ Chat" button
- Flow-node-mapper gets ChatFlowNodeData type + mapping

### t-verify: Build + smoke test
> **Traces:** ac-chat-node-type, ac-pipeline-input, ac-send-message, ac-streaming-response, ac-message-history, ac-api-route, ac-context-reinjection
> **Status:** pending

- `npx tsc --noEmit` and `npm run build` pass
- Manual: create chat node, connect pipeline to it, type message, verify streaming response, reload and verify persistence, change upstream transform and verify context updates
