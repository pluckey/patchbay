import type { Cell } from "../entities"
import type { Connection } from "../entities"

/**
 * Returns cells that have no outgoing connections with gate === 'open'.
 * A cell is terminal if it either has no outgoing connections at all,
 * or all of its outgoing connections are latched (gate !== 'open').
 */
export function computeTerminalCells(cells: Cell[], connections: Connection[]): Cell[] {
  if (cells.length === 0) return []

  const openOutgoing = new Set<string>()
  for (const conn of connections) {
    if (conn.gate === 'open') {
      openOutgoing.add(conn.sourceId)
    }
  }

  return cells.filter(cell => !openOutgoing.has(cell.id))
}
