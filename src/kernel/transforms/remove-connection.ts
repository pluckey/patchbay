import type { Connection } from "../entities/connection"

export function removeConnection(
  connections: Connection[],
  connectionId: string
): Connection[] {
  return connections.filter((c) => c.id !== connectionId)
}
