import type { WorkspaceNode } from "../entities"

export function togglePdfDarkMode(
  nodes: WorkspaceNode[],
  nodeId: string
): WorkspaceNode[] {
  return nodes.map((node) => {
    if (node.id !== nodeId || node.type !== "pdf") return node
    return { ...node, darkMode: !node.darkMode, updatedAt: Date.now() }
  })
}
