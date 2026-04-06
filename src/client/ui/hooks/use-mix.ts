'use client'

import { useMemo } from 'react'
import type { Cell, Connection } from '@/kernel/entities'
import { computeMix } from '@/kernel/transforms'
import type { MixEntry } from '@/kernel/transforms'

export function useMix(cells: Cell[], connections: Connection[]): MixEntry[] {
  return useMemo(() => computeMix(cells, connections), [cells, connections])
}
