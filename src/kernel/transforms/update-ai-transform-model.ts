import type { WorkspaceNode } from "../entities"

export function updateAiTransformModel(
  nodes: WorkspaceNode[],
  nodeId: string,
  provider: string,
  model: string
): WorkspaceNode[] {
  return nodes.map((node) =>
    node.id === nodeId && node.type === "ai-transform"
      ? { ...node, provider, model, updatedAt: Date.now() }
      : node
  )
}
