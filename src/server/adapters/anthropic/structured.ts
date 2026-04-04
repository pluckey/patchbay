import Anthropic from "@anthropic-ai/sdk"
import type { SchemaField } from "@/kernel/entities"
import { schemaFieldsToJsonSchema } from "../schema-to-json-schema"

const client = new Anthropic()

type StructuredParams = {
  messages: { role: "user" | "assistant"; content: string }[]
  systemPrompt: string
  model: string
  schema: SchemaField[]
  schemaMode: "single" | "collection"
}

export async function generateStructured(params: StructuredParams): Promise<string> {
  const isCollection = params.schemaMode === "collection"

  // Anthropic tool-use requires input_schema.type to be "object".
  // For collection mode, wrap the array inside an object with an "items" property,
  // then unwrap after the response.
  const objectSchema = schemaFieldsToJsonSchema(params.schema, "single")
  const inputSchema = isCollection
    ? { type: "object", properties: { items: { type: "array", items: objectSchema } }, required: ["items"], additionalProperties: false }
    : objectSchema

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
        description: isCollection
          ? "Return structured output as an array of objects matching the schema. Put the array in the 'items' field."
          : "Return structured output matching the schema",
        input_schema: inputSchema as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool" as const, name: "structured_output" },
  })

  const toolBlock = response.content.find((block) => block.type === "tool_use")
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Anthropic did not return a tool-use block for structured output")
  }

  // Unwrap the collection wrapper
  if (isCollection) {
    const wrapper = toolBlock.input as Record<string, unknown>
    return JSON.stringify(wrapper.items)
  }

  return JSON.stringify(toolBlock.input)
}
