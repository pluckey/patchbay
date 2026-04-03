"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import type { WorkspaceNode, Connection, Viewport } from "@/kernel/entities"
import { loadWorkspace } from "@/client/domain/use-cases/load-workspace"
import { saveWorkspace } from "@/client/domain/use-cases/save-workspace"
import type { StoragePort } from "@/client/domain/ports/storage-port"

type UseWorkspacePersistenceArgs = {
  storage: StoragePort
  getViewport: () => Viewport
}

export function useWorkspacePersistence({ storage, getViewport }: UseWorkspacePersistenceArgs) {
  const [nodes, setNodes] = useState<WorkspaceNode[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [initialViewport, setInitialViewport] = useState<Viewport | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const nodesRef = useRef(nodes)
  const connectionsRef = useRef(connections)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const getViewportRef = useRef(getViewport)

  nodesRef.current = nodes
  connectionsRef.current = connections
  getViewportRef.current = getViewport

  const isLoadedRef = useRef(false)

  // Load on mount
  useEffect(() => {
    ;(async () => {
      const workspace = await loadWorkspace(storage)
      setNodes(workspace.nodes)
      setConnections(workspace.connections)
      setInitialViewport(workspace.viewport)
      isLoadedRef.current = true
      setIsLoaded(true)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced save
  const scheduleSave = useCallback((updatedNodes: WorkspaceNode[], updatedConnections?: Connection[]) => {
    if (!isLoadedRef.current) return
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveWorkspace(storage, {
        nodes: updatedNodes,
        connections: updatedConnections ?? connectionsRef.current,
        viewport: getViewportRef.current(),
      }).catch(console.error)
    }, 300)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Beforeunload flush (fire-and-forget — write-through cache in adapter provides safety)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      storage.save({
        nodes: nodesRef.current,
        connections: connectionsRef.current,
        viewport: getViewportRef.current(),
      })
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    nodes,
    setNodes,
    connections,
    setConnections,
    nodesRef,
    connectionsRef,
    initialViewport,
    isLoaded,
    scheduleSave,
  }
}
