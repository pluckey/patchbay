import type { Message } from "./chat"
import type { TransformResult } from "./connection"
import type { PdfAnnotation } from "./pdf-annotation"
import type { SchemaField } from "./schema-field"

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

export type AiTransformNodeData = BaseNode & {
  type: "ai-transform"
  instruction: string
  provider: string
  model: string
  autoExecute: boolean
  inputMode: "concat" | "named"
  outputMode: "text" | "structured"
  schemaMode: "single" | "collection"
  schema: SchemaField[]
  result?: TransformResult
}

export type WorkspaceNode = MarkdownNodeData | PdfNodeData | TransformNodeData | ChatNodeData | AiTransformNodeData
