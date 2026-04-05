"use client"

import { useCallback, useMemo } from "react"
import { useReactFlow } from "@xyflow/react"
import { useWorkspace } from "@/client/ui/hooks/use-workspace"
import { useCanvasBinding } from "@/client/adapters/canvas/use-canvas-binding"
import { usePipelineExecution } from "@/client/ui/hooks/use-pipeline-execution"
import { useAdapters } from "@/client/ui/app/adapters-context"
import { useAiTransformHandlers } from "@/client/ui/hooks/use-ai-transform-handlers"
import { useAiAutoExecute } from "@/client/ui/hooks/use-ai-auto-execute"
import { Canvas } from "./Canvas"
import { Toolbar } from "./Toolbar"

export function WorkspaceView() {
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
    setNodes,
    nodesRef,
    connectionsRef,
    scheduleSave,
  } = useWorkspace({ getViewport })

  const { aiExecutor } = useAdapters()

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

  const { blobStorage, pdfRenderer, transformExecutor } = useAdapters()
  const pipelineDeps = useMemo(() => ({
    transformExecutor,
    blobStorage,
    pdfRenderer,
  }), [transformExecutor, blobStorage, pdfRenderer])

  const { pipelineResults, rerun } = usePipelineExecution({
    nodes,
    connections,
    deps: pipelineDeps,
  })

  // Wrap execute to pass pipelineResults at call time (no mutable ref bridge)
  const executeAiTransform = useCallback(
    (nodeId: string) => handleExecuteAiTransform(nodeId, pipelineResults),
    [handleExecuteAiTransform, pipelineResults]
  )

  const {
    flowNodes,
    flowEdges,
    onNodesChange,
    onEdgesChange,
    onNodeDragStop,
    onConnect,
    createAtCenter,
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
  })

  useAiAutoExecute({
    nodes,
    connections,
    onExecute: executeAiTransform,
  })

  const onUploadPdf = useCallback(
    async (file: File, position: { x: number; y: number }) => {
      const result = await handleUploadPdf(file, position)
      if (!result.ok) {
        alert(result.reason)
      }
    },
    [handleUploadPdf]
  )

  if (!isLoaded) {
    return null
  }

  return (
    <>
      <Toolbar
        onAddNode={() => createAtCenter(handleCreate)}
        onAddTransform={() => createAtCenter(handleAddTransformNode)}
        onAddChat={() => createAtCenter(handleAddChatNode)}
        onAddAiTransform={() => createAtCenter(handleAddAiTransformNode)}
        onUploadPdf={(file) => createAtCenter((pos) => onUploadPdf(file, pos))}
      />
      <Canvas
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        initialViewport={initialViewport}
        onDropPdf={onUploadPdf}
      />
    </>
  )
}
