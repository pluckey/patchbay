type PromptResult =
  | { systemPrompt: string; userMessage: string }
  | { error: string }

export function resolveAiTransformPrompt(
  instruction: string,
  inputs: Record<string, string>,
  inputMode: "concat" | "named"
): PromptResult {
  if (inputMode === "named") {
    const missing: string[] = []
    const resolved = instruction.replace(/\{\{(\w+)\}\}/g, (_match, label: string) => {
      if (label in inputs) return inputs[label]
      missing.push(label)
      return `[missing: ${label}]`
    })

    if (missing.length > 0) {
      return { error: `Unresolved input references: ${missing.join(", ")}` }
    }

    return { systemPrompt: resolved, userMessage: buildConcatMessage(inputs) }
  }

  // concat mode
  return {
    systemPrompt: instruction,
    userMessage: buildConcatMessage(inputs),
  }
}

function buildConcatMessage(inputs: Record<string, string>): string {
  const entries = Object.entries(inputs)
  if (entries.length === 0) return ""
  if (entries.length === 1) return entries[0][1]
  return entries.map(([label, content]) => `--- ${label} ---\n${content}`).join("\n\n")
}
