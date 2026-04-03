import { nanoid } from "nanoid"
import type { Connection } from "../entities/connection"

export function createConnection(
  sourceId: string,
  targetId: string
): Connection {
  return {
    id: nanoid(),
    sourceId,
    targetId,
    createdAt: Date.now(),
  }
}
