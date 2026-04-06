import type { Cell } from "../entities"

export function updateCellTitle(cells: Cell[], cellId: string, title: string): Cell[] {
  return cells.map((cell) =>
    cell.id === cellId ? { ...cell, title, updatedAt: Date.now() } : cell
  )
}
