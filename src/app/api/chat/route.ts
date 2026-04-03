import { streamChat } from "@/server/adapters/anthropic/chat"

export async function POST(request: Request) {
  const body = await request.json()
  const { messages, systemPrompt, model } = body

  if (!Array.isArray(messages) || typeof model !== "string" || !model) {
    return new Response("Missing required fields: messages (array) and model (string)", { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamChat({ messages, systemPrompt, model })) {
          controller.enqueue(encoder.encode(chunk))
        }
        controller.close()
      } catch (e) {
        controller.enqueue(encoder.encode(`\n\n[Error: ${e instanceof Error ? e.message : String(e)}]`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  })
}
