import type { WorkspaceNode, Connection, TransformResult } from "@/kernel/entities"
import type { TransformExecutorPort } from "@/client/domain/ports/transform-executor-port"
import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"
import type { PdfRendererPort } from "@/client/domain/ports/pdf-renderer-port"
import { resolveAndExecute } from "./execute-pipeline"

type ExecuteGraphDeps = {
  transformExecutor: TransformExecutorPort
  blobStorage: BlobStoragePort
  pdfRenderer: PdfRendererPort
}

/**
 * Executes all active transform pipelines in topological order.
 * Returns a map of target node IDs to their transform results.
 */
export async function executePipelineGraph(
  nodes: WorkspaceNode[],
  connections: Connection[],
  deps: ExecuteGraphDeps
): Promise<Map<string, TransformResult>> {
  const results = new Map<string, TransformResult>()

  // Active = any transform with at least one incoming connection
  const transformNodes = nodes.filter((n) => n.type === "transform")
  const activePipelines = transformNodes.filter((tn) =>
    connections.some((c) => c.targetId === tn.id)
  )

  if (activePipelines.length === 0) return results

  // Topological sort: execute transforms whose inputs are ready first
  const remaining = [...activePipelines]
  const executed = new Set<string>()

  while (remaining.length > 0) {
    const readyIdx = remaining.findIndex((tn) => {
      const incomingConns = connections.filter((c) => c.targetId === tn.id)
      return incomingConns.every((c) => {
        const sourceIsTarget = activePipelines.some((other) => {
          const otherOuts = connections.filter((oc) => oc.sourceId === other.id)
          return otherOuts.some((oc) => oc.targetId === c.sourceId)
        })
        return !sourceIsTarget || executed.has(c.sourceId)
      })
    })

    if (readyIdx === -1) break // Circular or unresolvable

    const transformNode = remaining.splice(readyIdx, 1)[0]

    const result = await resolveAndExecute(
      transformNode.id,
      nodes,
      connections,
      deps,
      results
    )

    // Store by transform node ID (for display in the transform node itself)
    results.set(transformNode.id, result)
    executed.add(transformNode.id)

    // Store by all downstream target IDs (for consumers)
    const outgoingConns = connections.filter((c) => c.sourceId === transformNode.id)
    for (const conn of outgoingConns) {
      results.set(conn.targetId, result)
      executed.add(conn.targetId)
    }
  }

  return results
}
