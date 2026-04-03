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
    handleCreatePipeline,
    handleTransformCodeChange,
  } = useWorkspace({ getViewport })

  const { blobStorage, pdfRenderer, transformExecutor } = useAdapters()
  const pipelineDeps = useMemo(() => ({
    transformExecutor,
    blobStorage,
    pdfRenderer,
  }), [transformExecutor, blobStorage, pdfRenderer])

  const { pipelineResults } = usePipelineExecution({
    nodes,
    connections,
    deps: pipelineDeps,
  })

  const {
    flowNodes,
    flowEdges,
    onNodesChange,
    onNodeDragStop,
    onConnect,
    createAtCenter,
  } = useCanvasBinding({
    nodes,
    connections,
    pipelineResults,
    onContentChange: handleContentChange,
    onDelete: handleDelete,
    onMove: handleMove,
    onResize: handleResize,
    onNavigatePage: handleNavigatePage,
    onTransformCodeChange: handleTransformCodeChange,
    onCreatePipeline: handleCreatePipeline,
    onCreateConnection: handleCreateConnection,
    onRemoveConnection: handleRemoveConnection,
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
        onUploadPdf={(file) => createAtCenter((pos) => onUploadPdf(file, pos))}
      />
      <Canvas
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        initialViewport={initialViewport}
        onDropPdf={onUploadPdf}
      />
    </>
  )
}
