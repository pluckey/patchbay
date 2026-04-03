import type { Connection } from "../entities/connection"

const VALID_LABEL = /^[a-zA-Z_][a-zA-Z0-9_]*$/
const RESERVED = new Set(["break", "case", "catch", "continue", "debugger", "default", "delete", "do", "else", "finally", "for", "function", "if", "in", "instanceof", "new", "return", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "class", "const", "enum", "export", "extends", "import", "super", "implements", "interface", "let", "package", "private", "protected", "public", "static", "yield", "input"])

export type LabelValidation =
  | { valid: true }
  | { valid: false; reason: string }

export function validateConnectionLabel(label: string): LabelValidation {
  if (!label) return { valid: false, reason: "Label cannot be empty." }
  if (!VALID_LABEL.test(label)) return { valid: false, reason: "Label must be a valid identifier (letters, numbers, underscores, cannot start with a number)." }
  if (RESERVED.has(label)) return { valid: false, reason: `"${label}" is a reserved word.` }
  return { valid: true }
}

export function updateConnectionLabel(
  connections: Connection[],
  connectionId: string,
  label: string
): Connection[] {
  return connections.map((c) =>
    c.id === connectionId ? { ...c, label } : c
  )
}
