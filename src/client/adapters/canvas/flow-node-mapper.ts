import type { Node, Edge } from "@xyflow/react"
import type { Position, WorkspaceNode, Connection, TransformResult, Message, InputLegendEntry, ModelRosterEntry, SchemaField, PdfAnnotation, PdfRegion, Cell, CellOutput, AiCellData } from "@/kernel/entities"
import type { StalenessStatus } from "@/kernel/transforms"

export type MarkdownFlowNodeData = {
  nodeId: string
  content: string
  onContentChange: (nodeId: string, content: string) => void
  onDelete: (nodeId: string) => void
  onDuplicate: (nodeId: string) => void
  onResizeEnd: (nodeId: string, dimensions: { width: number; height: number }) => void
}

export type PdfFlowNodeData = {
  nodeId: string
  blobId: string
  filename: string
  currentPage: number
  totalPages: number
  zoomLevel: number
  darkMode: boolean
  annotations: PdfAnnotation[]
  onNavigatePage: (nodeId: string, page: number) => void
  onZoomChange: (nodeId: string, zoomLevel: number) => void
  onDarkModeToggle: (nodeId: string) => void
  onAnnotationCreate: (nodeId: string, page: number, region: PdfRegion, label: string, text: string) => void
  onAnnotationDelete: (nodeId: string, annotationId: string) => void
  onAnnotationEdit: (nodeId: string, annotationId: string, label: string, region?: PdfRegion) => void
  onDelete: (nodeId: string) => void
  onDuplicate: (nodeId: string) => void
  onResizeEnd: (nodeId: string, dimensions: { width: number; height: number }) => void
}

export type { InputLegendEntry } from "@/kernel/entities"

export type TransformFlowNodeData = {
  nodeId: string
  transformCode: string
  timeoutMs: number
  transformResult?: TransformResult
  inputLegend: InputLegendEntry[]
  onTransformCodeChange: (nodeId: string, code: string) => void
  onTimeoutChange: (nodeId: string, timeoutMs: number) => void
  onRerun: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onDuplicate: (nodeId: string) => void
  onResizeEnd: (nodeId: string, dimensions: { width: number; height: number }) => void
}

export type ChatFlowNodeData = {
  nodeId: string
  messages: Message[]
  provider: string
  model: string
  roster: ModelRosterEntry[]
  systemPrompt?: string
  isStreaming?: boolean
  onSendMessage: (nodeId: string, content: string, systemPrompt: string) => void
  onResetChat: (nodeId: string) => void
  onModelChange: (nodeId: string, provider: string, model: string) => void
  onDelete: (nodeId: string) => void
  onDuplicate: (nodeId: string) => void
  onResizeEnd: (nodeId: string, dimensions: { width: number; height: number }) => void
}

export type AiTransformFlowNodeData = {
  nodeId: string
  instruction: string
  provider: string
  model: string
  autoExecute: boolean
  inputMode: "concat" | "named"
  outputMode: "text" | "structured"
  schemaMode: "single" | "collection"
  schema: SchemaField[]
  roster: ModelRosterEntry[]
  inputLegend: InputLegendEntry[]
  inputPreview: Record<string, string>
  result?: TransformResult
  onInstructionChange: (nodeId: string, instruction: string) => void
  onModelChange: (nodeId: string, provider: string, model: string) => void
  onInputModeChange: (nodeId: string, inputMode: "concat" | "named") => void
  onAutoExecuteToggle: (nodeId: string) => void
  onOutputModeChange: (nodeId: string, mode: "text" | "structured") => void
  onSchemaChange: (nodeId: string, schema: SchemaField[]) => void
  onSchemaModeChange: (nodeId: string, schemaMode: "single" | "collection") => void
  onExecute: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onDuplicate: (nodeId: string) => void
  onResizeEnd: (nodeId: string, dimensions: { width: number; height: number }) => void
}

export type FlowNodeData = MarkdownFlowNodeData | PdfFlowNodeData | TransformFlowNodeData | ChatFlowNodeData | AiTransformFlowNodeData

type FlowCallbacks = {
  onContentChange: (nodeId: string, content: string) => void
  onDelete: (nodeId: string) => void
  onDuplicate: (nodeId: string) => void
  onResizeEnd: (nodeId: string, dimensions: { width: number; height: number }) => void
  onNavigatePage: (nodeId: string, page: number) => void
  onZoomChange: (nodeId: string, zoomLevel: number) => void
  onDarkModeToggle: (nodeId: string) => void
  onTransformCodeChange: (nodeId: string, code: string) => void
  onTimeoutChange: (nodeId: string, timeoutMs: number) => void
  onRerun: (nodeId: string) => void
  onSendMessage: (nodeId: string, content: string, systemPrompt: string) => void
  onResetChat: (nodeId: string) => void
  onModelChange: (nodeId: string, provider: string, model: string) => void
  onAnnotationCreate: (nodeId: string, page: number, region: PdfRegion, label: string, text: string) => void
  onAnnotationDelete: (nodeId: string, annotationId: string) => void
  onAnnotationEdit: (nodeId: string, annotationId: string, label: string, region?: PdfRegion) => void
  onAiInstructionChange: (nodeId: string, instruction: string) => void
  onAiModelChange: (nodeId: string, provider: string, model: string) => void
  onAiInputModeChange: (nodeId: string, inputMode: "concat" | "named") => void
  onAiAutoExecuteToggle: (nodeId: string) => void
  onAiOutputModeChange: (nodeId: string, mode: "text" | "structured") => void
  onAiSchemaChange: (nodeId: string, schema: SchemaField[]) => void
  onAiSchemaModeChange: (nodeId: string, schemaMode: "single" | "collection") => void
  onAiExecute: (nodeId: string) => void
}

export function toFlowNodes(
  nodes: WorkspaceNode[],
  connections: Connection[],
  callbacks: FlowCallbacks,
  pipelineResults?: Map<string, TransformResult>,
  chatSystemPrompts?: Map<string, string>,
  streamingNodeIds?: Set<string>,
  roster?: ModelRosterEntry[]
): Node[] {
  return nodes.map((node) => {
    const base = {
      id: node.id,
      position: node.position,
      ...(node.dimensions && {
        width: node.dimensions.width,
        height: node.dimensions.height,
      }),
    }

    switch (node.type) {
      case "markdown": {
        const data: MarkdownFlowNodeData = {
          nodeId: node.id,
          content: node.content,
          onContentChange: callbacks.onContentChange,
          onDelete: callbacks.onDelete,
          onDuplicate: callbacks.onDuplicate,
          onResizeEnd: callbacks.onResizeEnd,
        }
        return { ...base, type: "markdownNode", data }
      }
      case "pdf":
        return {
          ...base,
          type: "pdfNode",
          data: {
            nodeId: node.id,
            blobId: node.blobId,
            filename: node.filename,
            currentPage: node.currentPage,
            totalPages: node.totalPages,
            zoomLevel: node.zoomLevel,
            darkMode: node.darkMode,
            annotations: node.annotations,
            onNavigatePage: callbacks.onNavigatePage,
            onZoomChange: callbacks.onZoomChange,
            onDarkModeToggle: callbacks.onDarkModeToggle,
            onAnnotationCreate: callbacks.onAnnotationCreate,
            onAnnotationDelete: callbacks.onAnnotationDelete,
            onAnnotationEdit: callbacks.onAnnotationEdit,
            onDelete: callbacks.onDelete,
            onDuplicate: callbacks.onDuplicate,
            onResizeEnd: callbacks.onResizeEnd,
          } satisfies PdfFlowNodeData,
        }
      case "transform": {
        // Build input legend from all incoming connections
        const incomingConns = connections.filter((c) => c.targetId === node.id)
        const inputLegend: InputLegendEntry[] = incomingConns.map((c) => {
          const src = nodes.find((n) => n.id === c.sourceId)
          const sourceName = src?.type === "pdf" ? src.filename
            : src?.type === "markdown" ? extractMarkdownName(src.content)
            : src?.type ?? "unknown"
          return { label: c.label, sourceName, sourceType: src?.type ?? "unknown" }
        })

        // Get this transform's own result
        const transformResult = pipelineResults?.get(node.id)

        return {
          ...base,
          type: "transformNode",
          data: {
            nodeId: node.id,
            transformCode: node.transformCode,
            timeoutMs: node.timeoutMs,
            transformResult,
            inputLegend,
            onTransformCodeChange: callbacks.onTransformCodeChange,
            onTimeoutChange: callbacks.onTimeoutChange,
            onRerun: callbacks.onRerun,
            onDelete: callbacks.onDelete,
            onDuplicate: callbacks.onDuplicate,
            onResizeEnd: callbacks.onResizeEnd,
          } satisfies TransformFlowNodeData,
        }
      }
      case "chat": {
        const systemPrompt = chatSystemPrompts?.get(node.id)

        return {
          ...base,
          type: "chatNode",
          data: {
            nodeId: node.id,
            messages: node.messages,
            provider: node.provider,
            model: node.model,
            roster: roster ?? [],
            systemPrompt,
            isStreaming: streamingNodeIds?.has(node.id),
            onSendMessage: callbacks.onSendMessage,
            onResetChat: callbacks.onResetChat,
            onModelChange: callbacks.onModelChange,
            onDelete: callbacks.onDelete,
            onDuplicate: callbacks.onDuplicate,
            onResizeEnd: callbacks.onResizeEnd,
          } satisfies ChatFlowNodeData,
        }
      }
      case "ai-transform": {
        const aiIncomingConns = connections.filter((c) => c.targetId === node.id)
        const aiInputLegend: InputLegendEntry[] = aiIncomingConns.map((c) => {
          const src = nodes.find((n) => n.id === c.sourceId)
          const sourceName = src?.type === "pdf" ? src.filename
            : src?.type === "markdown" ? extractMarkdownName(src.content)
            : src?.type ?? "unknown"
          return { label: c.label, sourceName, sourceType: src?.type ?? "unknown" }
        })

        const aiInputPreview: Record<string, string> = {}
        for (const c of aiIncomingConns) {
          const src = nodes.find((n) => n.id === c.sourceId)
          if (!src) continue
          if (src.type === "markdown") aiInputPreview[c.label] = src.content
          else if (src.type === "transform") {
            const r = pipelineResults?.get(src.id)
            aiInputPreview[c.label] = r?.status === "success" ? r.output : ""
          }
          else if (src.type === "ai-transform" && src.result?.status === "success") aiInputPreview[c.label] = src.result.output
          else if (src.type === "pdf") aiInputPreview[c.label] = `[PDF: ${src.filename}, page ${src.currentPage}/${src.totalPages}]`
        }

        return {
          ...base,
          type: "aiTransformNode",
          data: {
            nodeId: node.id,
            instruction: node.instruction,
            provider: node.provider,
            model: node.model,
            autoExecute: node.autoExecute,
            inputMode: node.inputMode,
            outputMode: node.outputMode,
            schemaMode: node.schemaMode,
            schema: node.schema,
            roster: roster ?? [],
            inputLegend: aiInputLegend,
            inputPreview: aiInputPreview,
            result: node.result,
            onInstructionChange: callbacks.onAiInstructionChange,
            onModelChange: callbacks.onAiModelChange,
            onInputModeChange: callbacks.onAiInputModeChange,
            onAutoExecuteToggle: callbacks.onAiAutoExecuteToggle,
            onOutputModeChange: callbacks.onAiOutputModeChange,
            onSchemaChange: callbacks.onAiSchemaChange,
            onSchemaModeChange: callbacks.onAiSchemaModeChange,
            onExecute: callbacks.onAiExecute,
            onDelete: callbacks.onDelete,
            onDuplicate: callbacks.onDuplicate,
            onResizeEnd: callbacks.onResizeEnd,
          } satisfies AiTransformFlowNodeData,
        }
      }
    }
  })
}

type EdgeCallbacks = {
  onLabelChange: (connectionId: string, label: string) => void
}

export function toFlowEdges(connections: Connection[], edgeCallbacks: EdgeCallbacks): Edge[] {
  return connections.map((conn) => ({
    id: conn.id,
    source: conn.sourceId,
    target: conn.targetId,
    // Translate kernel attachment-point ids to xyflow's required Edge API.
    // The kernel uses sourcePort/targetPort (domain vocabulary); xyflow's Edge
    // requires sourceHandle/targetHandle. This is the single write-direction
    // translation point in the canvas adapter.
    sourceHandle: conn.sourcePort,
    targetHandle: conn.targetPort,
    type: "labeledEdge",
    animated: true,
    selectable: true,
    interactionWidth: 20,
    data: {
      label: conn.label,
      onLabelChange: edgeCallbacks.onLabelChange,
    },
  }))
}

export function fromNodeDragStop(node: {
  id: string
  position?: { x: number; y: number }
}): { nodeId: string; position: Position } {
  return {
    nodeId: node.id,
    position: node.position ?? { x: 0, y: 0 },
  }
}

function extractMarkdownName(content: string): string {
  const headingMatch = content.match(/^#+\s+(.+)$/m)
  if (headingMatch) return headingMatch[1].trim().substring(0, 30)
  const firstLine = content.trim().substring(0, 25)
  return firstLine || "Untitled"
}

export type CellCardCallbacks = {
  onOpenScope: (cellId: string) => void
  onTrigger: (cellId: string) => void
  onDelete: (cellId: string) => void
  onDuplicate: (cellId: string) => void
  onResizeEnd: (cellId: string, dimensions: { width: number; height: number }) => void
}

export type CellFlowNodeData = {
  cellId: string
  cellType: Cell['type']
  title: string
  output?: CellOutput
  health?: StalenessStatus
  hasInput: boolean
  /** Source code for code cells — surfaced so the canvas card shows what the cell does. */
  code?: string
  /** Instruction prompt for ai cells — surfaced so the canvas card shows what the cell asks. */
  instruction?: string
  /** AI cell output mode — when "structured", the card parses output.text as JSON and renders via StructuredOutputDisplay. */
  outputMode?: AiCellData['outputMode']
  /** AI cell schema mode — "single" object vs "collection" array. */
  schemaMode?: AiCellData['schemaMode']
  /** AI cell schema — drives StructuredOutputDisplay rendering on the card. */
  schema?: SchemaField[]
  callbacks: CellCardCallbacks
}

export function cellsToFlowNodes(
  cells: Cell[],
  connections: Connection[],
  callbacks: CellCardCallbacks,
  healthMap?: Map<string, StalenessStatus>
): Node<CellFlowNodeData>[] {
  return cells.map((cell) => {
    const data: CellFlowNodeData = {
      cellId: cell.id,
      cellType: cell.type,
      title: cell.title,
      output: cell.output,
      health: healthMap?.get(cell.id),
      hasInput: cell.type !== 'source',
      code: cell.type === 'code' ? cell.code : undefined,
      instruction: cell.type === 'ai' ? cell.instruction : undefined,
      outputMode: cell.type === 'ai' ? cell.outputMode : undefined,
      schemaMode: cell.type === 'ai' ? cell.schemaMode : undefined,
      schema: cell.type === 'ai' ? cell.schema : undefined,
      callbacks,
    }

    return {
      id: cell.id,
      type: 'cellNode',
      position: cell.position,
      ...(cell.dimensions && {
        width: cell.dimensions.width,
        height: cell.dimensions.height,
      }),
      data,
    }
  })
}
