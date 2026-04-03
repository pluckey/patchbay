"use client"

import { useWorkspace } from "@/hooks/use-workspace"
import { Canvas } from "./Canvas"
import { Toolbar } from "./Toolbar"

export function WorkspaceView() {
  const {
    flowNodes,
    initialViewport,
    isLoaded,
    handleCreate,
    onNodeDragStop,
  } = useWorkspace()

  if (!isLoaded) {
    return null
  }

  return (
    <>
      <Toolbar onAddNode={() => handleCreate()} />
      <Canvas
        nodes={flowNodes}
        onNodeDragStop={onNodeDragStop}
        initialViewport={initialViewport}
      />
    </>
  )
}
