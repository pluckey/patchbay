import type { WorkspaceNode, Message } from "@/kernel/entities"
import type { ChatPort } from "@/client/domain/ports/chat-port"

type SendChatMessageParams = {
  nodeId: string
  content: string
  systemPrompt: string
  nodes: WorkspaceNode[]
  chat: ChatPort
}

type StateUpdate =
  | { type: "user-message"; nodeId: string; messages: Message[] }
  | { type: "streaming"; nodeId: string; messages: Message[] }
  | { type: "complete"; nodeId: string; messages: Message[] }
  | { type: "error"; nodeId: string; messages: Message[] }

export async function* sendChatMessage(
  params: SendChatMessageParams
): AsyncGenerator<StateUpdate> {
  const { nodeId, content, systemPrompt, nodes, chat } = params

  const node = nodes.find((n) => n.id === nodeId)
  if (!node || node.type !== "chat") return

  const userMessage: Message = { role: "user", content, createdAt: Date.now() }
  const messagesWithUser = [...node.messages, userMessage]

  // Emit user message added
  yield { type: "user-message", nodeId, messages: messagesWithUser }

  try {
    let assistantContent = ""
    const assistantCreatedAt = Date.now()

    for await (const chunk of chat.sendMessage({
      messages: messagesWithUser,
      systemPrompt,
      provider: node.provider,
      model: node.model,
    })) {
      assistantContent += chunk
      yield {
        type: "streaming",
        nodeId,
        messages: [...messagesWithUser, { role: "assistant", content: assistantContent, createdAt: assistantCreatedAt }],
      }
    }

    yield {
      type: "complete",
      nodeId,
      messages: [...messagesWithUser, { role: "assistant", content: assistantContent, createdAt: assistantCreatedAt }],
    }
  } catch (e) {
    yield {
      type: "error",
      nodeId,
      messages: [...messagesWithUser, {
        role: "assistant",
        content: `Error: ${e instanceof Error ? e.message : String(e)}`,
        createdAt: Date.now(),
      }],
    }
  }
}
