import type { WorkspaceNode } from "../entities"

export function updateNodeContent(
  nodes: WorkspaceNode[],
  nodeId: string,
  content: string
): WorkspaceNode[] {
  return nodes.map((node) =>
    node.id === nodeId && node.type === "markdown"
      ? { ...node, content, updatedAt: Date.now() }
      : node
  )
}
