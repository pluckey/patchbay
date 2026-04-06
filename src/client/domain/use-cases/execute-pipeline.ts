import type { WorkspaceNode, Connection, TransformResult, ResolvedInput } from "@/kernel/entities"
import type { TransformExecutorPort } from "@/client/domain/ports/transform-executor-port"
import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"
import type { PdfRendererPort } from "@/client/domain/ports/pdf-renderer-port"
import { resolveSourceContent } from "./resolve-source-content"

type ExecutePipelineDeps = {
  transformExecutor: TransformExecutorPort
  blobStorage: BlobStoragePort
  pdfRenderer: PdfRendererPort
}

/**
 * Resolves ALL incoming connections for a transform node, builds a named
 * input object keyed by connection label, and executes the transform.
 */
export async function resolveAndExecute(
  transformNodeId: string,
  nodes: WorkspaceNode[],
  connections: Connection[],
  deps: ExecutePipelineDeps,
  priorResults?: Map<string, TransformResult>
): Promise<TransformResult> {
  const transformNode = nodes.find((n) => n.id === transformNodeId)
  if (!transformNode || transformNode.type !== "transform") {
    return { status: "error", message: "Transform node not found.", durationMs: 0 }
  }

  const incomingConns = connections.filter((c) => c.targetId === transformNodeId)
  if (incomingConns.length === 0) {
    return { status: "error", message: "No source connected.", durationMs: 0 }
  }

  // Resolve all inputs keyed by connection label
  const input: Record<string, ResolvedInput> = {}
  for (const conn of incomingConns) {
    const sourceNode = nodes.find((n) => n.id === conn.sourceId)
    if (!sourceNode) {
      input[conn.label] = { text: "", type: "derived" as const }
      continue
    }
    input[conn.label] = await resolveSourceContent(sourceNode, deps, priorResults)
  }

  return deps.transformExecutor.execute(transformNode.transformCode, input, transformNode.timeoutMs)
}
