import type { WorkspaceNode, Connection, TransformResult, ResolvedInput } from "@/kernel/entities"
import type { TransformExecutorPort } from "@/client/domain/ports/transform-executor-port"
import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"
import type { PdfRendererPort } from "@/client/domain/ports/pdf-renderer-port"

type ExecutePipelineDeps = {
  transformExecutor: TransformExecutorPort
  blobStorage: BlobStoragePort
  pdfRenderer: PdfRendererPort
}

/**
 * Resolves a single source node into its content representation.
 */
async function resolveSourceContent(
  sourceNode: WorkspaceNode,
  deps: ExecutePipelineDeps,
  priorResults?: Map<string, TransformResult>
): Promise<ResolvedInput> {
  // Check if this node has derived content from a prior pipeline stage
  const derived = priorResults?.get(sourceNode.id)
  if (derived?.status === "success") {
    return { text: derived.output, type: "derived" as const }
  }

  if (sourceNode.type === "markdown") {
    return { text: sourceNode.content, type: "markdown" as const }
  }

  if (sourceNode.type === "pdf") {
    let blob: Blob | null
    try {
      blob = await deps.blobStorage.retrieve(sourceNode.blobId)
    } catch {
      return { text: "", type: "derived" as const }
    }
    if (!blob) {
      return { text: "", type: "derived" as const }
    }

    const doc = await deps.pdfRenderer.loadDocument(blob)
    try {
      const pages: string[] = []
      for (let i = 1; i <= doc.numPages; i++) {
        pages.push(await deps.pdfRenderer.getPageText(doc, i))
      }
      return {
        text: pages[sourceNode.currentPage - 1] ?? "",
        pages,
        type: "pdf" as const,
        currentPage: sourceNode.currentPage,
        totalPages: sourceNode.totalPages,
        filename: sourceNode.filename,
        annotations: sourceNode.annotations.map((a) => ({
          label: a.label,
          page: a.page,
          region: a.region,
          text: a.text,
        })),
      }
    } finally {
      await doc.destroy()
    }
  }

  return { text: "", type: "derived" as const }
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
