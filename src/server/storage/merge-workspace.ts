type Identifiable = { id: string }

type WorkspaceData = {
  nodes: Identifiable[]
  connections: Identifiable[]
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

  return {
    ...incoming,
    nodes: [...incoming.nodes, ...preservedNodes],
    connections: [...incoming.connections, ...preservedConns],
  }
}
