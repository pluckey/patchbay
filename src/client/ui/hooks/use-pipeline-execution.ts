"use client"

import { useState, useEffect, useRef } from "react"
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

  useEffect(() => {
    // Find all transform nodes that have both an incoming and outgoing connection
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

    const currentExecution = ++executionIdRef.current
    const timeoutId = setTimeout(async () => {
      const results = new Map<string, TransformResult>()

      await Promise.all(
        activePipelines.map(async (transformNode) => {
          // Find the downstream target node
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

    return () => clearTimeout(timeoutId)
  }, [nodes, connections, deps])

  return { pipelineResults }
}
