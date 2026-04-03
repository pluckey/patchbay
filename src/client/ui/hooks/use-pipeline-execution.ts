"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { WorkspaceNode, Connection, TransformResult } from "@/kernel/entities"
import type { TransformExecutorPort } from "@/client/domain/ports/transform-executor-port"
import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"
import type { PdfRendererPort } from "@/client/domain/ports/pdf-renderer-port"
import { resolveAndExecute } from "@/client/domain/use-cases/execute-pipeline"

type UsePipelineExecutionArgs = {
  nodes: WorkspaceNode[]
  connections: Connection[]
  deps: {
    transformExecutor: TransformExecutorPort
    blobStorage: BlobStoragePort
    pdfRenderer: PdfRendererPort
  }
}

const EMPTY_RESULTS = new Map<string, TransformResult>()

export function usePipelineExecution({ nodes, connections, deps }: UsePipelineExecutionArgs) {
  const [pipelineResults, setPipelineResults] = useState<Map<string, TransformResult>>(EMPTY_RESULTS)
  const executionIdRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const executeAll = useCallback(() => {
    // Clear any pending debounced execution
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    const transformNodes = nodes.filter((n) => n.type === "transform")
    const activePipelines = transformNodes.filter((tn) => {
      const hasIncoming = connections.some((c) => c.targetId === tn.id)
      const hasOutgoing = connections.some((c) => c.sourceId === tn.id)
      return hasIncoming && hasOutgoing
    })

    if (activePipelines.length === 0) {
      setPipelineResults(EMPTY_RESULTS)
      return
    }

    // Set running state for all active pipelines
    setPipelineResults((prev) => {
      const next = new Map(prev)
      for (const tn of activePipelines) {
        const outConn = connections.find((c) => c.sourceId === tn.id)
        if (outConn) next.set(outConn.targetId, { status: "running" })
      }
      return next
    })

    const currentExecution = ++executionIdRef.current
    timerRef.current = setTimeout(async () => {
      timerRef.current = null
      const results = new Map<string, TransformResult>()

      await Promise.all(
        activePipelines.map(async (transformNode) => {
          const outgoingConn = connections.find((c) => c.sourceId === transformNode.id)
          if (!outgoingConn) return

          const result = await resolveAndExecute(
            transformNode.id,
            nodes,
            connections,
            deps
          )
          results.set(outgoingConn.targetId, result)
        })
      )

      if (executionIdRef.current === currentExecution) {
        setPipelineResults(results)
      }
    }, 300)
  }, [nodes, connections, deps])

  // Auto-execute on changes
  useEffect(() => {
    executeAll()
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [executeAll])

  // Manual re-run of a single transform node
  const rerun = useCallback((transformNodeId: string) => {
    const outgoingConn = connections.find((c) => c.sourceId === transformNodeId)
    if (!outgoingConn) return

    // Set running state for this pipeline only
    setPipelineResults((prev) => {
      const next = new Map(prev)
      next.set(outgoingConn.targetId, { status: "running" })
      return next
    })

    resolveAndExecute(transformNodeId, nodes, connections, deps).then((result) => {
      setPipelineResults((prev) => {
        const next = new Map(prev)
        next.set(outgoingConn.targetId, result)
        return next
      })
    })
  }, [nodes, connections, deps])

  return { pipelineResults, rerun }
}
