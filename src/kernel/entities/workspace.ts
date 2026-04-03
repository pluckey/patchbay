import type { WorkspaceNode } from "./workspace-node"
import type { Connection } from "./connection"

export type Viewport = {
  x: number
  y: number
  zoom: number
}

export type Workspace = {
  nodes: WorkspaceNode[]
  connections: Connection[]
  viewport: Viewport
}

export const DEFAULT_WORKSPACE: Workspace = {
  nodes: [],
  connections: [],
  viewport: { x: 0, y: 0, zoom: 1 },
}
