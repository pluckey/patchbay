import type { ChatPort, ChatRequest } from "@/client/domain/ports/chat-port"

export const chatAdapter: ChatPort = {
  async *sendMessage(request: ChatRequest): AsyncGenerator<string> {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: request.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        systemPrompt: request.systemPrompt,
        model: request.model,
      }),
    })

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error("No response body")

    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      yield decoder.decode(value, { stream: true })
    }
  },
}
