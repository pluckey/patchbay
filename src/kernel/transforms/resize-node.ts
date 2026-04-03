import type { Dimensions, WorkspaceNode } from "../entities"

export function resizeNode(
  nodes: WorkspaceNode[],
  nodeId: string,
  dimensions: Dimensions
): WorkspaceNode[] {
  return nodes.map((node) =>
    node.id === nodeId
      ? { ...node, dimensions, updatedAt: Date.now() }
      : node
  )
}
