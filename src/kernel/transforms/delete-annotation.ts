import type { WorkspaceNode } from "../entities"

export function deleteAnnotation(
  nodes: WorkspaceNode[],
  nodeId: string,
  annotationId: string
): WorkspaceNode[] {
  return nodes.map((node) =>
    node.id === nodeId && node.type === "pdf"
      ? { ...node, annotations: node.annotations.filter((a) => a.id !== annotationId), updatedAt: Date.now() }
      : node
  )
}
