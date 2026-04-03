import type { WorkspaceNode } from "../entities"

export function removeNode(
  nodes: WorkspaceNode[],
  nodeId: string
): WorkspaceNode[] {
  return nodes.filter((node) => node.id !== nodeId)
}
