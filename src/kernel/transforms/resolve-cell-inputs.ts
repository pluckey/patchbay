import type { Cell, CellOutput, Connection } from "../entities"

/**
 * Resolves the inputs for a given cell by tracing incoming connections.
 *
 * For each connection targeting cellId, finds the source cell's output
 * (checking the outputs accumulator map first, then cell.output), and
 * includes only 'success' outputs. Keys are source cell titles.
 *
 * Returns an empty object if the cell has no incoming connections or
 * none of the sources have successful outputs.
 */
export function resolveCellInputs(
  cellId: string,
  cells: Cell[],
  connections: Connection[],
  outputs?: Map<string, CellOutput>
): Record<string, string> {
  const result: Record<string, string> = {}

  const incomingConnections = connections.filter((c) => c.targetId === cellId)
  if (incomingConnections.length === 0) return result

  const cellMap = new Map(cells.map((c) => [c.id, c]))

  for (const connection of incomingConnections) {
    const sourceCell = cellMap.get(connection.sourceId)
    if (!sourceCell) continue

    const output = outputs?.get(connection.sourceId) ?? sourceCell.output
    if (!output || output.status !== "success") continue

    result[sourceCell.title] = output.text
  }

  return result
}
