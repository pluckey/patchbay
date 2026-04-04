import type { Message } from "./chat"
import type { PdfAnnotation } from "./pdf-annotation"

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
  zoomLevel: number
  darkMode: boolean
  annotations: PdfAnnotation[]
}

export type TransformNodeData = BaseNode & {
  type: "transform"
  transformCode: string
  timeoutMs: number
}

export type ChatNodeData = BaseNode & {
  type: "chat"
  messages: Message[]
  provider: string
  model: string
}

export type WorkspaceNode = MarkdownNodeData | PdfNodeData | TransformNodeData | ChatNodeData
