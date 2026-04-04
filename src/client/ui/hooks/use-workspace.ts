"use client"

import { useCallback, useState } from "react"
import type { Viewport, PdfRegion } from "@/kernel/entities"
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
import { updateConnectionLabel } from "@/kernel/transforms/update-connection-label"
import { createAnnotation } from "@/kernel/transforms/create-annotation"
import { deleteAnnotation } from "@/kernel/transforms/delete-annotation"
import { createChatNode } from "@/kernel/transforms/create-chat-node"
import { updateChatModel } from "@/kernel/transforms/update-chat-model"
import { removeNodeWithCleanup } from "@/client/domain/use-cases/remove-node-with-cleanup"
import { sendChatMessage } from "@/client/domain/use-cases/send-chat-message"
import { useAdapters } from "@/client/ui/app/adapters-context"
import { useWorkspacePersistence } from "./use-workspace-persistence"
import { usePdfOperations } from "./use-pdf-operations"
import { useModelRoster } from "./use-model-roster"

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
  const { roster } = useModelRoster()

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

      const conn = createConnection(sourceId, targetId, nodesRef.current, connectionsRef.current)
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
        const defaultModel = roster[0]
        const node = defaultModel
          ? createChatNode(position, defaultModel.provider, defaultModel.model)
          : createChatNode(position)
        const updated = [...prev, node]
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave, roster]
  )

  const handleAddTransformNode = useCallback(
    (position: { x: number; y: number }) => {
      setNodes((prev) => {
        const node = createTransformNode(position)
        const updated = [...prev, node]
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const { chat } = useAdapters()
  const [streamingNodeIds, setStreamingNodeIds] = useState<Set<string>>(new Set())

  const handleSendMessage = useCallback(
    async (nodeId: string, content: string, systemPrompt: string) => {
      setStreamingNodeIds((prev) => new Set(prev).add(nodeId))

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
          setStreamingNodeIds((prev) => {
            const next = new Set(prev)
            next.delete(nodeId)
            return next
          })
          scheduleSave(nodesRef.current)
        }
      }
    },
    [setNodes, nodesRef, scheduleSave, chat]
  )

  const handleModelChange = useCallback(
    (nodeId: string, provider: string, model: string) => {
      setNodes((prev) => {
        const updated = updateChatModel(prev, nodeId, provider, model)
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const handleResetChat = useCallback(
    (nodeId: string) => {
      setNodes((prev) => {
        const updated = prev.map((n) =>
          n.id === nodeId && n.type === "chat"
            ? { ...n, messages: [], updatedAt: Date.now() }
            : n
        )
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const handleAnnotationCreate = useCallback(
    (nodeId: string, page: number, region: PdfRegion, label: string, text: string) => {
      setNodes((prev) => {
        const updated = createAnnotation(prev, nodeId, page, region, label, text)
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const handleAnnotationDelete = useCallback(
    (nodeId: string, annotationId: string) => {
      setNodes((prev) => {
        const updated = deleteAnnotation(prev, nodeId, annotationId)
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const handleUpdateConnectionLabel = useCallback(
    (connectionId: string, label: string) => {
      setConnections((prev) => {
        const updated = updateConnectionLabel(prev, connectionId, label)
        scheduleSave(nodesRef.current, updated)
        return updated
      })
    },
    [setConnections, nodesRef, scheduleSave]
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
  }
}
