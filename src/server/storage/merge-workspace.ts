type Identifiable = { id: string }

type WorkspaceData = {
  nodes: Identifiable[]
  connections: Identifiable[]
  cells?: Identifiable[]
  [key: string]: unknown
}

/**
 * Merge two workspace states. Preserves items from `disk` that are absent
 * from `incoming`, unless they appear in `deletedIds`.
 *
 * Returns a new object — no mutation.
 */
export function mergeWorkspace(
  incoming: WorkspaceData,
  disk: WorkspaceData,
  deletedIds: string[] = []
): WorkspaceData {
  const incomingNodeIds = new Set(incoming.nodes.map((n) => n.id))
  const incomingConnIds = new Set(incoming.connections.map((c) => c.id))
  const deletedSet = new Set(deletedIds)

  const preservedNodes = disk.nodes.filter(
    (n) => !incomingNodeIds.has(n.id) && !deletedSet.has(n.id)
  )
  const preservedConns = disk.connections.filter(
    (c) => !incomingConnIds.has(c.id) && !deletedSet.has(c.id)
  )

  // Merge cells: if incoming has no cells array (legacy client), preserve all
  // disk cells unchanged. Otherwise apply the same preserve-absent logic.
  let mergedCells: Identifiable[] | undefined
  const diskCells = disk.cells ?? []
  if (incoming.cells === undefined) {
    mergedCells = diskCells.length > 0 ? diskCells : undefined
  } else {
    const incomingCellIds = new Set(incoming.cells.map((c) => c.id))
    const preservedCells = diskCells.filter(
      (c) => !incomingCellIds.has(c.id) && !deletedSet.has(c.id)
    )
    mergedCells = [...incoming.cells, ...preservedCells]
  }

  const result: WorkspaceData = {
    ...incoming,
    nodes: [...incoming.nodes, ...preservedNodes],
    connections: [...incoming.connections, ...preservedConns],
  }

  if (mergedCells !== undefined) {
    result.cells = mergedCells
  }

  return result
}
