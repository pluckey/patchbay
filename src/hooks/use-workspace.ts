"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import type { Node, OnNodeDrag, Viewport } from "@xyflow/react"
import { useReactFlow } from "@xyflow/react"
import type { WorkspaceNode } from "@/domain/entities"
import { DEFAULT_WORKSPACE } from "@/domain/entities"
import { createNode } from "@/domain/use-cases/create-node"
import { updateNodeContent } from "@/domain/use-cases/update-node-content"
import { moveNode } from "@/domain/use-cases/move-node"
import { removeNode } from "@/domain/use-cases/remove-node"
import { loadWorkspace } from "@/domain/use-cases/load-workspace"
import { saveWorkspace } from "@/domain/use-cases/save-workspace"
import { toFlowNodes, fromNodeDragStop } from "@/adapters/canvas/flow-node-mapper"
import { localStorageAdapter } from "@/adapters/storage/local-storage-adapter"
import type { MarkdownNodeData } from "@/adapters/canvas/flow-node-mapper"

export function useWorkspace() {
  const [nodes, setNodes] = useState<WorkspaceNode[]>([])
  const [initialViewport, setInitialViewport] = useState<Viewport | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const nodesRef = useRef(nodes)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reactFlow = useReactFlow()

  // Keep ref in sync for beforeunload
  nodesRef.current = nodes

  // --- Persistence: load on mount ---
  useEffect(() => {
    const workspace = loadWorkspace(localStorageAdapter)
    setNodes(workspace.nodes)
    setInitialViewport(workspace.viewport)
    setIsLoaded(true)
  }, [])

  // --- Persistence: debounced save ---
  const scheduleSave = useCallback((updatedNodes: WorkspaceNode[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      const viewport = reactFlow.getViewport()
      saveWorkspace(localStorageAdapter, {
        nodes: updatedNodes,
        viewport,
      })
    }, 300)
  }, [reactFlow])

  // --- Persistence: beforeunload flush ---
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      const viewport = reactFlow.getViewport()
      saveWorkspace(localStorageAdapter, {
        nodes: nodesRef.current,
        viewport,
      })
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [reactFlow])

  // --- Node CRUD ---
  const handleCreate = useCallback(
    (position?: { x: number; y: number }) => {
      const pos = position ?? (() => {
        const vp = reactFlow.getViewport()
        // Convert viewport center to flow coordinates
        return reactFlow.screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        })
      })()

      setNodes((prev) => {
        const node = createNode(pos)
        const updated = [...prev, node]
        scheduleSave(updated)
        return updated
      })
    },
    [reactFlow, scheduleSave]
  )

  const handleContentChange = useCallback(
    (nodeId: string, content: string) => {
      setNodes((prev) => {
        const updated = updateNodeContent(prev, nodeId, content)
        scheduleSave(updated)
        return updated
      })
    },
    [scheduleSave]
  )

  const handleDelete = useCallback(
    (nodeId: string) => {
      setNodes((prev) => {
        const updated = removeNode(prev, nodeId)
        scheduleSave(updated)
        return updated
      })
    },
    [scheduleSave]
  )

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      const { nodeId, position } = fromNodeDragStop(node)
      setNodes((prev) => {
        const updated = moveNode(prev, nodeId, position)
        scheduleSave(updated)
        return updated
      })
    },
    [scheduleSave]
  )

  // --- Map to xyflow nodes ---
  const flowNodes: Node<MarkdownNodeData>[] = useMemo(
    () => toFlowNodes(nodes, handleContentChange, handleDelete),
    [nodes, handleContentChange, handleDelete]
  )

  return {
    flowNodes,
    initialViewport,
    isLoaded,
    handleCreate,
    onNodeDragStop,
  }
}
