import type { Cell, Connection, WorkspaceNode } from "../entities"
import { hashCellInputs } from "./hash-cell-inputs.ts"

export type StalenessStatus = 'current' | 'stale' | 'error'

/**
 * Computes staleness status for each cell.
 *
 * Rules:
 * - 'error'   : cell.output.status === 'error'
 * - 'stale'   : no output, or inputs hash differs from lastInputHash, or upstream is stale/error
 * - 'current' : source cell (no incoming connections) with output present, or
 *               connected cell whose inputs hash matches lastInputHash and all upstream is current
 *
 * The inputs hash is computed by the shared `hashCellInputs` transform, which
 * also runs in the cascade orchestrator. Both must use the same hash function
 * or staleness drifts and cells appear permanently stale.
 *
 * `nodes` is needed because cell inputs may now come from legacy WorkspaceNodes
 * (PdfNode, MarkdownNode) via cross-type connections — the hash includes their
 * source state.
 */
export function computeStaleness(
  cells: Cell[],
  connections: Connection[],
  nodes: WorkspaceNode[] = [],
): Map<string, StalenessStatus> {
  // Build map: cellId → incoming connections
  const incomingMap = new Map<string, Connection[]>()
  for (const cell of cells) {
    incomingMap.set(cell.id, [])
  }
  for (const conn of connections) {
    const existing = incomingMap.get(conn.targetId)
    if (existing) {
      existing.push(conn)
    }
  }

  // Build map: cellId → outgoing target ids (for downstream propagation)
  const downstreamMap = new Map<string, string[]>()
  for (const cell of cells) {
    downstreamMap.set(cell.id, [])
  }
  for (const conn of connections) {
    const existing = downstreamMap.get(conn.sourceId)
    if (existing) {
      existing.push(conn.targetId)
    }
  }

  const result = new Map<string, StalenessStatus>()

  // First pass: compute status for each cell ignoring propagation
  for (const cell of cells) {
    const incoming = incomingMap.get(cell.id) ?? []

    if (cell.output && cell.output.status === 'error') {
      result.set(cell.id, 'error')
      continue
    }

    if (!cell.output) {
      result.set(cell.id, 'stale')
      continue
    }

    if (incoming.length === 0) {
      // Source cell with output — current
      result.set(cell.id, 'current')
      continue
    }

    // Connected cell: hash inputs and compare to lastInputHash
    const hash = hashCellInputs(cell.id, cells, connections, nodes)

    if (cell.lastInputHash === undefined || cell.lastInputHash !== hash) {
      result.set(cell.id, 'stale')
    } else {
      result.set(cell.id, 'current')
    }
  }

  // Second pass: propagate staleness downstream (BFS/DFS)
  // Any cell that is stale/error should mark all downstream cells as stale
  const visited = new Set<string>()

  function propagate(cellId: string): void {
    if (visited.has(cellId)) return
    visited.add(cellId)
    const downstream = downstreamMap.get(cellId) ?? []
    for (const targetId of downstream) {
      const current = result.get(targetId)
      if (current !== 'error') {
        result.set(targetId, 'stale')
      }
      propagate(targetId)
    }
  }

  for (const cell of cells) {
    const status = result.get(cell.id)
    if (status === 'stale' || status === 'error') {
      propagate(cell.id)
    }
  }

  return result
}
