import type { WorkspaceNode } from "./workspace-node"

export type Viewport = {
  x: number
  y: number
  zoom: number
}

export type Workspace = {
  nodes: WorkspaceNode[]
  viewport: Viewport
}

export const DEFAULT_WORKSPACE: Workspace = {
  nodes: [],
  viewport: { x: 0, y: 0, zoom: 1 },
}
