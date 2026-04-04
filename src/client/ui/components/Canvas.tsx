"use client"

import { useMemo, useCallback } from "react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MarkerType,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  type OnNodeDrag,
  type OnNodesChange,
  type OnConnect,
  type OnEdgesChange,
  type Viewport,
  useReactFlow,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { MarkdownNode } from "./MarkdownNode"
import { PdfNode } from "./PdfNode"
import { TransformNode } from "./TransformNode"
import { ChatNode } from "./ChatNode"
import { AiTransformNode } from "./AiTransformNode"
import { LabeledEdge } from "./LabeledEdge"

type CanvasProps = {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onNodeDragStop: OnNodeDrag
  onConnect: OnConnect
  initialViewport: Viewport | null
  onDropPdf?: (file: File, position: { x: number; y: number }) => void
}

export function Canvas({ nodes, edges, onNodesChange, onEdgesChange, onNodeDragStop, onConnect, initialViewport, onDropPdf }: CanvasProps) {
  const nodeTypes: NodeTypes = useMemo(
    () => ({ markdownNode: MarkdownNode, pdfNode: PdfNode, transformNode: TransformNode, chatNode: ChatNode, aiTransformNode: AiTransformNode }),
    []
  )
  const edgeTypes: EdgeTypes = useMemo(
    () => ({ labeledEdge: LabeledEdge }),
    []
  )
  const defaultEdgeOptions = useMemo(
    () => ({ markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 } }),
    []
  )
  const reactFlow = useReactFlow()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!onDropPdf) return

      const file = Array.from(e.dataTransfer.files).find(
        (f) => f.type === "application/pdf"
      )
      if (!file) return

      const position = reactFlow.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      })
      onDropPdf(file, position)
    },
    [onDropPdf, reactFlow]
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeDragStop={onNodeDragStop}
      onConnect={onConnect}
      defaultViewport={initialViewport ?? undefined}
      fitView={!initialViewport}
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
      deleteKeyCode={["Backspace", "Delete"]}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Background variant={BackgroundVariant.Lines} gap={24} className="!opacity-[0.04]" />
    </ReactFlow>
  )
}
