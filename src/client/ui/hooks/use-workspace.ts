"use client"

import { useCallback } from "react"
import type { Viewport } from "@/kernel/entities"
import { createNode } from "@/kernel/transforms/create-node"
import { updateNodeContent } from "@/kernel/transforms/update-node-content"
import { moveNode } from "@/kernel/transforms/move-node"
import { resizeNode } from "@/kernel/transforms/resize-node"
import { navigatePdfPage } from "@/kernel/transforms/navigate-pdf-page"
import { updatePdfZoom } from "@/kernel/transforms/update-pdf-zoom"
import { togglePdfDarkMode } from "@/kernel/transforms/toggle-pdf-dark-mode"
import { createConnection } from "@/kernel/transforms/create-connection"
import { removeConnection } from "@/kernel/transforms/remove-connection"
import { validateConnection } from "@/kernel/transforms/validate-connection"
import { createTransformNode } from "@/kernel/transforms/create-transform-node"
import { updateTransformCode } from "@/kernel/transforms/update-transform-code"
import { updateTransformTimeout } from "@/kernel/transforms/update-transform-timeout"
import { createChatNode } from "@/kernel/transforms/create-chat-node"
import { removeNodeWithCleanup } from "@/client/domain/use-cases/remove-node-with-cleanup"
import { sendChatMessage } from "@/client/domain/use-cases/send-chat-message"
import { useAdapters } from "@/client/ui/app/adapters-context"
import { useWorkspacePersistence } from "./use-workspace-persistence"
import { usePdfOperations } from "./use-pdf-operations"

type UseWorkspaceArgs = {
  getViewport: () => Viewport
}

export function useWorkspace({ getViewport }: UseWorkspaceArgs) {
  const { storage, blobStorage, pdfRenderer } = useAdapters()

  const {
    nodes, setNodes,
    connections, setConnections,
    nodesRef, connectionsRef,
    initialViewport, isLoaded,
    scheduleSave,
  } = useWorkspacePersistence({ storage, getViewport })

  const { handleUploadPdf } = usePdfOperations({ blobStorage, pdfRenderer, setNodes, scheduleSave })

  // --- Node CRUD ---
  const handleCreate = useCallback(
    (position: { x: number; y: number }) => {
      setNodes((prev) => {
        const node = createNode(position)
        const updated = [...prev, node]
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const handleContentChange = useCallback(
    (nodeId: string, content: string) => {
      setNodes((prev) => {
        const updated = updateNodeContent(prev, nodeId, content)
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const handleDelete = useCallback(
    (nodeId: string) => {
      setNodes((prev) => {
        const { updatedNodes, updatedConnections, blobIdsToDelete } = removeNodeWithCleanup(prev, nodeId, connectionsRef.current)
        for (const blobId of blobIdsToDelete) {
          blobStorage.delete(blobId).catch(console.error)
        }
        setConnections(updatedConnections)
        scheduleSave(updatedNodes, updatedConnections)
        return updatedNodes
      })
    },
    [setNodes, setConnections, connectionsRef, blobStorage, scheduleSave]
  )

  const handleMove = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      setNodes((prev) => {
        const updated = moveNode(prev, nodeId, position)
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const handleResize = useCallback(
    (nodeId: string, dimensions: { width: number; height: number }) => {
      setNodes((prev) => {
        const updated = resizeNode(prev, nodeId, dimensions)
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const handleNavigatePage = useCallback(
    (nodeId: string, page: number) => {
      setNodes((prev) => {
        const updated = navigatePdfPage(prev, nodeId, page)
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const handleZoomChange = useCallback(
    (nodeId: string, zoomLevel: number) => {
      setNodes((prev) => {
        const updated = updatePdfZoom(prev, nodeId, zoomLevel)
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const handleDarkModeToggle = useCallback(
    (nodeId: string) => {
      setNodes((prev) => {
        const updated = togglePdfDarkMode(prev, nodeId)
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  // --- Connection CRUD ---
  const handleCreateConnection = useCallback(
    (sourceId: string, targetId: string): boolean => {
      const validation = validateConnection(connectionsRef.current, nodesRef.current, sourceId, targetId)
      if (!validation.valid) return false

      const conn = createConnection(sourceId, targetId)
      setConnections((prev) => {
        const updated = [...prev, conn]
        scheduleSave(nodesRef.current, updated)
        return updated
      })
      return true
    },
    [setConnections, connectionsRef, nodesRef, scheduleSave]
  )

  const handleRemoveConnection = useCallback(
    (connectionId: string) => {
      setConnections((prev) => {
        const updated = removeConnection(prev, connectionId)
        scheduleSave(nodesRef.current, updated)
        return updated
      })
    },
    [setConnections, nodesRef, scheduleSave]
  )

  const handleCreatePipeline = useCallback(
    (sourceId: string, targetId: string) => {
      const sourceNode = nodesRef.current.find((n) => n.id === sourceId)
      const targetNode = nodesRef.current.find((n) => n.id === targetId)
      if (!sourceNode || !targetNode) return

      const midX = (sourceNode.position.x + targetNode.position.x) / 2
      const midY = (sourceNode.position.y + targetNode.position.y) / 2
      const transformNode = createTransformNode({ x: midX, y: midY })

      const conn1 = createConnection(sourceId, transformNode.id)
      const conn2 = createConnection(transformNode.id, targetId)

      setNodes((prev) => {
        const updated = [...prev, transformNode]
        const updatedConns = [...connectionsRef.current, conn1, conn2]
        setConnections(updatedConns)
        scheduleSave(updated, updatedConns)
        return updated
      })
    },
    [setNodes, setConnections, connectionsRef, nodesRef, scheduleSave]
  )

  const handleTransformCodeChange = useCallback(
    (nodeId: string, code: string) => {
      setNodes((prev) => {
        const updated = updateTransformCode(prev, nodeId, code)
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const handleTimeoutChange = useCallback(
    (nodeId: string, timeoutMs: number) => {
      setNodes((prev) => {
        const updated = updateTransformTimeout(prev, nodeId, timeoutMs)
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  // --- Chat ---
  const handleAddChatNode = useCallback(
    (position: { x: number; y: number }) => {
      setNodes((prev) => {
        const node = createChatNode(position)
        const updated = [...prev, node]
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const { chat } = useAdapters()

  const handleSendMessage = useCallback(
    async (nodeId: string, content: string, systemPrompt: string) => {
      const updates = sendChatMessage({
        nodeId,
        content,
        systemPrompt,
        nodes: nodesRef.current,
        chat,
      })

      for await (const update of updates) {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === update.nodeId && n.type === "chat"
              ? { ...n, messages: update.messages, updatedAt: Date.now() }
              : n
          )
        )
        if (update.type === "complete" || update.type === "error") {
          scheduleSave(nodesRef.current)
        }
      }
    },
    [setNodes, nodesRef, scheduleSave, chat]
  )

  return {
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
    handleTimeoutChange,
    handleZoomChange,
    handleDarkModeToggle,
    handleAddChatNode,
    handleSendMessage,
  }
}
