"use client"

import { useMemo } from "react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type Node,
  type NodeTypes,
  type OnNodeDrag,
  type Viewport,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { MarkdownNode } from "./MarkdownNode"

type CanvasProps = {
  nodes: Node[]
  onNodeDragStop: OnNodeDrag
  initialViewport: Viewport | null
}

export function Canvas({ nodes, onNodeDragStop, initialViewport }: CanvasProps) {
  const nodeTypes: NodeTypes = useMemo(
    () => ({ markdown: MarkdownNode }),
    []
  )

  return (
    <ReactFlow
      nodes={nodes}
      nodeTypes={nodeTypes}
      onNodeDragStop={onNodeDragStop}
      defaultViewport={initialViewport ?? undefined}
      fitView={!initialViewport}
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
      deleteKeyCode={null}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
    </ReactFlow>
  )
}
