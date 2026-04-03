import type { WorkspaceNode } from "../entities"

export function updateTransformTimeout(
  nodes: WorkspaceNode[],
  nodeId: string,
  timeoutMs: number
): WorkspaceNode[] {
  return nodes.map((node) =>
    node.id === nodeId && node.type === "transform"
      ? { ...node, timeoutMs, updatedAt: Date.now() }
      : node
  )
}
