import type { WorkspaceNode } from "../entities"

export function updateOutputMode(
  nodes: WorkspaceNode[],
  nodeId: string,
  mode: "text" | "structured"
): WorkspaceNode[] {
  return nodes.map((n) =>
    n.id === nodeId && n.type === "ai-transform"
      ? { ...n, outputMode: mode, result: undefined, updatedAt: Date.now() }
      : n
  )
}
