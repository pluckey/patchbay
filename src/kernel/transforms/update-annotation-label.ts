import type { WorkspaceNode } from "../entities"

export function updateAnnotationLabel(
  nodes: WorkspaceNode[],
  nodeId: string,
  annotationId: string,
  label: string
): WorkspaceNode[] {
  return nodes.map((node) =>
    node.id === nodeId && node.type === "pdf"
      ? {
          ...node,
          annotations: node.annotations.map((a) =>
            a.id === annotationId ? { ...a, label } : a
          ),
          updatedAt: Date.now(),
        }
      : node
  )
}
