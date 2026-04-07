import { nanoid } from "nanoid"
import type { Connection } from "../entities/connection"
import type { WorkspaceNode } from "../entities/workspace-node"
import type { Cell } from "../entities/cell"

export type CreateConnectionGraph = {
  nodes: WorkspaceNode[]
  existingConnections: Connection[]
  cells?: Cell[]
}

export type CreateConnectionOptions = {
  sourcePort?: string
  targetPort?: string
}

export function createConnection(
  sourceId: string,
  targetId: string,
  graph: CreateConnectionGraph,
  options: CreateConnectionOptions = {},
): Connection {
  const sourceNode = graph.nodes.find((n) => n.id === sourceId)
  const sourceCell = graph.cells?.find((c) => c.id === sourceId)
  const label = generateLabel(sourceNode, graph.existingConnections, sourceCell)

  return {
    id: nanoid(),
    sourceId,
    targetId,
    label,
    createdAt: Date.now(),
    gate: 'open' as const,
    ...(options.sourcePort ? { sourcePort: options.sourcePort } : {}),
    ...(options.targetPort ? { targetPort: options.targetPort } : {}),
  }
}

function generateLabel(
  sourceNode: WorkspaceNode | undefined,
  existingConnections: Connection[],
  sourceCell?: Cell
): string {
  let base: string
  if (sourceCell) {
    base = sourceCell.type
  } else if (!sourceNode) {
    base = "input"
  } else {
    switch (sourceNode.type) {
      case "markdown":
        base = "markdown"
        break
      case "pdf":
        base = sourceNode.filename.replace(/\.pdf$/i, "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase() || "pdf"
        break
      case "transform":
        base = "transform"
        break
      case "chat":
        base = "chat"
        break
      case "ai-transform":
        base = "ai_transform"
        break
      default:
        base = "input"
    }
  }

  // Find highest existing suffix for this base to avoid collisions
  const existingLabels = existingConnections.map((c) => c.label)
  if (!existingLabels.includes(base)) return base

  let maxSuffix = 1
  const pattern = new RegExp(`^${base}_(\\d+)$`)
  for (const label of existingLabels) {
    const match = label.match(pattern)
    if (match) {
      maxSuffix = Math.max(maxSuffix, parseInt(match[1], 10))
    }
  }
  return `${base}_${maxSuffix + 1}`
}
