'use client'

import { useMemo } from 'react'
import type { Cell, Connection, InputLegendEntry, WorkspaceNode } from '@/kernel/entities'

const PREVIEW_LENGTH = 400

export type ScopeInputKind = 'cell' | 'markdown' | 'pdf'

export type ScopeInput = {
  cellId: string // source identifier (cell or node id)
  title: string
  text: string
  kind: ScopeInputKind
}

export type ScopeData = {
  inputs: ScopeInput[]
  inputLegend: InputLegendEntry[]
}

function clip(text: string): string {
  if (text.length <= PREVIEW_LENGTH) return text
  return text.slice(0, PREVIEW_LENGTH) + '…'
}

export function useScopeData(
  cellId: string | null,
  cells: Cell[],
  connections: Connection[],
  nodes: WorkspaceNode[],
): ScopeData {
  return useMemo(() => {
    if (cellId === null) {
      return { inputs: [], inputLegend: [] }
    }

    const incomingConnections = connections.filter((c) => c.targetId === cellId)
    const cellMap = new Map(cells.map((c) => [c.id, c]))
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    const inputs: ScopeInput[] = []
    const inputLegend: InputLegendEntry[] = []

    for (const connection of incomingConnections) {
      const sourceCell = cellMap.get(connection.sourceId)
      if (sourceCell) {
        const out = sourceCell.output
        const text = out && out.status === 'success' ? clip(out.text) : ''
        inputs.push({
          cellId: sourceCell.id,
          title: sourceCell.title,
          text,
          kind: 'cell',
        })
        inputLegend.push({
          label: connection.label,
          sourceName: sourceCell.title,
          sourceType: 'derived',
        })
        continue
      }

      const sourceNode = nodeMap.get(connection.sourceId)
      if (sourceNode) {
        if (sourceNode.type === 'markdown') {
          inputs.push({
            cellId: sourceNode.id,
            title: connection.label,
            text: clip(sourceNode.content),
            kind: 'markdown',
          })
          inputLegend.push({
            label: connection.label,
            sourceName: connection.label,
            sourceType: 'markdown',
          })
        } else if (sourceNode.type === 'pdf') {
          const annotationCount = sourceNode.annotations.length
          const summary =
            `${sourceNode.filename} · ${sourceNode.totalPages} pages` +
            (annotationCount > 0 ? ` · ${annotationCount} annotations` : '')
          inputs.push({
            cellId: sourceNode.id,
            title: sourceNode.filename,
            text: summary,
            kind: 'pdf',
          })
          inputLegend.push({
            label: connection.label,
            sourceName: sourceNode.filename,
            sourceType: 'pdf',
          })
        }
        // Other legacy node kinds are not valid sources for cells per
        // validateConnection, so we ignore them here.
      }
    }

    return { inputs, inputLegend }
  }, [cellId, cells, connections, nodes])
}
