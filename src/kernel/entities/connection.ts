export type Connection = {
  id: string
  sourceId: string
  targetId: string
  createdAt: number
}

export type TransformResult =
  | { status: "success"; output: string }
  | { status: "error"; message: string }
