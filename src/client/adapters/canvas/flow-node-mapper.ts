import type { Node, Edge } from "@xyflow/react"
import type { Position, WorkspaceNode, Connection, TransformResult } from "@/kernel/entities"

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
  onNavigatePage: (nodeId: string, page: number) => void
  onDelete: (nodeId: string) => void
  onResizeEnd: (nodeId: string, dimensions: { width: number; height: number }) => void
}

export type TransformFlowNodeData = {
  nodeId: string
  transformCode: string
  transformResult?: TransformResult
  sourceNodeType?: "markdown" | "pdf"
  onTransformCodeChange: (nodeId: string, code: string) => void
  onDelete: (nodeId: string) => void
  onResizeEnd: (nodeId: string, dimensions: { width: number; height: number }) => void
}

export type FlowNodeData = MarkdownFlowNodeData | PdfFlowNodeData | TransformFlowNodeData

type FlowCallbacks = {
  onContentChange: (nodeId: string, content: string) => void
  onDelete: (nodeId: string) => void
  onResizeEnd: (nodeId: string, dimensions: { width: number; height: number }) => void
  onNavigatePage: (nodeId: string, page: number) => void
  onTransformCodeChange: (nodeId: string, code: string) => void
}

export function toFlowNodes(
  nodes: WorkspaceNode[],
  connections: Connection[],
  callbacks: FlowCallbacks,
  pipelineResults?: Map<string, TransformResult>
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
          } else {
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
            onNavigatePage: callbacks.onNavigatePage,
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
            transformResult,
            sourceNodeType,
            onTransformCodeChange: callbacks.onTransformCodeChange,
            onDelete: callbacks.onDelete,
            onResizeEnd: callbacks.onResizeEnd,
          } satisfies TransformFlowNodeData,
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
