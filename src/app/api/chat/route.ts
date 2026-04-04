import { PROVIDER_CONFIG } from "@/server/config/providers"
import { streamChat as streamOpenAICompat } from "@/server/adapters/openai-compat/chat"

export async function POST(request: Request) {
  const body = await request.json()
  const { messages, systemPrompt, model, provider } = body

  if (!Array.isArray(messages) || typeof model !== "string" || !model) {
    return new Response("Missing required fields: messages (array) and model (string)", { status: 400 })
  }

  if (typeof provider !== "string" || !provider) {
    return new Response("Missing required field: provider (string)", { status: 400 })
  }

  const providerConfig = PROVIDER_CONFIG[provider]
  if (!providerConfig) {
    return new Response(`Unknown provider: "${provider}"`, { status: 400 })
  }

  const apiKey = process.env[providerConfig.apiKeyEnvVar]
  if (!apiKey) {
    return new Response("Server configuration error: API key not configured for this provider", { status: 500 })
  }

  const chatStream = streamOpenAICompat({
    messages,
    systemPrompt,
    model,
    baseURL: providerConfig.baseURL,
    apiKeyEnvVar: providerConfig.apiKeyEnvVar,
    headers: providerConfig.headers,
  })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of chatStream) {
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
