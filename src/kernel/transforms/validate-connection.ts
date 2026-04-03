import type { Connection } from "../entities/connection"
import type { WorkspaceNode } from "../entities/workspace-node"

type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string }

export function validateConnection(
  connections: Connection[],
  nodes: WorkspaceNode[],
  sourceId: string,
  targetId: string
): ValidationResult {
  if (sourceId === targetId) {
    return { valid: false, reason: "Cannot connect a node to itself." }
  }

  // Transform nodes can have an incoming connection; content nodes with
  // an existing incoming are blocked (v1: one incoming per content node)
  const targetNode = nodes.find((n) => n.id === targetId)
  if (targetNode && targetNode.type !== "transform") {
    if (connections.some((c) => c.targetId === targetId)) {
      return { valid: false, reason: "This node already has an incoming connection." }
    }
  }

  // Cycle detection via BFS from targetId following outgoing edges
  const visited = new Set<string>()
  const queue = [targetId]
  while (queue.length > 0) {
    const current = queue.shift()!
    if (current === sourceId) {
      return { valid: false, reason: "This connection would create a cycle." }
    }
    if (visited.has(current)) continue
    visited.add(current)
    for (const c of connections) {
      if (c.sourceId === current) {
        queue.push(c.targetId)
      }
    }
  }

  return { valid: true }
}
