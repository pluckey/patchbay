import type { SchemaField } from "../entities/schema-field"

type ValidationResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; message: string }

export function validateStructuredOutput(
  raw: string,
  schema: SchemaField[]
): ValidationResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, message: "Response is not valid JSON." }
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, message: "Response is not a JSON object." }
  }

  const obj = parsed as Record<string, unknown>

  for (const field of schema) {
    if (!(field.name in obj)) {
      return { ok: false, message: `Missing field: "${field.name}".` }
    }

    const value = obj[field.name]
    const actual = typeof value

    if (field.type === "boolean" && actual !== "boolean") {
      return { ok: false, message: `Field "${field.name}" expected boolean, got ${actual}.` }
    }
    if (field.type === "number" && actual !== "number") {
      return { ok: false, message: `Field "${field.name}" expected number, got ${actual}.` }
    }
    if (field.type === "string" && actual !== "string") {
      return { ok: false, message: `Field "${field.name}" expected string, got ${actual}.` }
    }
  }

  return { ok: true, data: obj }
}
