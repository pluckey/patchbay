import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

type ChatParams = {
  messages: { role: "user" | "assistant"; content: string }[]
  systemPrompt: string
  model: string
}

export async function* streamChat(params: ChatParams): AsyncGenerator<string> {
  const stream = client.messages.stream({
    model: params.model,
    max_tokens: 4096,
    ...(params.systemPrompt ? { system: params.systemPrompt } : {}),
    messages: params.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  })

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text
    }
  }
}
