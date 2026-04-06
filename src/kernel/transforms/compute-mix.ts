import type { Cell, Connection } from "../entities"

export type MixEntry = {
  cellId: string
  title: string
  output: string
  order: number
}

/**
 * Computes the mix: the ordered list of terminal cells (cells with no outgoing
 * open connections) annotated with topological depth and their output text.
 *
 * Only open connections participate in signal flow. Latched connections are
 * ignored for both terminal detection and depth computation.
 *
 * Order is determined by topological depth — distance from a root cell (a cell
 * with no incoming open connections). Cells at the same depth retain their
 * relative order from the input array.
 */
export function computeMix(cells: Cell[], connections: Connection[]): MixEntry[] {
  const openConnections = connections.filter(c => c.gate === 'open')

  // Build adjacency sets for open connections
  const outgoing = new Map<string, Set<string>>() // cellId -> set of target cell ids
  const incoming = new Map<string, Set<string>>() // cellId -> set of source cell ids

  for (const cell of cells) {
    outgoing.set(cell.id, new Set())
    incoming.set(cell.id, new Set())
  }

  for (const conn of openConnections) {
    outgoing.get(conn.sourceId)?.add(conn.targetId)
    incoming.get(conn.targetId)?.add(conn.sourceId)
  }

  // Terminal cells: no outgoing open connections
  const terminalCells = cells.filter(cell => {
    const outs = outgoing.get(cell.id)
    return outs === undefined || outs.size === 0
  })

  if (terminalCells.length === 0) return []

  // Compute topological depth for all cells via BFS from roots
  // Root cells: no incoming open connections
  const depth = new Map<string, number>()
  const queue: string[] = []

  for (const cell of cells) {
    const ins = incoming.get(cell.id)
    if (ins === undefined || ins.size === 0) {
      depth.set(cell.id, 0)
      queue.push(cell.id)
    }
  }

  // BFS — propagate max depth forward
  let head = 0
  while (head < queue.length) {
    const currentId = queue[head++]
    const currentDepth = depth.get(currentId) ?? 0
    const targets = outgoing.get(currentId)
    if (targets) {
      for (const targetId of targets) {
        const existing = depth.get(targetId)
        const candidate = currentDepth + 1
        if (existing === undefined || candidate > existing) {
          depth.set(targetId, candidate)
          queue.push(targetId)
        }
      }
    }
  }

  // Build MixEntry for each terminal cell, preserving input order for ties
  const entries: MixEntry[] = terminalCells.map((cell, index) => {
    const cellDepth = depth.get(cell.id) ?? 0
    const out = cell.output
    const outputText =
      out && out.status === 'success' ? out.text : ''

    return {
      cellId: cell.id,
      title: cell.title,
      output: outputText,
      order: cellDepth,
    }
  })

  // Sort by depth (ascending), stable relative to input order
  entries.sort((a, b) => a.order - b.order)

  return entries
}
