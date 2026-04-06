'use client'

import { useCallback } from "react"
import type { Cell, Connection, WorkspaceNode } from "@/kernel/entities"
import { executeCascade } from "@/client/domain/use-cases/execute-cascade"
import { useAdapters } from "@/client/ui/app/adapters-context"

interface UseCascadeParams {
  cells: Cell[]
  connections: Connection[]
  setCells: (cells: Cell[]) => void
  cellsRef: React.RefObject<Cell[]>
  nodesRef: React.RefObject<WorkspaceNode[]>
  scheduleSave: (nodes: WorkspaceNode[], connections?: Connection[], cells?: Cell[]) => void
}

interface UseCascadeResult {
  triggerCell: (cellId: string) => Promise<void>
}

export function useCascade({
  cells,
  connections,
  setCells,
  cellsRef,
  nodesRef,
  scheduleSave,
}: UseCascadeParams): UseCascadeResult {
  const { aiExecutor, transformExecutor, blobStorage, pdfRenderer } = useAdapters()

  const triggerCell = useCallback(
    async (cellId: string) => {
      const { updatedCells } = await executeCascade(
        cellId,
        cellsRef.current,
        connections,
        nodesRef.current,
        { aiExecutor, transformExecutor, blobStorage, pdfRenderer },
      )
      setCells(updatedCells)
      // CRITICAL: always pass nodesRef.current — never an empty array
      scheduleSave(nodesRef.current, undefined, updatedCells)
    },
    [cellsRef, connections, aiExecutor, transformExecutor, blobStorage, pdfRenderer, setCells, nodesRef, scheduleSave],
  )

  return { triggerCell }
}
