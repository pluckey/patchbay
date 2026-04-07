"use client"

import React, { useState, useCallback, useEffect, useMemo } from "react"
import type { Node, Edge, OnNodeDrag, OnNodesChange, OnEdgesChange, NodeChange, EdgeChange, Connection as FlowConnection } from "@xyflow/react"
import { applyNodeChanges, applyEdgeChanges, useReactFlow } from "@xyflow/react"
import type { WorkspaceNode, Connection, TransformResult, ModelRosterEntry, SchemaField, PdfRegion, Cell, Position } from "@/kernel/entities"
import { toFlowNodes, toFlowEdges, fromNodeDragStop, cellsToFlowNodes } from "@/client/adapters/canvas/flow-node-mapper"
import type { CellCardCallbacks } from "@/client/adapters/canvas/flow-node-mapper"
import { resolveChatSystemPrompts } from "@/client/domain/use-cases/resolve-chat-prompts"

function applyChanges(changes: NodeChange[], nodes: Node[]): Node[] {
  return applyNodeChanges(changes, nodes)
}

type UseCanvasBindingArgs = {
  nodes: WorkspaceNode[]
  connections: Connection[]
  pipelineResults: Map<string, TransformResult>
  streamingNodeIds: Set<string>
  onContentChange: (nodeId: string, content: string) => void
  onDelete: (nodeId: string) => void
  onDuplicate: (nodeId: string) => void
  onMove: (nodeId: string, position: { x: number; y: number }) => void
  onResize: (nodeId: string, dimensions: { width: number; height: number }) => void
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
  onAnnotationEdit: (nodeId: string, annotationId: string, label: string) => void
  onAiInstructionChange: (nodeId: string, instruction: string) => void
  onAiModelChange: (nodeId: string, provider: string, model: string) => void
  onAiInputModeChange: (nodeId: string, inputMode: "concat" | "named") => void
  onAiAutoExecuteToggle: (nodeId: string) => void
  onAiOutputModeChange: (nodeId: string, mode: "text" | "structured") => void
  onAiSchemaChange: (nodeId: string, schema: SchemaField[]) => void
  onAiSchemaModeChange: (nodeId: string, schemaMode: "single" | "collection") => void
  onAiExecute: (nodeId: string) => void
  roster: ModelRosterEntry[]
  onCreateConnection: (sourceId: string, targetId: string, sourcePort?: string, targetPort?: string) => boolean
  onRemoveConnection: (connectionId: string) => void
  onUpdateConnectionLabel: (connectionId: string, label: string) => void
  getViewport: () => { x: number; y: number; zoom: number }
  cells?: Cell[]
  cellCardCallbacks?: CellCardCallbacks
  onCellMove?: (cellId: string, position: Position) => void
  onNodeDoubleClick?: (nodeId: string) => void
}

export function useCanvasBinding({
  nodes,
  connections,
  pipelineResults,
  streamingNodeIds,
  onContentChange,
  onDelete,
  onDuplicate,
  onMove,
  onResize,
  onNavigatePage,
  onZoomChange,
  onDarkModeToggle,
  onTransformCodeChange,
  onTimeoutChange,
  onRerun,
  onSendMessage,
  onResetChat,
  onModelChange,
  onAnnotationCreate,
  onAnnotationDelete,
  onAnnotationEdit,
  onAiInstructionChange,
  onAiModelChange,
  onAiInputModeChange,
  onAiAutoExecuteToggle,
  onAiOutputModeChange,
  onAiSchemaChange,
  onAiSchemaModeChange,
  onAiExecute,
  roster,
  onCreateConnection,
  onRemoveConnection,
  onUpdateConnectionLabel,
  cells,
  cellCardCallbacks,
  onCellMove,
  onNodeDoubleClick,
}: UseCanvasBindingArgs) {
  const [flowNodes, setFlowNodes] = useState<Node[]>([])

  // Precompute system prompts for chat nodes
  const chatSystemPrompts = useMemo(
    () => resolveChatSystemPrompts(nodes, connections, pipelineResults),
    [nodes, connections, pipelineResults]
  )

  // Sync domain state → flow nodes on CRUD changes
  useEffect(() => {
    const legacyNodes = toFlowNodes(nodes, connections, {
      onContentChange,
      onDelete,
      onDuplicate,
      onResizeEnd: onResize,
      onNavigatePage,
      onZoomChange,
      onDarkModeToggle,
      onTransformCodeChange,
      onTimeoutChange,
      onRerun,
      onSendMessage,
      onResetChat,
      onModelChange,
      onAnnotationCreate,
      onAnnotationDelete,
      onAnnotationEdit,
      onAiInstructionChange,
      onAiModelChange,
      onAiInputModeChange,
      onAiAutoExecuteToggle,
      onAiOutputModeChange,
      onAiSchemaChange,
      onAiSchemaModeChange,
      onAiExecute,
    }, pipelineResults, chatSystemPrompts, streamingNodeIds, roster)
    const cellNodes = cells && cellCardCallbacks
      ? cellsToFlowNodes(cells, connections, cellCardCallbacks)
      : []
    setFlowNodes([...legacyNodes, ...cellNodes])
  }, [nodes, connections, pipelineResults, chatSystemPrompts, streamingNodeIds, onContentChange, onDelete, onDuplicate, onResize, onNavigatePage, onZoomChange, onDarkModeToggle, onTransformCodeChange, onTimeoutChange, onRerun, onSendMessage, onResetChat, onModelChange, onAnnotationCreate, onAnnotationDelete, onAnnotationEdit, onAiInstructionChange, onAiModelChange, onAiInputModeChange, onAiAutoExecuteToggle, onAiOutputModeChange, onAiSchemaChange, onAiSchemaModeChange, onAiExecute, roster, cells, cellCardCallbacks])

  // Sync domain connections → flow edges
  const [flowEdges, setFlowEdges] = useState<Edge[]>([])
  useEffect(() => {
    setFlowEdges(toFlowEdges(connections, { onLabelChange: onUpdateConnectionLabel }))
  }, [connections, onUpdateConnectionLabel])

  // Transient flow changes (drag position, selection) — xyflow owns these
  const onNodesChange: OnNodesChange = useCallback((changes) => {
    setFlowNodes((prev) => applyChanges(changes, prev))
  }, [])

  // Edge changes — apply selection, intercept removals to route to domain
  const onEdgesChange: OnEdgesChange = useCallback((changes: EdgeChange[]) => {
    const removals = changes.filter((c): c is EdgeChange & { type: "remove" } => c.type === "remove")
    const nonRemovals = changes.filter((c) => c.type !== "remove")

    // Apply selection and other transient changes
    if (nonRemovals.length > 0) {
      setFlowEdges((prev) => applyEdgeChanges(nonRemovals, prev))
    }

    // Route removals to domain
    for (const removal of removals) {
      onRemoveConnection(removal.id)
    }
  }, [onRemoveConnection])

  // Commit final position to domain on drag stop
  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      const { nodeId, position } = fromNodeDragStop(node)
      if (node.type === 'cellNode' && onCellMove) {
        onCellMove(nodeId, position)
      } else {
        onMove(nodeId, position)
      }
    },
    [onMove, onCellMove]
  )

  // Double-click on any node — notify caller (e.g. WorkspaceView uses this to enter a Scope)
  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeDoubleClick?.(node.id)
    },
    [onNodeDoubleClick]
  )

  // Handle xyflow connection event — pipe attachment-point ids through so the
  // line remembers which border it was dragged from/to. Xyflow names these
  // sourceHandle/targetHandle on its FlowConnection event; the kernel calls
  // them sourcePort/targetPort. This is the single read-direction translation
  // point in the canvas adapter.
  const onConnect = useCallback(
    (params: FlowConnection) => {
      if (params.source && params.target) {
        onCreateConnection(
          params.source,
          params.target,
          params.sourceHandle ?? undefined,
          params.targetHandle ?? undefined,
        )
      }
    },
    [onCreateConnection]
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
    onEdgesChange,
    onNodeDragStop,
    onNodeDoubleClick: handleNodeDoubleClick,
    onConnect,
    createAtCenter,
  }
}
