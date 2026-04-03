import { nanoid } from "nanoid"
import type { Position, WorkspaceNode } from "../entities"

export function createNode(
  position: Position,
  content: string = ""
): WorkspaceNode {
  const now = Date.now()
  return {
    id: nanoid(),
    content,
    position,
    createdAt: now,
    updatedAt: now,
  }
}
