import type { WorkspaceNode } from "../entities"

export function updateAiInstruction(
  nodes: WorkspaceNode[],
  nodeId: string,
  instruction: string
): WorkspaceNode[] {
  return nodes.map((node) =>
    node.id === nodeId && node.type === "ai-transform"
      ? { ...node, instruction, updatedAt: Date.now() }
      : node
  )
}
