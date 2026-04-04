import { createOpenAI } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { jsonSchema } from "ai"
import type { SchemaField } from "@/kernel/entities"
import { schemaFieldsToJsonSchema } from "../schema-to-json-schema"

type StructuredParams = {
  messages: { role: "user" | "assistant"; content: string }[]
  systemPrompt: string
  model: string
  baseURL: string
  apiKeyEnvVar: string
  schema: SchemaField[]
  schemaMode: "single" | "collection"
}

export async function generateStructured(params: StructuredParams): Promise<string> {
  const apiKey = process.env[params.apiKeyEnvVar]
  if (!apiKey) {
    throw new Error(
      `Missing API key: environment variable "${params.apiKeyEnvVar}" is not set`
    )
  }

  const provider = createOpenAI({
    baseURL: params.baseURL,
    apiKey,
  })

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = []

  if (params.systemPrompt) {
    messages.push({ role: "system", content: params.systemPrompt })
  }

  for (const m of params.messages) {
    messages.push({ role: m.role, content: m.content })
  }

  const result = await generateObject({
    model: provider.chat(params.model),
    schema: jsonSchema(schemaFieldsToJsonSchema(params.schema, params.schemaMode)),
    messages,
  })

  return JSON.stringify(result.object)
}
