import { nanoid } from "nanoid"
import type { Position, AiCellData } from "../entities"

export function createAiCell(
  position: Position,
  instruction: string = "",
  title: string = "AI"
): AiCellData {
  const now = Date.now()
  return {
    id: nanoid(),
    type: "ai",
    title,
    position,
    instruction,
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    outputMode: "text",
    schemaMode: "single",
    schema: [],
    createdAt: now,
    updatedAt: now,
    output: undefined,
  }
}
