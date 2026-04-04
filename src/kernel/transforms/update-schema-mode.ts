import type { WorkspaceNode } from "../entities"

export function updateSchemaMode(
  nodes: WorkspaceNode[],
  nodeId: string,
  schemaMode: "single" | "collection"
): WorkspaceNode[] {
  return nodes.map((n) =>
    n.id === nodeId && n.type === "ai-transform"
      ? { ...n, schemaMode, result: undefined, updatedAt: Date.now() }
      : n
  )
}
