import type { WorkspaceNode, Connection, TransformResult } from "@/kernel/entities"
import type { TransformExecutorPort } from "@/client/domain/ports/transform-executor-port"
import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"
import type { PdfRendererPort } from "@/client/domain/ports/pdf-renderer-port"

type ExecutePipelineDeps = {
  transformExecutor: TransformExecutorPort
  blobStorage: BlobStoragePort
  pdfRenderer: PdfRendererPort
}

export async function executePipeline(
  transformNode: WorkspaceNode & { type: "transform" },
  sourceNode: WorkspaceNode,
  deps: ExecutePipelineDeps
): Promise<TransformResult> {
  if (sourceNode.type === "markdown") {
    const input = {
      text: sourceNode.content,
      type: "markdown" as const,
    }
    return deps.transformExecutor.execute(transformNode.transformCode, input)
  }

  if (sourceNode.type === "pdf") {
    let blob: Blob | null
    try {
      blob = await deps.blobStorage.retrieve(sourceNode.blobId)
    } catch {
      return { status: "error", message: "Failed to retrieve PDF blob." }
    }
    if (!blob) {
      return { status: "error", message: "PDF blob not found." }
    }

    const doc = await deps.pdfRenderer.loadDocument(blob)
    try {
      // Pre-extract all page texts so the worker has full access without the doc proxy
      const pages: string[] = []
      for (let i = 1; i <= doc.numPages; i++) {
        pages.push(await deps.pdfRenderer.getPageText(doc, i))
      }

      const input = {
        text: pages[sourceNode.currentPage - 1] ?? "",
        pages,
        type: "pdf" as const,
        currentPage: sourceNode.currentPage,
        totalPages: sourceNode.totalPages,
        filename: sourceNode.filename,
      }
      return await deps.transformExecutor.execute(transformNode.transformCode, input)
    } finally {
      await doc.destroy()
    }
  }

  return { status: "error", message: "Cannot use a transform node as a source." }
}

/**
 * Resolves the pipeline for a transform node: finds its source node via
 * incoming connections and executes the transform.
 */
export async function resolveAndExecute(
  transformNodeId: string,
  nodes: WorkspaceNode[],
  connections: Connection[],
  deps: ExecutePipelineDeps
): Promise<TransformResult> {
  const transformNode = nodes.find((n) => n.id === transformNodeId)
  if (!transformNode || transformNode.type !== "transform") {
    return { status: "error", message: "Transform node not found." }
  }

  const incomingConn = connections.find((c) => c.targetId === transformNodeId)
  if (!incomingConn) {
    return { status: "error", message: "No source connected." }
  }

  const sourceNode = nodes.find((n) => n.id === incomingConn.sourceId)
  if (!sourceNode) {
    return { status: "error", message: "Source node not found." }
  }

  return executePipeline(transformNode, sourceNode, deps)
}
