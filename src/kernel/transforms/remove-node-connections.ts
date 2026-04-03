import type { Connection } from "../entities/connection"

export function removeNodeConnections(
  connections: Connection[],
  nodeId: string
): Connection[] {
  return connections.filter(
    (c) => c.sourceId !== nodeId && c.targetId !== nodeId
  )
}
