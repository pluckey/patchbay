import type { WorkspaceNode } from "../entities"

export function updatePdfZoom(
  nodes: WorkspaceNode[],
  nodeId: string,
  zoomLevel: number
): WorkspaceNode[] {
  return nodes.map((node) => {
    if (node.id !== nodeId || node.type !== "pdf") return node
    const clamped = Math.min(Math.max(zoomLevel, 0.25), 4.0)
    return { ...node, zoomLevel: clamped, updatedAt: Date.now() }
  })
}
