export type SchemaFieldType = "string" | "number" | "boolean" | "string[]" | "number[]" | "boolean[]"

export type SchemaField = {
  name: string
  type: SchemaFieldType
}
