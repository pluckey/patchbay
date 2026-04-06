import type { Position, Dimensions } from "./workspace-node"
import type { SchemaField } from "./schema-field"

export type CellOutput =
  | { status: 'success'; text: string; durationMs: number }
  | { status: 'error'; error: string; durationMs: number }
  | { status: 'running' }

export type BaseCell = {
  id: string
  title: string
  position: Position
  dimensions?: Dimensions
  createdAt: number
  updatedAt: number
  output?: CellOutput
  lastInputHash?: string
}

export type SourceCellData = BaseCell & {
  type: 'source'
  content: string
}

export type AiCellData = BaseCell & {
  type: 'ai'
  instruction: string
  provider: string
  model: string
  outputMode: 'text' | 'structured'
  schemaMode: 'single' | 'collection'
  schema: SchemaField[]
}

export type CodeCellData = BaseCell & {
  type: 'code'
  code: string
  timeoutMs: number
}

export type Cell = SourceCellData | AiCellData | CodeCellData
