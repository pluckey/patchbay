"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import type { WorkspaceNode, Connection, Viewport, Cell } from "@/kernel/entities"
import { loadWorkspace } from "@/client/domain/use-cases/load-workspace"
import { saveWorkspace } from "@/client/domain/use-cases/save-workspace"
import type { StoragePort } from "@/client/domain/ports/storage-port"
import type { DeletionManifestPort } from "@/client/domain/ports/deletion-manifest-port"

type UseWorkspacePersistenceArgs = {
  storage: StoragePort
  deletionManifest: DeletionManifestPort
  getViewport: () => Viewport
}

export function useWorkspacePersistence({ storage, deletionManifest, getViewport }: UseWorkspacePersistenceArgs) {
  const [nodes, setNodes] = useState<WorkspaceNode[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [cells, setCells] = useState<Cell[]>([])
  const [initialViewport, setInitialViewport] = useState<Viewport | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const nodesRef = useRef(nodes)
  const connectionsRef = useRef(connections)
  const cellsRef = useRef(cells)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const getViewportRef = useRef(getViewport)
  const deletedIdsRef = useRef<string[]>([])
  const saveInFlightRef = useRef(false)
  const workspaceIdRef = useRef("")
  const workspaceNameRef = useRef("")

  nodesRef.current = nodes
  connectionsRef.current = connections
  cellsRef.current = cells
  getViewportRef.current = getViewport

  const isLoadedRef = useRef(false)

  // Load persisted deletion manifest on mount
  useEffect(() => {
    deletedIdsRef.current = deletionManifest.load()
  }, [])

  // Load on mount
  useEffect(() => {
    ;(async () => {
      const workspace = await loadWorkspace(storage)
      workspaceIdRef.current = workspace.id
      workspaceNameRef.current = workspace.name
      setNodes(workspace.nodes)
      setConnections(workspace.connections)
      setCells(workspace.cells ?? [])
      setInitialViewport(workspace.viewport)
      isLoadedRef.current = true
      setIsLoaded(true)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const trackDeletion = useCallback((id: string) => {
    deletedIdsRef.current = [...deletedIdsRef.current, id]
    deletionManifest.save(deletedIdsRef.current)
  }, [])

  // Debounced save — includes deletion manifest
  const scheduleSave = useCallback((updatedNodes: WorkspaceNode[], updatedConnections?: Connection[], updatedCells?: Cell[]) => {
    if (!isLoadedRef.current) return
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(async () => {
      const ids = [...deletedIdsRef.current] // snapshot to avoid lost-update
      saveInFlightRef.current = true
      try {
        await saveWorkspace(storage, {
          id: workspaceIdRef.current,
          name: workspaceNameRef.current,
          nodes: updatedNodes,
          connections: updatedConnections ?? connectionsRef.current,
          cells: updatedCells ?? cellsRef.current,
          viewport: getViewportRef.current(),
        }, ids)
        // Remove only the delivered IDs — preserve any added during the save
        const deliveredSet = new Set(ids)
        deletedIdsRef.current = deletedIdsRef.current.filter((id) => !deliveredSet.has(id))
        deletionManifest.save(deletedIdsRef.current)
      } catch (e) {
        console.error(e)
      } finally {
        saveInFlightRef.current = false
      }
    }, 300)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll for externally-added nodes
  useEffect(() => {
    if (!isLoadedRef.current) return
    const interval = setInterval(() => {
      if (saveInFlightRef.current) return // skip while save is in-flight
      loadWorkspace(storage).then((serverState) => {
        const clientNodeIds = new Set(nodesRef.current.map((n) => n.id))
        const deletedSet = new Set(deletedIdsRef.current)
        const newNodes = serverState.nodes.filter((n) => !clientNodeIds.has(n.id) && !deletedSet.has(n.id))
        const clientConnIds = new Set(connectionsRef.current.map((c) => c.id))
        const newConns = serverState.connections.filter((c) => !clientConnIds.has(c.id) && !deletedSet.has(c.id))
        const clientCellIds = new Set(cellsRef.current.map((c) => c.id))
        const newCells = (serverState.cells ?? []).filter((c) => !clientCellIds.has(c.id) && !deletedSet.has(c.id))
        if (newNodes.length === 0 && newConns.length === 0 && newCells.length === 0) return
        setNodes((prev) => [...prev, ...newNodes])
        if (newConns.length > 0) {
          setConnections((prev) => [...prev, ...newConns])
        }
        if (newCells.length > 0) {
          setCells((prev) => [...prev, ...newCells])
        }
      }).catch(console.error)
    }, 2000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded])

  // Beforeunload flush — includes deletion manifest
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      storage.save({
        id: workspaceIdRef.current,
        name: workspaceNameRef.current,
        nodes: nodesRef.current,
        connections: connectionsRef.current,
        cells: cellsRef.current,
        viewport: getViewportRef.current(),
      }, deletedIdsRef.current)
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
    cells,
    setCells,
    nodesRef,
    connectionsRef,
    cellsRef,
    initialViewport,
    isLoaded,
    scheduleSave,
    trackDeletion,
  }
}
