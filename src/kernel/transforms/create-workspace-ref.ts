import { nanoid } from "nanoid"
import type { WorkspaceRef } from "../entities/workspace-ref"

export function createWorkspaceRef(name: string): WorkspaceRef {
  const now = Date.now()
  return {
    id: nanoid(),
    name,
    createdAt: now,
    updatedAt: now,
  }
}
