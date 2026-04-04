import type { WorkspaceNode } from "../entities"

export function updateAiInputMode(
  nodes: WorkspaceNode[],
  nodeId: string,
  inputMode: "concat" | "named"
): WorkspaceNode[] {
  return nodes.map((node) =>
    node.id === nodeId && node.type === "ai-transform"
      ? { ...node, inputMode, updatedAt: Date.now() }
      : node
  )
}
