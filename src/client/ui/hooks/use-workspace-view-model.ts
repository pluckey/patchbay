'use client'

import { useCallback, useMemo } from "react"
import { useReactFlow } from "@xyflow/react"
import type { Node, Edge, OnNodeDrag, OnNodesChange, OnEdgesChange, OnConnect, Viewport } from "@xyflow/react"
import type { Cell, ModelRosterEntry, SchemaField, InputLegendEntry } from "@/kernel/entities"
import type { MixEntry, StalenessStatus } from "@/kernel/transforms"
import { useWorkspace } from "@/client/ui/hooks/use-workspace"
import { useCanvasBinding } from "@/client/adapters/canvas/use-canvas-binding"
import { usePipelineExecution } from "@/client/ui/hooks/use-pipeline-execution"
import { useAdapters } from "@/client/ui/app/adapters-context"
import { useAiTransformHandlers } from "@/client/ui/hooks/use-ai-transform-handlers"
import { useAiAutoExecute } from "@/client/ui/hooks/use-ai-auto-execute"
import { useCellLifecycle } from "@/client/ui/hooks/use-cell-lifecycle"
import { useCellEditing } from "@/client/ui/hooks/use-cell-editing"
import { useCascade } from "@/client/ui/hooks/use-cascade"
import { useMix } from "@/client/ui/hooks/use-mix"
import { useHealth } from "@/client/ui/hooks/use-health"
import { useScopeState } from "@/client/ui/hooks/use-scope-state"
import { useScopeData } from "@/client/ui/hooks/use-scope-data"
import type { CellCardCallbacks } from "@/client/adapters/canvas/flow-node-mapper"

export type WorkspaceViewModel = {
  isLoaded: boolean
  toolbar: {
    onAddNode: () => void
    onAddTransform: () => void
    onAddChat: () => void
    onAddAiTransform: () => void
    onUploadPdf: (file: File) => void
    onAddSource: () => void
    onAddAi: () => void
    onAddCode: () => void
  }
  canvas: {
    flowNodes: Node[]
    flowEdges: Edge[]
    onNodesChange: OnNodesChange
    onEdgesChange: OnEdgesChange
    onNodeDragStop: OnNodeDrag
    onNodeDoubleClick: (event: React.MouseEvent, node: Node) => void
    onConnect: OnConnect
    initialViewport: Viewport | null
    onDropPdf: (file: File, position: { x: number; y: number }) => Promise<void>
  }
  mix: {
    entries: MixEntry[]
  }
  scope: {
    focusedCell: Cell | null
    inputs: Array<{ cellId: string; title: string; text: string }>
    inputLegend: InputLegendEntry[]
    health: StalenessStatus | undefined
    roster: ModelRosterEntry[]
    onTrigger: () => void
    onContentChange: (content: string) => void
    onInstructionChange: (instruction: string) => void
    onCodeChange: (code: string) => void
    onModelChange: (provider: string, model: string) => void
    onTimeoutChange: (timeoutMs: number) => void
    onOutputModeChange: (mode: 'text' | 'structured') => void
    onSchemaChange: (schema: SchemaField[]) => void
    onSchemaModeChange: (mode: 'single' | 'collection') => void
    onNavigateToCell: (cellId: string) => void
    onClose: () => void
  }
}

/**
 * Composes all WorkspaceView dependencies into a flat viewmodel.
 *
 * WorkspaceView itself becomes pure JSX wiring — destructure this viewmodel and
 * pass slices to Toolbar, Canvas, MixPanel, ScopeView. This keeps the component
 * a single-responsibility layout shell and centralises hook composition here.
 */
export function useWorkspaceViewModel(): WorkspaceViewModel {
  const reactFlow = useReactFlow()
  const getViewport = reactFlow.getViewport

  const {
    nodes,
    connections,
    initialViewport,
    isLoaded,
    handleCreate,
    handleContentChange,
    handleDelete,
    handleDuplicateNode,
    handleMove,
    handleResize,
    handleNavigatePage,
    handleUploadPdf,
    handleCreateConnection,
    handleRemoveConnection,
    handleTransformCodeChange,
    handleTimeoutChange,
    handleZoomChange,
    handleDarkModeToggle,
    handleAddTransformNode,
    handleAddChatNode,
    handleSendMessage,
    handleResetChat,
    handleModelChange,
    handleAnnotationCreate,
    handleAnnotationDelete,
    handleAnnotationEdit,
    handleUpdateConnectionLabel,
    streamingNodeIds,
    roster,
    cells,
    setCells,
    cellsRef,
    setNodes,
    setConnections,
    nodesRef,
    connectionsRef,
    scheduleSave,
    trackDeletion,
  } = useWorkspace({ getViewport })

  const { aiExecutor, blobStorage, pdfRenderer, transformExecutor } = useAdapters()

  const {
    handleAddAiTransformNode,
    handleAiInstructionChange,
    handleAiModelChange,
    handleAiInputModeChange,
    handleAiAutoExecuteToggle,
    handleExecuteAiTransform,
    handleOutputModeChange,
    handleSchemaChange,
    handleSchemaModeChange,
  } = useAiTransformHandlers({
    setNodes, nodesRef, connectionsRef, scheduleSave, aiExecutor, roster,
  })

  const pipelineDeps = useMemo(
    () => ({ transformExecutor, blobStorage, pdfRenderer }),
    [transformExecutor, blobStorage, pdfRenderer]
  )

  const { pipelineResults, rerun } = usePipelineExecution({
    nodes,
    connections,
    deps: pipelineDeps,
  })

  const executeAiTransform = useCallback(
    (nodeId: string) => handleExecuteAiTransform(nodeId, pipelineResults),
    [handleExecuteAiTransform, pipelineResults]
  )

  // === Signal-field cell hooks ===
  const lifecycle = useCellLifecycle({
    setCells,
    nodesRef,
    connectionsRef,
    setConnections,
    scheduleSave,
    trackDeletion,
    roster,
  })

  const editing = useCellEditing({
    setCells,
    nodesRef,
    scheduleSave,
  })

  const { triggerCell } = useCascade({
    cells,
    connections,
    setCells,
    cellsRef,
    nodesRef,
    scheduleSave,
  })

  const mixEntries = useMix(cells, connections)
  const healthMap = useHealth(cells, connections, nodes)
  const { scopeCellId, openScope, closeScope } = useScopeState()
  const { inputs: scopeInputs, inputLegend: scopeInputLegend } = useScopeData(scopeCellId, cells, connections, nodes)

  const cellCardCallbacks = useMemo<CellCardCallbacks>(() => ({
    onOpenScope: (cellId) => openScope(cellId),
    onTrigger: (cellId) => { void triggerCell(cellId) },
    onDelete: (cellId) => lifecycle.handleCellDelete(cellId),
    onDuplicate: (cellId) => lifecycle.handleCellDuplicate(cellId),
    onResizeEnd: (cellId, dimensions) => lifecycle.handleCellResize(cellId, dimensions),
  }), [openScope, triggerCell, lifecycle])

  const {
    flowNodes,
    flowEdges,
    onNodesChange,
    onEdgesChange,
    onNodeDragStop,
    onNodeDoubleClick,
    onConnect,
  } = useCanvasBinding({
    nodes,
    connections,
    pipelineResults,
    streamingNodeIds,
    onContentChange: handleContentChange,
    onDelete: handleDelete,
    onDuplicate: handleDuplicateNode,
    onMove: handleMove,
    onResize: handleResize,
    onNavigatePage: handleNavigatePage,
    onZoomChange: handleZoomChange,
    onDarkModeToggle: handleDarkModeToggle,
    onTransformCodeChange: handleTransformCodeChange,
    onTimeoutChange: handleTimeoutChange,
    onRerun: rerun,
    onSendMessage: handleSendMessage,
    onResetChat: handleResetChat,
    onModelChange: handleModelChange,
    onAnnotationCreate: handleAnnotationCreate,
    onAnnotationDelete: handleAnnotationDelete,
    onAnnotationEdit: handleAnnotationEdit,
    onAiInstructionChange: handleAiInstructionChange,
    onAiModelChange: handleAiModelChange,
    onAiInputModeChange: handleAiInputModeChange,
    onAiAutoExecuteToggle: handleAiAutoExecuteToggle,
    onAiOutputModeChange: handleOutputModeChange,
    onAiSchemaChange: handleSchemaChange,
    onAiSchemaModeChange: handleSchemaModeChange,
    onAiExecute: executeAiTransform,
    roster,
    onCreateConnection: handleCreateConnection,
    onRemoveConnection: handleRemoveConnection,
    onUpdateConnectionLabel: handleUpdateConnectionLabel,
    getViewport,
    cells,
    cellCardCallbacks,
    onCellMove: lifecycle.handleCellMove,
    onNodeDoubleClick: openScope,
  })

  useAiAutoExecute({
    nodes,
    connections,
    onExecute: executeAiTransform,
  })

  // --- Toolbar adapters: route create-at-center through reactFlow ---
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

  const onUploadPdf = useCallback(
    async (file: File, position: { x: number; y: number }) => {
      const result = await handleUploadPdf(file, position)
      if (!result.ok) {
        alert(result.reason)
      }
    },
    [handleUploadPdf]
  )

  const toolbar = useMemo(
    () => ({
      onAddNode: () => createAtCenter(handleCreate),
      onAddTransform: () => createAtCenter(handleAddTransformNode),
      onAddChat: () => createAtCenter(handleAddChatNode),
      onAddAiTransform: () => createAtCenter(handleAddAiTransformNode),
      onUploadPdf: (file: File) => createAtCenter((pos) => onUploadPdf(file, pos)),
      onAddSource: () => createAtCenter(lifecycle.handleAddSourceCell),
      onAddAi: () => createAtCenter(lifecycle.handleAddAiCell),
      onAddCode: () => createAtCenter(lifecycle.handleAddCodeCell),
    }),
    [createAtCenter, handleCreate, handleAddTransformNode, handleAddChatNode, handleAddAiTransformNode, onUploadPdf, lifecycle]
  )

  // --- Scope binding ---
  const focusedCell = useMemo(
    () => (scopeCellId ? cells.find((c) => c.id === scopeCellId) ?? null : null),
    [scopeCellId, cells]
  )

  const onNavigateToCell = useCallback(
    (cellId: string) => {
      const target = cells.find((c) => c.id === cellId)
      closeScope()
      if (!target) return
      reactFlow.setCenter(target.position.x, target.position.y, {
        zoom: reactFlow.getZoom(),
        duration: 300,
      })
    },
    [cells, closeScope, reactFlow]
  )

  const focusedCellId = focusedCell?.id ?? null

  const scope = useMemo<WorkspaceViewModel['scope']>(
    () => ({
      focusedCell,
      inputs: scopeInputs,
      inputLegend: scopeInputLegend,
      health: focusedCellId ? healthMap.get(focusedCellId) : undefined,
      roster,
      onTrigger: () => {
        if (focusedCellId) void triggerCell(focusedCellId)
      },
      onContentChange: (content: string) => {
        if (focusedCellId) editing.handleCellContentChange(focusedCellId, content)
      },
      onInstructionChange: (instruction: string) => {
        if (focusedCellId) editing.handleCellInstructionChange(focusedCellId, instruction)
      },
      onCodeChange: (code: string) => {
        if (focusedCellId) editing.handleCellCodeChange(focusedCellId, code)
      },
      onModelChange: (provider: string, model: string) => {
        if (focusedCellId) editing.handleCellModelChange(focusedCellId, provider, model)
      },
      onTimeoutChange: (timeoutMs: number) => {
        if (focusedCellId) editing.handleCellTimeoutChange(focusedCellId, timeoutMs)
      },
      onOutputModeChange: (mode: 'text' | 'structured') => {
        if (focusedCellId) editing.handleCellOutputModeChange(focusedCellId, mode)
      },
      onSchemaChange: (schema: SchemaField[]) => {
        if (focusedCellId) editing.handleCellSchemaChange(focusedCellId, schema)
      },
      onSchemaModeChange: (mode: 'single' | 'collection') => {
        if (focusedCellId) editing.handleCellSchemaModeChange(focusedCellId, mode)
      },
      onNavigateToCell,
      onClose: closeScope,
    }),
    [focusedCell, focusedCellId, scopeInputs, scopeInputLegend, healthMap, roster, triggerCell, editing, onNavigateToCell, closeScope]
  )

  return {
    isLoaded,
    toolbar,
    canvas: {
      flowNodes,
      flowEdges,
      onNodesChange,
      onEdgesChange,
      onNodeDragStop,
      onNodeDoubleClick,
      onConnect,
      initialViewport,
      onDropPdf: onUploadPdf,
    },
    mix: { entries: mixEntries },
    scope,
  }
}
