import type { WorkspaceNode } from "../entities"

export function updateChatModel(
  nodes: WorkspaceNode[],
  nodeId: string,
  provider: string,
  model: string
): WorkspaceNode[] {
  return nodes.map((node) =>
    node.id === nodeId && node.type === "chat"
      ? { ...node, provider, model, updatedAt: Date.now() }
      : node
  )
}
