'use client'

import { useMemo } from 'react'
import type { Cell, Connection, WorkspaceNode } from '@/kernel/entities'
import { computeStaleness } from '@/kernel/transforms'
import type { StalenessStatus } from '@/kernel/transforms'

export function useHealth(
  cells: Cell[],
  connections: Connection[],
  nodes: WorkspaceNode[],
): Map<string, StalenessStatus> {
  return useMemo(
    () => computeStaleness(cells, connections, nodes),
    [cells, connections, nodes]
  )
}
