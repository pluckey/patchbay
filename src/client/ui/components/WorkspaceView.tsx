"use client"

import { useCallback, useMemo } from "react"
import { useReactFlow } from "@xyflow/react"
import { useWorkspace } from "@/client/ui/hooks/use-workspace"
import { useCanvasBinding } from "@/client/adapters/canvas/use-canvas-binding"
import { usePipelineExecution } from "@/client/ui/hooks/use-pipeline-execution"
import { useAdapters } from "@/client/ui/app/adapters-context"
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
    handleUpdateConnectionLabel,
    streamingNodeIds,
    roster,
  } = useWorkspace({ getViewport })


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
    roster,
    onCreateConnection: handleCreateConnection,
    onRemoveConnection: handleRemoveConnection,
    onUpdateConnectionLabel: handleUpdateConnectionLabel,
    getViewport,
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
