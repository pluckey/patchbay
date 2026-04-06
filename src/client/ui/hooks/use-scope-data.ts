'use client'

import { useMemo } from 'react'
import type { Cell, Connection, InputLegendEntry, WorkspaceNode } from '@/kernel/entities'
import { resolveCellInputs } from '@/kernel/transforms'

export type ScopeInput = {
  cellId: string
  title: string
  text: string
}

export type ScopeData = {
  inputs: ScopeInput[]
  inputLegend: InputLegendEntry[]
}

export function useScopeData(
  cellId: string | null,
  cells: Cell[],
  connections: Connection[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _nodes: WorkspaceNode[],
): ScopeData {
  return useMemo(() => {
    if (cellId === null) {
      return { inputs: [], inputLegend: [] }
    }

    const incomingConnections = connections.filter((c) => c.targetId === cellId)
    const cellMap = new Map(cells.map((c) => [c.id, c]))

    const resolvedInputs = resolveCellInputs(cellId, cells, connections)

    const inputs: ScopeInput[] = []
    const inputLegend: InputLegendEntry[] = []

    for (const connection of incomingConnections) {
      const sourceCell = cellMap.get(connection.sourceId)
      if (!sourceCell) continue

      const resolved = resolvedInputs[connection.label]
      if (resolved === undefined) continue

      inputs.push({
        cellId: sourceCell.id,
        title: sourceCell.title,
        text: resolved.text,
      })

      inputLegend.push({
        label: connection.label,
        sourceName: sourceCell.title,
        sourceType: sourceCell.type,
      })
    }

    return { inputs, inputLegend }
  }, [cellId, cells, connections])
}
