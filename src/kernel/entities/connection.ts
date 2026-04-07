export type Connection = {
  id: string
  sourceId: string
  targetId: string
  label: string
  createdAt: number
  gate: 'open' | 'latched' // default 'open' — latched connections block signal flow
  /**
   * Opaque attachment-point identifiers for the source and target ends of the
   * connection. Plain strings — the kernel makes no assumptions about which
   * port ids exist; the canvas adapter owns that vocabulary and translates to
   * its own framework-specific names at the boundary. Absent fields fall back
   * to the adapter's default attachment point.
   */
  sourcePort?: string
  targetPort?: string
}

export type TransformResult =
  | { status: "success"; output: string; durationMs: number }
  | { status: "error"; message: string; durationMs: number; timedOut?: boolean }
  | { status: "running" }
