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

  // Cell-aware validation: targeted cross-type allow + source-cell target rejection
  if (cells && cells.length > 0) {
    const sourceCell = cells.find((c) => c.id === sourceId)
    const targetCell = cells.find((c) => c.id === targetId)
    const sourceNode = nodes.find((n) => n.id === sourceId)
    const targetNodeForCellRules = nodes.find((n) => n.id === targetId)

    // Reject cell → legacy node (reverse direction stays blocked)
    if (sourceCell && targetNodeForCellRules) {
      return { valid: false, reason: "Cells cannot feed into legacy nodes." }
    }

    // Legacy node → cell: only pdf|markdown → code|ai is permitted
    if (sourceNode && targetCell) {
      const sourceKindOk = sourceNode.type === "pdf" || sourceNode.type === "markdown"
      const targetKindOk = targetCell.type === "code" || targetCell.type === "ai"
      if (!sourceKindOk) {
        return { valid: false, reason: "Only PDF and markdown nodes can feed into cells." }
      }
      if (!targetKindOk) {
        return { valid: false, reason: "Only code and AI cells can receive input from legacy nodes." }
      }
    }

    // Reject connections targeting a source cell (cell→source-cell or node→source-cell)
    if (targetCell && targetCell.type === "source") {
      return { valid: false, reason: "Source cells cannot receive input." }
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
