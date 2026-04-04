import type { WorkspaceNode, SchemaField } from "../entities"

export function updateSchema(
  nodes: WorkspaceNode[],
  nodeId: string,
  schema: SchemaField[]
): WorkspaceNode[] {
  return nodes.map((n) =>
    n.id === nodeId && n.type === "ai-transform"
      ? { ...n, schema, result: undefined, updatedAt: Date.now() }
      : n
  )
}
