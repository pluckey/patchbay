import type { WorkspaceNode } from "../entities"

export function navigatePdfPage(
  nodes: WorkspaceNode[],
  nodeId: string,
  targetPage: number
): WorkspaceNode[] {
  return nodes.map((node) => {
    if (node.id !== nodeId || node.type !== "pdf") return node
    if (targetPage < 1 || targetPage > node.totalPages) return node
    return { ...node, currentPage: targetPage, updatedAt: Date.now() }
  })
}
