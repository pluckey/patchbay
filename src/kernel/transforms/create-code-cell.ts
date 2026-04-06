import { nanoid } from "nanoid"
import type { Position, CodeCellData } from "../entities"

export function createCodeCell(
  position: Position,
  code: string = "",
  title: string = "Code"
): CodeCellData {
  const now = Date.now()
  return {
    id: nanoid(),
    type: "code",
    title,
    code,
    timeoutMs: 5000,
    position,
    createdAt: now,
    updatedAt: now,
    output: undefined,
  }
}
