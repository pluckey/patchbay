"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import type { Node, Edge, OnNodeDrag, OnNodesChange, NodeChange, Connection as FlowConnection } from "@xyflow/react"
import { applyNodeChanges, useReactFlow } from "@xyflow/react"
import type { WorkspaceNode, Connection, TransformResult } from "@/kernel/entities"
import { toFlowNodes, toFlowEdges, fromNodeDragStop } from "@/client/adapters/canvas/flow-node-mapper"

function applyChanges(changes: NodeChange[], nodes: Node[]): Node[] {
  return applyNodeChanges(changes, nodes)
}

type UseCanvasBindingArgs = {
  nodes: WorkspaceNode[]
  connections: Connection[]
  pipelineResults: Map<string, TransformResult>
  onContentChange: (nodeId: string, content: string) => void
  onDelete: (nodeId: string) => void
  onMove: (nodeId: string, position: { x: number; y: number }) => void
  onResize: (nodeId: string, dimensions: { width: number; height: number }) => void
  onNavigatePage: (nodeId: string, page: number) => void
  onZoomChange: (nodeId: string, zoomLevel: number) => void
  onDarkModeToggle: (nodeId: string) => void
  onTransformCodeChange: (nodeId: string, code: string) => void
  onTimeoutChange: (nodeId: string, timeoutMs: number) => void
  onRerun: (nodeId: string) => void
  onSendMessage: (nodeId: string, content: string, systemPrompt: string) => void
  onCreatePipeline: (sourceId: string, targetId: string) => void
  onCreateConnection: (sourceId: string, targetId: string) => boolean
  onRemoveConnection: (connectionId: string) => void
  getViewport: () => { x: number; y: number; zoom: number }
}

export function useCanvasBinding({
  nodes,
  connections,
  pipelineResults,
  onContentChange,
  onDelete,
  onMove,
  onResize,
  onNavigatePage,
  onZoomChange,
  onDarkModeToggle,
  onTransformCodeChange,
  onTimeoutChange,
  onRerun,
  onSendMessage,
  onCreatePipeline,
  onCreateConnection,
  onRemoveConnection,
}: UseCanvasBindingArgs) {
  const [flowNodes, setFlowNodes] = useState<Node[]>([])

  // Precompute system prompts for chat nodes
  const chatSystemPrompts = useMemo(() => {
    const prompts = new Map<string, string>()
    for (const node of nodes) {
      if (node.type !== "chat") continue
      const incomingConn = connections.find((c) => c.targetId === node.id)
      if (!incomingConn) continue
      const sourceNode = nodes.find((n) => n.id === incomingConn.sourceId)
      if (!sourceNode) continue
      const sourceDerived = pipelineResults.get(sourceNode.id)
      if (sourceDerived?.status === "success") {
        prompts.set(node.id, sourceDerived.output)
      } else if (sourceNode.type === "markdown") {
        prompts.set(node.id, sourceNode.content)
      }
    }
    return prompts
  }, [nodes, connections, pipelineResults])

  // Sync domain state → flow nodes on CRUD changes
  useEffect(() => {
    setFlowNodes(toFlowNodes(nodes, connections, {
      onContentChange,
      onDelete,
      onResizeEnd: onResize,
      onNavigatePage,
      onZoomChange,
      onDarkModeToggle,
      onTransformCodeChange,
      onTimeoutChange,
      onRerun,
      onSendMessage,
    }, pipelineResults, chatSystemPrompts))
  }, [nodes, connections, pipelineResults, chatSystemPrompts, onContentChange, onDelete, onResize, onNavigatePage, onZoomChange, onDarkModeToggle, onTransformCodeChange, onTimeoutChange, onRerun, onSendMessage])

  // Sync domain connections → flow edges
  const flowEdges: Edge[] = useMemo(() =>
    toFlowEdges(connections),
    [connections]
  )

  // Transient flow changes (drag position, selection) — xyflow owns these
  const onNodesChange: OnNodesChange = useCallback((changes) => {
    setFlowNodes((prev) => applyChanges(changes, prev))
  }, [])

  // Commit final position to domain on drag stop
  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      const { nodeId, position } = fromNodeDragStop(node)
      onMove(nodeId, position)
    },
    [onMove]
  )

  // Handle xyflow connection event — auto-create transform node between source and target
  const onConnect = useCallback(
    (params: FlowConnection) => {
      if (!params.source || !params.target) return

      const sourceNode = nodes.find((n) => n.id === params.source)
      const targetNode = nodes.find((n) => n.id === params.target)
      if (!sourceNode || !targetNode) return

      // If connecting TO/FROM a transform or chat node, just create a plain edge
      if (sourceNode.type === "transform" || targetNode.type === "transform" || targetNode.type === "chat") {
        onCreateConnection(params.source, params.target)
        return
      }

      // Content node → content node: auto-create transform in between
      onCreatePipeline(params.source, params.target)
    },
    [nodes, onCreateConnection, onCreatePipeline]
  )

  const reactFlow = useReactFlow()

  // Create node at viewport center
  const createAtCenter = useCallback(
    (onCreate: (position: { x: number; y: number }) => void) => {
      const pos = reactFlow.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      })
      onCreate(pos)
    },
    [reactFlow]
  )

  return {
    flowNodes,
    flowEdges,
    onNodesChange,
    onNodeDragStop,
    onConnect,
    createAtCenter,
  }
}
