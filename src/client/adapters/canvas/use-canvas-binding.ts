"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import type { Node, Edge, OnNodeDrag, OnNodesChange, OnEdgesChange, NodeChange, EdgeChange, Connection as FlowConnection } from "@xyflow/react"
import { applyNodeChanges, applyEdgeChanges, useReactFlow } from "@xyflow/react"
import type { WorkspaceNode, Connection, TransformResult, ModelRosterEntry, SchemaField, PdfRegion } from "@/kernel/entities"
import { toFlowNodes, toFlowEdges, fromNodeDragStop } from "@/client/adapters/canvas/flow-node-mapper"
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
  onCreateConnection: (sourceId: string, targetId: string) => boolean
  onRemoveConnection: (connectionId: string) => void
  onUpdateConnectionLabel: (connectionId: string, label: string) => void
  getViewport: () => { x: number; y: number; zoom: number }
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
}: UseCanvasBindingArgs) {
  const [flowNodes, setFlowNodes] = useState<Node[]>([])

  // Precompute system prompts for chat nodes
  const chatSystemPrompts = useMemo(
    () => resolveChatSystemPrompts(nodes, connections, pipelineResults),
    [nodes, connections, pipelineResults]
  )

  // Sync domain state → flow nodes on CRUD changes
  useEffect(() => {
    setFlowNodes(toFlowNodes(nodes, connections, {
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
    }, pipelineResults, chatSystemPrompts, streamingNodeIds, roster))
  }, [nodes, connections, pipelineResults, chatSystemPrompts, streamingNodeIds, onContentChange, onDelete, onDuplicate, onResize, onNavigatePage, onZoomChange, onDarkModeToggle, onTransformCodeChange, onTimeoutChange, onRerun, onSendMessage, onResetChat, onModelChange, onAnnotationCreate, onAnnotationDelete, onAnnotationEdit, onAiInstructionChange, onAiModelChange, onAiInputModeChange, onAiAutoExecuteToggle, onAiOutputModeChange, onAiSchemaChange, onAiSchemaModeChange, onAiExecute, roster])

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
      onMove(nodeId, position)
    },
    [onMove]
  )

  // Handle xyflow connection event — always create a plain edge
  const onConnect = useCallback(
    (params: FlowConnection) => {
      if (params.source && params.target) {
        onCreateConnection(params.source, params.target)
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
    onConnect,
    createAtCenter,
  }
}
