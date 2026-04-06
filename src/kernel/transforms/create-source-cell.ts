import { nanoid } from "nanoid"
import type { Position, SourceCellData } from "../entities"

export function createSourceCell(
  position: Position,
  content: string = '',
  title: string = 'Source'
): SourceCellData {
  const now = Date.now()
  return {
    id: nanoid(),
    type: 'source',
    title,
    content,
    position,
    createdAt: now,
    updatedAt: now,
    output: { status: 'success', text: content, durationMs: 0 },
  }
}
