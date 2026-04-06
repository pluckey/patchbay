import type { Cell, Connection } from "../entities"

export type StalenessStatus = 'current' | 'stale' | 'error'

/**
 * Computes a deterministic hash of resolved inputs by JSON-stringifying
 * sorted key-value pairs.
 */
function hashInputs(inputs: Record<string, string>): string {
  const sorted = Object.keys(inputs)
    .sort()
    .map((key) => [key, inputs[key]] as [string, string])
  return JSON.stringify(sorted)
}

/**
 * Resolves the inputs for a cell inline by finding each upstream cell's
 * output text, keyed by the source cell's title.
 */
function resolveInputsInline(
  cellId: string,
  cellMap: Map<string, Cell>,
  incomingConnections: Connection[]
): Record<string, string> {
  const inputs: Record<string, string> = {}
  for (const conn of incomingConnections) {
    const sourceCell = cellMap.get(conn.sourceId)
    if (!sourceCell) continue
    const output = sourceCell.output
    const text = output && output.status === 'success' ? output.text : ''
    inputs[sourceCell.title] = text
  }
  return inputs
}

/**
 * Computes staleness status for each cell.
 *
 * Rules:
 * - 'error'   : cell.output.status === 'error'
 * - 'stale'   : no output, or inputs hash differs from lastInputHash, or upstream is stale/error
 * - 'current' : source cell (no incoming connections) with output present, or
 *               connected cell whose inputs hash matches lastInputHash and all upstream is current
 */
export function computeStaleness(
  cells: Cell[],
  connections: Connection[]
): Map<string, StalenessStatus> {
  const cellMap = new Map<string, Cell>(cells.map((c) => [c.id, c]))

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

    // Connected cell: resolve inputs and compare hash
    const inputs = resolveInputsInline(cell.id, cellMap, incoming)
    const hash = hashInputs(inputs)

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
