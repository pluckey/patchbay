'use client'

import { useMemo } from 'react'
import type { Cell, Connection, InputLegendEntry } from '@/kernel/entities'
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
  connections: Connection[]
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

      const text = resolvedInputs[sourceCell.title]
      if (text === undefined) continue

      inputs.push({
        cellId: sourceCell.id,
        title: sourceCell.title,
        text,
      })

      inputLegend.push({
        label: sourceCell.title,
        sourceName: sourceCell.title,
        sourceType: sourceCell.type,
      })
    }

    return { inputs, inputLegend }
  }, [cellId, cells, connections])
}
