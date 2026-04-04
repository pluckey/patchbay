import type { SchemaField } from "@/kernel/entities"

export function schemaFieldsToJsonSchema(fields: SchemaField[]): Record<string, unknown> {
  const properties: Record<string, { type: string }> = {}
  const required: string[] = []

  for (const field of fields) {
    properties[field.name] = { type: field.type }
    required.push(field.name)
  }

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  }
}
