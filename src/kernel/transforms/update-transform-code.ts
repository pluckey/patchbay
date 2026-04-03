import type { WorkspaceNode } from "../entities"

export function updateTransformCode(
  nodes: WorkspaceNode[],
  nodeId: string,
  code: string
): WorkspaceNode[] {
  return nodes.map((node) =>
    node.id === nodeId && node.type === "transform"
      ? { ...node, transformCode: code, updatedAt: Date.now() }
      : node
  )
}
