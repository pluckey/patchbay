import type { WorkspaceNode } from "./workspace-node"
import type { Connection } from "./connection"

export type Viewport = {
  x: number
  y: number
  zoom: number
}

export type Workspace = {
  id: string
  name: string
  nodes: WorkspaceNode[]
  connections: Connection[]
  viewport: Viewport
}
