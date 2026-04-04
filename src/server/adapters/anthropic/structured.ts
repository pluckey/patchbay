import Anthropic from "@anthropic-ai/sdk"
import type { SchemaField } from "@/kernel/entities"
import { schemaFieldsToJsonSchema } from "../schema-to-json-schema"

const client = new Anthropic()

type StructuredParams = {
  messages: { role: "user" | "assistant"; content: string }[]
  systemPrompt: string
  model: string
  schema: SchemaField[]
}

export async function generateStructured(params: StructuredParams): Promise<string> {
  const jsonSchema = schemaFieldsToJsonSchema(params.schema)

  const response = await client.messages.create({
    model: params.model,
    max_tokens: 4096,
    ...(params.systemPrompt ? { system: params.systemPrompt } : {}),
    messages: params.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    tools: [
      {
        name: "structured_output",
        description: "Return structured output matching the schema",
        input_schema: jsonSchema as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool" as const, name: "structured_output" },
  })

  const toolBlock = response.content.find((block) => block.type === "tool_use")
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Anthropic did not return a tool-use block for structured output")
  }

  return JSON.stringify(toolBlock.input)
}
