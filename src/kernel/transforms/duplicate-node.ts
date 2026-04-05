import { nanoid } from "nanoid"
import type { WorkspaceNode } from "../entities"

export function duplicateNode(node: WorkspaceNode): WorkspaceNode {
  const now = Date.now()
  const base = {
    ...node,
    id: nanoid(),
    position: { x: node.position.x + 40, y: node.position.y + 40 },
    createdAt: now,
    updatedAt: now,
  }

  switch (base.type) {
    case "ai-transform":
      return { ...base, result: undefined }
    case "chat":
      return { ...base, messages: [] }
    default:
      return base
  }
}
