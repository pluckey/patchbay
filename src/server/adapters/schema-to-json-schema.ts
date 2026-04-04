import type { SchemaField } from "@/kernel/entities"

export function schemaFieldsToJsonSchema(
  fields: SchemaField[],
  mode: "single" | "collection" = "single"
): Record<string, unknown> {
  const properties: Record<string, Record<string, unknown>> = {}
  const required: string[] = []

  for (const field of fields) {
    if (field.type.endsWith("[]")) {
      const itemType = field.type.slice(0, -2)
      properties[field.name] = { type: "array", items: { type: itemType } }
    } else {
      properties[field.name] = { type: field.type }
    }
    required.push(field.name)
  }

  const objectSchema = {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  }

  if (mode === "collection") {
    return {
      type: "array",
      items: objectSchema,
    }
  }

  return objectSchema
}
