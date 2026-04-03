import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"

type ChatParams = {
  messages: { role: "user" | "assistant"; content: string }[]
  systemPrompt: string
  model: string
  baseURL: string
  apiKeyEnvVar: string
  headers?: Record<string, string>
}

export async function* streamChat(params: ChatParams): AsyncGenerator<string> {
  const apiKey = process.env[params.apiKeyEnvVar]
  if (!apiKey) {
    throw new Error(
      `Missing API key: environment variable "${params.apiKeyEnvVar}" is not set`
    )
  }

  const provider = createOpenAI({
    baseURL: params.baseURL,
    apiKey,
    headers: params.headers,
  })

  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    []

  if (params.systemPrompt) {
    messages.push({ role: "system", content: params.systemPrompt })
  }

  for (const m of params.messages) {
    messages.push({ role: m.role, content: m.content })
  }

  const result = streamText({
    model: provider(params.model),
    messages,
  })

  for await (const chunk of result.textStream) {
    yield chunk
  }
}
