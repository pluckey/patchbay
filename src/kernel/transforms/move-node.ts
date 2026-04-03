import type { Position, WorkspaceNode } from "../entities"

export function moveNode(
  nodes: WorkspaceNode[],
  nodeId: string,
  position: Position
): WorkspaceNode[] {
  return nodes.map((node) =>
    node.id === nodeId
      ? { ...node, position, updatedAt: Date.now() }
      : node
  )
}
