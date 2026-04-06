import type { Cell } from '../entities/cell'
import type { Connection } from '../entities/connection'

export type ExecutionStep = {
  cellId: string
}

/**
 * BFS downstream from triggeredCellId, following outgoing open connections.
 * Source cells are excluded from the schedule.
 * Latched connections do not propagate signal.
 */
export function buildExecutionSchedule(
  triggeredCellId: string,
  cells: Cell[],
  connections: Connection[],
): ExecutionStep[] {
  const cellIndex = new Map<string, Cell>(cells.map((c) => [c.id, c]))

  const schedule: ExecutionStep[] = []
  const visited = new Set<string>()
  const queue: string[] = [triggeredCellId]
  visited.add(triggeredCellId)

  while (queue.length > 0) {
    const currentId = queue.shift()!

    // Exclude source cells from the schedule output (but still traverse from them)
    const cell = cellIndex.get(currentId)
    if (cell && cell.type !== 'source') {
      schedule.push({ cellId: currentId })
    }

    // Find outgoing open connections from currentId
    for (const conn of connections) {
      if (conn.sourceId === currentId && conn.gate === 'open') {
        if (!visited.has(conn.targetId)) {
          visited.add(conn.targetId)
          queue.push(conn.targetId)
        }
      }
    }
  }

  return schedule
}
