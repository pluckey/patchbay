'use client'

import { useCallback } from "react"
import { flushSync } from "react-dom"
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
  const { aiExecutor, cellExecutor, blobStorage } = useAdapters()

  const triggerCell = useCallback(
    async (cellId: string) => {
      const { updatedCells } = await executeCascade(
        cellId,
        cellsRef.current,
        connections,
        nodesRef.current,
        { aiExecutor, cellExecutor, blobStorage },
        // Stream cell outputs as each schedule step completes — a fast Code
        // cell's result appears immediately rather than waiting for a slow
        // downstream AI cell. flushSync forces React to commit the partial
        // state to the DOM before the cascade's next `await` (React 18+
        // automatic batching otherwise defers the render until the entire
        // async function completes, defeating the streaming).
        (partialCells) => {
          flushSync(() => {
            setCells(partialCells)
          })
        },
      )
      setCells(updatedCells)
      // CRITICAL: always pass nodesRef.current — never an empty array
      scheduleSave(nodesRef.current, undefined, updatedCells)
    },
    [cellsRef, connections, aiExecutor, cellExecutor, blobStorage, setCells, nodesRef, scheduleSave],
  )

  return { triggerCell }
}
