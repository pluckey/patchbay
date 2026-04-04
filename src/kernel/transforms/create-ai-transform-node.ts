import { nanoid } from "nanoid"
import type { Position, AiTransformNodeData } from "../entities"

export function createAiTransformNode(
  position: Position,
  provider: string = "anthropic",
  model: string = "claude-sonnet-4-20250514"
): AiTransformNodeData {
  const now = Date.now()
  return {
    id: nanoid(),
    type: "ai-transform",
    instruction: "",
    provider,
    model,
    autoExecute: false,
    inputMode: "concat",
    outputMode: "text",
    schemaMode: "single",
    schema: [],
    position,
    dimensions: { width: 380, height: 400 },
    createdAt: now,
    updatedAt: now,
  }
}
