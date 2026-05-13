import { PROVIDER_CONFIG, type ProviderConfig } from "@/server/config/providers"
import { streamChat as streamAnthropic } from "@/server/adapters/anthropic/chat"
import { streamChat as streamOpenAICompat } from "@/server/adapters/openai-compat/chat"
import { generateStructured as generateStructuredAnthropic } from "@/server/adapters/anthropic/structured"
import { generateStructured as generateStructuredOpenAI } from "@/server/adapters/openai-compat/structured"
import { withChatGuardrails } from "@/lib/chat-guard"
import type { SchemaField } from "@/kernel/entities"

type ChatParams = { messages: { role: "user" | "assistant"; content: string }[]; systemPrompt: string; model: string }

const adapterMap: Record<ProviderConfig["adapterType"], (params: ChatParams, config: ProviderConfig) => AsyncGenerator<string>> = {
  "anthropic-native": (params) => streamAnthropic(params),
  "openai-compatible": (params, config) => streamOpenAICompat({
    ...params,
    baseURL: config.baseURL!,
    apiKeyEnvVar: config.apiKeyEnvVar,
  }),
}

type StructuredParams = ChatParams & { schema: SchemaField[]; schemaMode: "single" | "collection" }

const structuredAdapterMap: Record<ProviderConfig["adapterType"], (params: StructuredParams, config: ProviderConfig) => Promise<string>> = {
  "anthropic-native": (params) => generateStructuredAnthropic(params),
  "openai-compatible": (params, config) => generateStructuredOpenAI({
    ...params,
    baseURL: config.baseURL!,
    apiKeyEnvVar: config.apiKeyEnvVar,
  }),
}

export async function POST(request: Request) {
  return withChatGuardrails(request, async (body) => {
  const { messages, systemPrompt, model, provider, schema, schemaMode } = body as {
    messages?: { role: "user" | "assistant"; content: string }[]
    systemPrompt?: string
    model?: string
    provider?: string
    schema?: SchemaField[]
    schemaMode?: "single" | "collection"
  }

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

  // Structured output path (non-streaming)
  if (Array.isArray(schema) && schema.length > 0) {
    try {
      const generate = structuredAdapterMap[providerConfig.adapterType]
      const resolvedMode = schemaMode === "collection" ? "collection" as const : "single" as const
      const jsonString = await generate({ messages: messages!, systemPrompt: systemPrompt ?? "", model: model!, schema, schemaMode: resolvedMode }, providerConfig)
      return new Response(jsonString, {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      })
    } catch (e) {
      return new Response(e instanceof Error ? e.message : String(e), { status: 502 })
    }
  }

  // Streaming text path (existing)
  const createStream = adapterMap[providerConfig.adapterType]
  const chatStream = createStream({ messages: messages!, systemPrompt: systemPrompt ?? "", model: model! }, providerConfig)

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
  })
}
