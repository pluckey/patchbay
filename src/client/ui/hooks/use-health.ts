'use client'

import { useMemo } from 'react'
import type { Cell, Connection } from '@/kernel/entities'
import { computeStaleness } from '@/kernel/transforms'
import type { StalenessStatus } from '@/kernel/transforms'

export function useHealth(
  cells: Cell[],
  connections: Connection[]
): Map<string, StalenessStatus> {
  return useMemo(
    () => computeStaleness(cells, connections),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cells, connections]
  )
}
