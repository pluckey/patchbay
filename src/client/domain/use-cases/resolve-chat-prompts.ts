import type { WorkspaceNode, Connection, TransformResult } from "@/kernel/entities"

/**
 * Resolves system prompts for all chat nodes by walking the connection graph.
 * Returns a map of chat node IDs to their resolved system prompt text.
 */
export function resolveChatSystemPrompts(
  nodes: WorkspaceNode[],
  connections: Connection[],
  pipelineResults: Map<string, TransformResult>
): Map<string, string> {
  const prompts = new Map<string, string>()

  for (const node of nodes) {
    if (node.type !== "chat") continue

    // Check if the chat node itself is a pipeline target (transform → chat)
    const selfResult = pipelineResults.get(node.id)
    if (selfResult?.status === "success") {
      prompts.set(node.id, selfResult.output)
      continue
    }

    // Otherwise check the source of the incoming connection
    const incomingConn = connections.find((c) => c.targetId === node.id)
    if (!incomingConn) continue

    const sourceNode = nodes.find((n) => n.id === incomingConn.sourceId)
    if (!sourceNode) continue

    const sourceDerived = pipelineResults.get(sourceNode.id)
    if (sourceDerived?.status === "success") {
      prompts.set(node.id, sourceDerived.output)
    } else if (sourceNode.type === "markdown") {
      prompts.set(node.id, sourceNode.content)
    }
  }

  return prompts
}
