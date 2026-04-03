import { nanoid } from "nanoid"
import type { Position, MarkdownNodeData } from "../entities"

export function createNode(
  position: Position,
  content: string = ""
): MarkdownNodeData {
  const now = Date.now()
  return {
    id: nanoid(),
    type: "markdown",
    content,
    position,
    createdAt: now,
    updatedAt: now,
  }
}
