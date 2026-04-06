'use client'

import { useCallback, useMemo } from 'react'
import { nanoid } from 'nanoid'
import type { Cell, Connection, WorkspaceNode, ModelRosterEntry, Position, Dimensions } from '@/kernel/entities'
import { createSourceCell, createAiCell, createCodeCell } from '@/kernel/transforms'

type UseCellLifecycleArgs = {
  setCells: React.Dispatch<React.SetStateAction<Cell[]>>
  nodesRef: React.MutableRefObject<WorkspaceNode[]>
  connectionsRef: React.MutableRefObject<Connection[]>
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>
  scheduleSave: (nodes: WorkspaceNode[], connections?: Connection[]) => void
  trackDeletion: (id: string) => void
  roster: ModelRosterEntry[]
}

/**
 * Cell lifecycle handlers: create, delete, duplicate, move, resize.
 *
 * Splits cleanly from `useCellEditing`: lifecycle changes are driven by canvas
 * interactions (toolbar buttons, card hover actions, drag), while editing
 * changes happen inside The Scope. Keeping them separate means a Scope re-render
 * doesn't invalidate canvas card callbacks and vice versa.
 */
export function useCellLifecycle({
  setCells,
  nodesRef,
  connectionsRef,
  setConnections,
  scheduleSave,
  trackDeletion,
  roster,
}: UseCellLifecycleArgs) {
  const handleAddSourceCell = useCallback(
    (position: Position) => {
      setCells((prev) => {
        const cell = createSourceCell(position)
        const updated = [...prev, cell]
        scheduleSave(nodesRef.current)
        return updated
      })
    },
    [setCells, nodesRef, scheduleSave]
  )

  const handleAddAiCell = useCallback(
    (position: Position) => {
      setCells((prev) => {
        const defaultModel = roster[0]
        const cell = createAiCell(position)
        const cellWithModel = defaultModel
          ? { ...cell, provider: defaultModel.provider, model: defaultModel.model }
          : cell
        const updated = [...prev, cellWithModel]
        scheduleSave(nodesRef.current)
        return updated
      })
    },
    [setCells, nodesRef, scheduleSave, roster]
  )

  const handleAddCodeCell = useCallback(
    (position: Position) => {
      setCells((prev) => {
        const cell = createCodeCell(position)
        const updated = [...prev, cell]
        scheduleSave(nodesRef.current)
        return updated
      })
    },
    [setCells, nodesRef, scheduleSave]
  )

  const handleCellDelete = useCallback(
    (cellId: string) => {
      setCells((prev) => {
        const updated = prev.filter((cell) => cell.id !== cellId)
        const orphanedConnections = connectionsRef.current.filter(
          (c) => c.sourceId === cellId || c.targetId === cellId
        )
        for (const c of orphanedConnections) {
          trackDeletion(c.id)
        }
        const updatedConnections = connectionsRef.current.filter(
          (c) => c.sourceId !== cellId && c.targetId !== cellId
        )
        setConnections(updatedConnections)
        trackDeletion(cellId)
        scheduleSave(nodesRef.current, updatedConnections)
        return updated
      })
    },
    [setCells, setConnections, connectionsRef, nodesRef, scheduleSave, trackDeletion]
  )

  const handleCellDuplicate = useCallback(
    (cellId: string) => {
      setCells((prev) => {
        const cell = prev.find((c) => c.id === cellId)
        if (!cell) return prev
        const now = Date.now()
        const copy: Cell = {
          ...cell,
          id: nanoid(),
          position: { x: cell.position.x + 40, y: cell.position.y + 40 },
          createdAt: now,
          updatedAt: now,
          output: undefined,
        } as Cell
        const updated = [...prev, copy]
        scheduleSave(nodesRef.current)
        return updated
      })
    },
    [setCells, nodesRef, scheduleSave]
  )

  const handleCellMove = useCallback(
    (cellId: string, position: Position) => {
      setCells((prev) => {
        const updated = prev.map((cell) =>
          cell.id === cellId
            ? { ...cell, position, updatedAt: Date.now() }
            : cell
        )
        scheduleSave(nodesRef.current)
        return updated
      })
    },
    [setCells, nodesRef, scheduleSave]
  )

  const handleCellResize = useCallback(
    (cellId: string, dimensions: Dimensions) => {
      setCells((prev) => {
        const updated = prev.map((cell) =>
          cell.id === cellId
            ? { ...cell, dimensions, updatedAt: Date.now() }
            : cell
        )
        scheduleSave(nodesRef.current)
        return updated
      })
    },
    [setCells, nodesRef, scheduleSave]
  )

  return useMemo(
    () => ({
      handleAddSourceCell,
      handleAddAiCell,
      handleAddCodeCell,
      handleCellDelete,
      handleCellDuplicate,
      handleCellMove,
      handleCellResize,
    }),
    [
      handleAddSourceCell,
      handleAddAiCell,
      handleAddCodeCell,
      handleCellDelete,
      handleCellDuplicate,
      handleCellMove,
      handleCellResize,
    ]
  )
}
