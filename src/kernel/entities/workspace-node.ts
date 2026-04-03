export type Position = {
  x: number
  y: number
}

export type Dimensions = {
  width: number
  height: number
}

type BaseNode = {
  id: string
  position: Position
  dimensions?: Dimensions
  createdAt: number
  updatedAt: number
}

export type MarkdownNodeData = BaseNode & {
  type: "markdown"
  content: string
}

export type PdfNodeData = BaseNode & {
  type: "pdf"
  blobId: string
  filename: string
  currentPage: number
  totalPages: number
}

export type TransformNodeData = BaseNode & {
  type: "transform"
  transformCode: string
}

export type WorkspaceNode = MarkdownNodeData | PdfNodeData | TransformNodeData
