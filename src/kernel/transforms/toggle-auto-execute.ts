import type { WorkspaceNode } from "../entities"

export function toggleAutoExecute(
  nodes: WorkspaceNode[],
  nodeId: string
): WorkspaceNode[] {
  return nodes.map((node) =>
    node.id === nodeId && node.type === "ai-transform"
      ? { ...node, autoExecute: !node.autoExecute, updatedAt: Date.now() }
      : node
  )
}
