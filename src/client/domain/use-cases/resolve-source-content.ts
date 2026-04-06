import type { WorkspaceNode, TransformResult, ResolvedInput } from "@/kernel/entities"
import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"
import type { PdfRendererPort } from "@/client/domain/ports/pdf-renderer-port"

export type ResolveSourceDeps = {
  blobStorage: BlobStoragePort
  pdfRenderer: PdfRendererPort
}

/**
 * Resolves a single legacy WorkspaceNode into its ResolvedInput shape.
 *
 * Used by:
 * - The legacy pipeline (resolveAndExecute in execute-pipeline.ts) to feed
 *   Transform nodes their structured inputs.
 * - The signal-field cascade (executeCascade) to feed Code/AI cells when an
 *   upstream connection points to a legacy PdfNode or MarkdownNode.
 *
 * Pure-ish: deterministic given the same node + blob contents. Reads through
 * BlobStoragePort and PdfRendererPort for PDF text extraction. Markdown nodes
 * are resolved synchronously from their `content` field.
 */
export async function resolveSourceContent(
  sourceNode: WorkspaceNode,
  deps: ResolveSourceDeps,
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

  if (sourceNode.type === "ai-transform") {
    if (sourceNode.result?.status === "success") {
      return { text: sourceNode.result.output, type: "derived" as const }
    }
    return { text: "", type: "derived" as const }
  }

  return { text: "", type: "derived" as const }
}
