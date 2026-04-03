export type Connection = {
  id: string
  sourceId: string
  targetId: string
  createdAt: number
}

export type TransformResult =
  | { status: "success"; output: string; durationMs: number }
  | { status: "error"; message: string; durationMs: number; timedOut?: boolean }
  | { status: "running" }
