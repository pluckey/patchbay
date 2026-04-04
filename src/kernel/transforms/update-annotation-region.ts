import type { WorkspaceNode, PdfRegion } from "../entities"

export function updateAnnotationRegion(
  nodes: WorkspaceNode[],
  nodeId: string,
  annotationId: string,
  region: PdfRegion
): WorkspaceNode[] {
  return nodes.map((node) =>
    node.id === nodeId && node.type === "pdf"
      ? {
          ...node,
          annotations: node.annotations.map((a) =>
            a.id === annotationId ? { ...a, region } : a
          ),
          updatedAt: Date.now(),
        }
      : node
  )
}
