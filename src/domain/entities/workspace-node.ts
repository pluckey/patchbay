export type Position = {
  x: number
  y: number
}

export type WorkspaceNode = {
  id: string
  content: string
  position: Position
  createdAt: number
  updatedAt: number
}
