import { nanoid } from "nanoid"
import type { Position, ChatNodeData } from "../entities"

export function createChatNode(
  position: Position,
  provider: string = "anthropic",
  model: string = "claude-sonnet-4-20250514"
): ChatNodeData {
  const now = Date.now()
  return {
    id: nanoid(),
    type: "chat",
    messages: [],
    provider,
    model,
    position,
    dimensions: { width: 380, height: 500 },
    createdAt: now,
    updatedAt: now,
  }
}
