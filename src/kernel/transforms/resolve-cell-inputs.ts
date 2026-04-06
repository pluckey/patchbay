import type { Cell, CellOutput, Connection, ResolvedInput, WorkspaceNode } from "../entities"

/**
 * Resolves the inputs for a given cell by walking incoming connections.
 *
 * For each connection targeting cellId:
 * - If the source is a cell: takes its output (from the `outputs` accumulator
 *   if present, else the cell's stored output), and wraps it as a
 *   `ResolvedDerivedInput { text, type: "derived" }`. Successful outputs only.
 * - If the source is a legacy WorkspaceNode: looks up the pre-resolved
 *   `ResolvedInput` in the `legacyOutputs` map. Pre-resolution happens in the
 *   use case (executeCascade) because it requires async blob/PDF I/O.
 * - Skips sources that aren't found or that haven't produced an output yet.
 *
 * All inputs are keyed by **connection label**. This is the unification with
 * the legacy pipeline's keying convention. Renaming a connection's label
 * changes the input key, which is the editable affordance authors expect.
 *
 * Returns an empty object if the cell has no incoming connections or none of
 * the sources have resolved outputs.
 */
export function resolveCellInputs(
  cellId: string,
  cells: Cell[],
  connections: Connection[],
  nodes: WorkspaceNode[] = [],
  outputs?: Map<string, CellOutput>,
  legacyOutputs?: Map<string, ResolvedInput>,
): Record<string, ResolvedInput> {
  const result: Record<string, ResolvedInput> = {}

  const incomingConnections = connections.filter((c) => c.targetId === cellId)
  if (incomingConnections.length === 0) return result

  const cellMap = new Map(cells.map((c) => [c.id, c]))
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  for (const connection of incomingConnections) {
    const sourceCell = cellMap.get(connection.sourceId)
    if (sourceCell) {
      const output = outputs?.get(connection.sourceId) ?? sourceCell.output
      if (!output || output.status !== "success") continue
      result[connection.label] = { text: output.text, type: "derived" as const }
      continue
    }

    const sourceNode = nodeMap.get(connection.sourceId)
    if (sourceNode) {
      const resolved = legacyOutputs?.get(connection.sourceId)
      if (!resolved) continue
      result[connection.label] = resolved
      continue
    }
  }

  return result
}
