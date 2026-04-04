import type { Node, Edge } from "@xyflow/react"
import type { Position, WorkspaceNode, Connection, TransformResult, Message, InputLegendEntry, ModelRosterEntry, SchemaField, PdfAnnotation, PdfRegion } from "@/kernel/entities"

export type MarkdownFlowNodeData = {
  nodeId: string
  content: string
  onContentChange: (nodeId: string, content: string) => void
  onDelete: (nodeId: string) => void
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
  schema: SchemaField[]
  roster: ModelRosterEntry[]
  inputLegend: InputLegendEntry[]
  result?: TransformResult
  onInstructionChange: (nodeId: string, instruction: string) => void
  onModelChange: (nodeId: string, provider: string, model: string) => void
  onInputModeChange: (nodeId: string, inputMode: "concat" | "named") => void
  onAutoExecuteToggle: (nodeId: string) => void
  onOutputModeChange: (nodeId: string, mode: "text" | "structured") => void
  onSchemaChange: (nodeId: string, schema: SchemaField[]) => void
  onExecute: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onResizeEnd: (nodeId: string, dimensions: { width: number; height: number }) => void
}

export type FlowNodeData = MarkdownFlowNodeData | PdfFlowNodeData | TransformFlowNodeData | ChatFlowNodeData | AiTransformFlowNodeData

type FlowCallbacks = {
  onContentChange: (nodeId: string, content: string) => void
  onDelete: (nodeId: string) => void
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
            schema: node.schema,
            roster: roster ?? [],
            inputLegend: aiInputLegend,
            result: node.result,
            onInstructionChange: callbacks.onAiInstructionChange,
            onModelChange: callbacks.onAiModelChange,
            onInputModeChange: callbacks.onAiInputModeChange,
            onAutoExecuteToggle: callbacks.onAiAutoExecuteToggle,
            onOutputModeChange: callbacks.onAiOutputModeChange,
            onSchemaChange: callbacks.onAiSchemaChange,
            onExecute: callbacks.onAiExecute,
            onDelete: callbacks.onDelete,
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
