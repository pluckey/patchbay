import { nanoid } from "nanoid"
import type { Workspace } from "../entities/workspace"

export function createDefaultWorkspace(): Workspace {
  return {
    id: nanoid(),
    name: "Untitled",
    nodes: [],
    connections: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  }
}
