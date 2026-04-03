import type { Node, Edge } from "@xyflow/react"
import type { Position, WorkspaceNode, Connection, TransformResult, Message } from "@/kernel/entities"

export type MarkdownFlowNodeData = {
  nodeId: string
  content: string
  isDerived?: boolean
  derivedContent?: string
  derivedError?: string
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
  onNavigatePage: (nodeId: string, page: number) => void
  onZoomChange: (nodeId: string, zoomLevel: number) => void
  onDarkModeToggle: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onResizeEnd: (nodeId: string, dimensions: { width: number; height: number }) => void
}

export type TransformFlowNodeData = {
  nodeId: string
  transformCode: string
  timeoutMs: number
  transformResult?: TransformResult
  sourceNodeType?: "markdown" | "pdf"
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
  systemPrompt?: string
  isStreaming?: boolean
  onSendMessage: (nodeId: string, content: string, systemPrompt: string) => void
  onDelete: (nodeId: string) => void
  onResizeEnd: (nodeId: string, dimensions: { width: number; height: number }) => void
}

export type FlowNodeData = MarkdownFlowNodeData | PdfFlowNodeData | TransformFlowNodeData | ChatFlowNodeData

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
}

export function toFlowNodes(
  nodes: WorkspaceNode[],
  connections: Connection[],
  callbacks: FlowCallbacks,
  pipelineResults?: Map<string, TransformResult>,
  chatSystemPrompts?: Map<string, string>
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
        const derived = pipelineResults?.get(node.id)
        const data: MarkdownFlowNodeData = {
          nodeId: node.id,
          content: node.content,
          onContentChange: callbacks.onContentChange,
          onDelete: callbacks.onDelete,
          onResizeEnd: callbacks.onResizeEnd,
        }
        if (derived) {
          data.isDerived = true
          if (derived.status === "success") {
            data.derivedContent = derived.output
          } else if (derived.status === "error") {
            data.derivedError = derived.message
          }
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
            onNavigatePage: callbacks.onNavigatePage,
            onZoomChange: callbacks.onZoomChange,
            onDarkModeToggle: callbacks.onDarkModeToggle,
            onDelete: callbacks.onDelete,
            onResizeEnd: callbacks.onResizeEnd,
          } satisfies PdfFlowNodeData,
        }
      case "transform": {
        // Determine source node type for intellisense context
        const incomingConn = connections.find((c) => c.targetId === node.id)
        const sourceNode = incomingConn ? nodes.find((n) => n.id === incomingConn.sourceId) : undefined
        const sourceNodeType = sourceNode?.type === "pdf" ? "pdf" as const : "markdown" as const

        // Find downstream target to get pipeline result
        const outgoingConn = connections.find((c) => c.sourceId === node.id)
        const targetId = outgoingConn?.targetId
        const transformResult = targetId ? pipelineResults?.get(targetId) : undefined

        return {
          ...base,
          type: "transformNode",
          data: {
            nodeId: node.id,
            transformCode: node.transformCode,
            timeoutMs: node.timeoutMs,
            transformResult,
            sourceNodeType,
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
            systemPrompt,
            onSendMessage: callbacks.onSendMessage,
            onDelete: callbacks.onDelete,
            onResizeEnd: callbacks.onResizeEnd,
          } satisfies ChatFlowNodeData,
        }
      }
    }
  })
}

export function toFlowEdges(connections: Connection[]): Edge[] {
  return connections.map((conn) => ({
    id: conn.id,
    source: conn.sourceId,
    target: conn.targetId,
    type: "default",
    animated: true,
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
