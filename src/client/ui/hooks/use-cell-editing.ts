'use client'

import { useCallback, useMemo } from 'react'
import type { Cell, WorkspaceNode, SchemaField } from '@/kernel/entities'
import { updateCellTitle } from '@/kernel/transforms'

type UseCellEditingArgs = {
  setCells: React.Dispatch<React.SetStateAction<Cell[]>>
  nodesRef: React.MutableRefObject<WorkspaceNode[]>
  scheduleSave: (nodes: WorkspaceNode[]) => void
}

/**
 * Cell editing handlers: per-field updates that happen inside The Scope.
 *
 * Source content updates auto-set output (identity function). All other handlers
 * mutate a single cell field and bump updatedAt.
 */
export function useCellEditing({ setCells, nodesRef, scheduleSave }: UseCellEditingArgs) {
  const handleCellContentChange = useCallback(
    (cellId: string, content: string) => {
      setCells((prev) => {
        const updated = prev.map((cell) =>
          cell.id === cellId && cell.type === 'source'
            ? {
                ...cell,
                content,
                output: { status: 'success' as const, text: content, durationMs: 0 },
                updatedAt: Date.now(),
              }
            : cell
        )
        scheduleSave(nodesRef.current)
        return updated
      })
    },
    [setCells, nodesRef, scheduleSave]
  )

  const handleCellInstructionChange = useCallback(
    (cellId: string, instruction: string) => {
      setCells((prev) => {
        const updated = prev.map((cell) =>
          cell.id === cellId && cell.type === 'ai'
            ? { ...cell, instruction, updatedAt: Date.now() }
            : cell
        )
        scheduleSave(nodesRef.current)
        return updated
      })
    },
    [setCells, nodesRef, scheduleSave]
  )

  const handleCellCodeChange = useCallback(
    (cellId: string, code: string) => {
      setCells((prev) => {
        const updated = prev.map((cell) =>
          cell.id === cellId && cell.type === 'code'
            ? { ...cell, code, updatedAt: Date.now() }
            : cell
        )
        scheduleSave(nodesRef.current)
        return updated
      })
    },
    [setCells, nodesRef, scheduleSave]
  )

  const handleCellTitleChange = useCallback(
    (cellId: string, title: string) => {
      setCells((prev) => {
        const updated = updateCellTitle(prev, cellId, title)
        scheduleSave(nodesRef.current)
        return updated
      })
    },
    [setCells, nodesRef, scheduleSave]
  )

  const handleCellModelChange = useCallback(
    (cellId: string, provider: string, model: string) => {
      setCells((prev) => {
        const updated = prev.map((cell) =>
          cell.id === cellId && cell.type === 'ai'
            ? { ...cell, provider, model, updatedAt: Date.now() }
            : cell
        )
        scheduleSave(nodesRef.current)
        return updated
      })
    },
    [setCells, nodesRef, scheduleSave]
  )

  const handleCellTimeoutChange = useCallback(
    (cellId: string, timeoutMs: number) => {
      setCells((prev) => {
        const updated = prev.map((cell) =>
          cell.id === cellId && cell.type === 'code'
            ? { ...cell, timeoutMs, updatedAt: Date.now() }
            : cell
        )
        scheduleSave(nodesRef.current)
        return updated
      })
    },
    [setCells, nodesRef, scheduleSave]
  )

  const handleCellOutputModeChange = useCallback(
    (cellId: string, mode: 'text' | 'structured') => {
      setCells((prev) => {
        const updated = prev.map((cell) =>
          cell.id === cellId && cell.type === 'ai'
            ? { ...cell, outputMode: mode, updatedAt: Date.now() }
            : cell
        )
        scheduleSave(nodesRef.current)
        return updated
      })
    },
    [setCells, nodesRef, scheduleSave]
  )

  const handleCellSchemaChange = useCallback(
    (cellId: string, schema: SchemaField[]) => {
      setCells((prev) => {
        const updated = prev.map((cell) =>
          cell.id === cellId && cell.type === 'ai'
            ? { ...cell, schema, updatedAt: Date.now() }
            : cell
        )
        scheduleSave(nodesRef.current)
        return updated
      })
    },
    [setCells, nodesRef, scheduleSave]
  )

  const handleCellSchemaModeChange = useCallback(
    (cellId: string, mode: 'single' | 'collection') => {
      setCells((prev) => {
        const updated = prev.map((cell) =>
          cell.id === cellId && cell.type === 'ai'
            ? { ...cell, schemaMode: mode, updatedAt: Date.now() }
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
      handleCellContentChange,
      handleCellInstructionChange,
      handleCellCodeChange,
      handleCellTitleChange,
      handleCellModelChange,
      handleCellTimeoutChange,
      handleCellOutputModeChange,
      handleCellSchemaChange,
      handleCellSchemaModeChange,
    }),
    [
      handleCellContentChange,
      handleCellInstructionChange,
      handleCellCodeChange,
      handleCellTitleChange,
      handleCellModelChange,
      handleCellTimeoutChange,
      handleCellOutputModeChange,
      handleCellSchemaChange,
      handleCellSchemaModeChange,
    ]
  )
}
