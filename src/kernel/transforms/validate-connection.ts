import type { Connection } from "../entities/connection"
import type { WorkspaceNode } from "../entities/workspace-node"
import type { Cell } from "../entities/cell"

type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string }

export function validateConnection(
  connections: Connection[],
  nodes: WorkspaceNode[],
  sourceId: string,
  targetId: string,
  cells?: Cell[]
): ValidationResult {
  if (sourceId === targetId) {
    return { valid: false, reason: "Cannot connect a node to itself." }
  }

  // Cell-aware validation: reject cross-type connections and source-cell targets
  if (cells && cells.length > 0) {
    const sourceIsCell = cells.some((c) => c.id === sourceId)
    const targetIsCell = cells.some((c) => c.id === targetId)
    const sourceIsNode = nodes.some((n) => n.id === sourceId)
    const targetIsNode = nodes.some((n) => n.id === targetId)

    // Reject Cell↔WorkspaceNode cross-type connections
    if ((sourceIsCell && targetIsNode) || (sourceIsNode && targetIsCell)) {
      return { valid: false, reason: "Cannot connect cells to legacy nodes." }
    }

    // Reject connections targeting a source cell
    if (targetIsCell) {
      const targetCell = cells.find((c) => c.id === targetId)
      if (targetCell && targetCell.type === "source") {
        return { valid: false, reason: "Source cells cannot receive input." }
      }
    }
  }

  // Transform nodes can have an incoming connection; content nodes with
  // an existing incoming are blocked (v1: one incoming per content node)
  const targetNode = nodes.find((n) => n.id === targetId)
  if (targetNode && targetNode.type !== "transform" && targetNode.type !== "ai-transform") {
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
