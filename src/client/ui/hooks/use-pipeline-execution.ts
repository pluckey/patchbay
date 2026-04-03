"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { WorkspaceNode, Connection, TransformResult } from "@/kernel/entities"
import type { TransformExecutorPort } from "@/client/domain/ports/transform-executor-port"
import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"
import type { PdfRendererPort } from "@/client/domain/ports/pdf-renderer-port"
import { executePipelineGraph } from "@/client/domain/use-cases/execute-pipeline-graph"
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
  const nodesRef = useRef(nodes)
  const connectionsRef = useRef(connections)
  nodesRef.current = nodes
  connectionsRef.current = connections

  const executeAll = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    // Check if there are any active transforms
    const hasActive = nodes.some((n) =>
      n.type === "transform" && connections.some((c) => c.targetId === n.id)
    )

    if (!hasActive) {
      setPipelineResults(EMPTY_RESULTS)
      return
    }

    // Set running state for all outgoing targets
    setPipelineResults((prev) => {
      const next = new Map(prev)
      for (const node of nodes) {
        if (node.type !== "transform") continue
        if (!connections.some((c) => c.targetId === node.id)) continue
        const outConns = connections.filter((c) => c.sourceId === node.id)
        for (const conn of outConns) {
          next.set(conn.targetId, { status: "running" })
        }
      }
      return next
    })

    const currentExecution = ++executionIdRef.current
    timerRef.current = setTimeout(async () => {
      timerRef.current = null
      const results = await executePipelineGraph(nodesRef.current, connectionsRef.current, deps)

      if (executionIdRef.current === currentExecution) {
        setPipelineResults(results)
      }
    }, 300)
  }, [nodes, connections, deps])

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
    const outgoingConns = connections.filter((c) => c.sourceId === transformNodeId)

    if (outgoingConns.length > 0) {
      setPipelineResults((prev) => {
        const next = new Map(prev)
        for (const conn of outgoingConns) {
          next.set(conn.targetId, { status: "running" })
        }
        return next
      })
    }

    resolveAndExecute(transformNodeId, nodes, connections, deps, pipelineResults).then((result) => {
      setPipelineResults((prev) => {
        const next = new Map(prev)
        for (const conn of outgoingConns) {
          next.set(conn.targetId, result)
        }
        return next
      })
    })
  }, [nodes, connections, deps, pipelineResults])

  return { pipelineResults, rerun }
}
