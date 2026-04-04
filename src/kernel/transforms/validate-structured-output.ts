import type { SchemaField } from "../entities/schema-field"

type SingleResult = { ok: true; data: Record<string, unknown> }
type CollectionResult = { ok: true; data: Record<string, unknown>[] }
type ErrorResult = { ok: false; message: string }

export type ValidationResult = SingleResult | CollectionResult | ErrorResult

function validateObject(
  obj: unknown,
  schema: SchemaField[],
  label: string
): ErrorResult | null {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return { ok: false, message: `${label} is not a JSON object.` }
  }

  const record = obj as Record<string, unknown>

  for (const field of schema) {
    if (!(field.name in record)) {
      return { ok: false, message: `${label}: missing field "${field.name}".` }
    }

    const value = record[field.name]
    const actual = typeof value

    if (field.type === "boolean" && actual !== "boolean") {
      return { ok: false, message: `${label}: field "${field.name}" expected boolean, got ${actual}.` }
    }
    if (field.type === "number" && actual !== "number") {
      return { ok: false, message: `${label}: field "${field.name}" expected number, got ${actual}.` }
    }
    if (field.type === "string" && actual !== "string") {
      return { ok: false, message: `${label}: field "${field.name}" expected string, got ${actual}.` }
    }
    if (field.type.endsWith("[]")) {
      if (!Array.isArray(value)) {
        return { ok: false, message: `${label}: field "${field.name}" expected array, got ${actual}.` }
      }
      const itemType = field.type.slice(0, -2)
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] !== itemType) {
          return { ok: false, message: `${label}: field "${field.name}[${i}]" expected ${itemType}, got ${typeof value[i]}.` }
        }
      }
    }
  }

  return null
}

export function validateStructuredOutput(
  raw: string,
  schema: SchemaField[],
  mode: "single" | "collection" = "single"
): ValidationResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, message: "Response is not valid JSON." }
  }

  if (mode === "collection") {
    if (!Array.isArray(parsed)) {
      return { ok: false, message: "Response is not a JSON array." }
    }

    if (parsed.length === 0) {
      return { ok: true, data: [] }
    }

    for (let i = 0; i < parsed.length; i++) {
      const error = validateObject(parsed[i], schema, `Item ${i + 1}`)
      if (error) return error
    }

    return { ok: true, data: parsed as Record<string, unknown>[] }
  }

  // Single mode
  const error = validateObject(parsed, schema, "Response")
  if (error) return error

  return { ok: true, data: parsed as Record<string, unknown> }
}
