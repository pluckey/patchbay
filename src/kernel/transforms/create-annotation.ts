import { nanoid } from "nanoid"
import type { WorkspaceNode, PdfAnnotation, PdfRegion } from "../entities"

export function createAnnotation(
  nodes: WorkspaceNode[],
  nodeId: string,
  page: number,
  region: PdfRegion,
  label: string,
  text: string
): WorkspaceNode[] {
  const annotation: PdfAnnotation = { id: nanoid(), page, region, label, text }
  return nodes.map((node) =>
    node.id === nodeId && node.type === "pdf"
      ? { ...node, annotations: [...node.annotations, annotation], updatedAt: Date.now() }
      : node
  )
}
