import type { WorkspaceNode, TransformResult, ResolvedInput } from "@/kernel/entities"
import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"
import type { PdfRendererPort } from "@/client/domain/ports/pdf-renderer-port"

export type ResolveSourceDeps = {
  blobStorage: BlobStoragePort
  pdfRenderer: PdfRendererPort
}

// Module-level cache of extracted PDF page text, keyed by blobId.
// Page text is immutable for the lifetime of a blobId — replacing the PDF
// produces a new blobId — so a cached pages array is always valid for its
// key. This avoids re-fetching the blob (100+ MB transfer) and re-extracting
// every page (1460 sequential getPageText calls for the Precalculus PDF) on
// every cascade trigger.
//
// First trigger pays the full cost (~5 s for a 1460-page PDF). Every
// subsequent trigger that resolves the same source completes in microseconds.
const pageTextCache = new Map<string, Promise<string[]>>()

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
    let pagesPromise = pageTextCache.get(sourceNode.blobId)
    if (!pagesPromise) {
      pagesPromise = extractPdfPages(sourceNode.blobId, deps)
      pageTextCache.set(sourceNode.blobId, pagesPromise)
      // If extraction fails, drop the cache entry so a future call can retry.
      pagesPromise.catch(() => pageTextCache.delete(sourceNode.blobId))
    }

    let pages: string[]
    try {
      pages = await pagesPromise
    } catch {
      return { text: "", type: "derived" as const }
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
  }

  if (sourceNode.type === "ai-transform") {
    if (sourceNode.result?.status === "success") {
      return { text: sourceNode.result.output, type: "derived" as const }
    }
    return { text: "", type: "derived" as const }
  }

  return { text: "", type: "derived" as const }
}

/**
 * Fetches a PDF blob and extracts text from every page in parallel.
 *
 * Cached at the call site keyed by blobId so this only runs once per
 * blob lifetime, regardless of how many cascade triggers consume the
 * resolved input.
 *
 * Parallelism: pdf.js exposes a single worker per document but the worker's
 * message queue handles concurrent getTextContent calls without per-call
 * round-trip latency. Issuing all page requests up-front lets the worker
 * stream results back as fast as it can produce them, instead of waiting
 * for each individual await to schedule the next request.
 */
async function extractPdfPages(blobId: string, deps: ResolveSourceDeps): Promise<string[]> {
  const blob = await deps.blobStorage.retrieve(blobId)
  if (!blob) throw new Error(`blob ${blobId} not found`)
  const doc = await deps.pdfRenderer.loadDocument(blob)
  try {
    const pageNumbers = Array.from({ length: doc.numPages }, (_, i) => i + 1)
    return await Promise.all(pageNumbers.map((n) => deps.pdfRenderer.getPageText(doc, n)))
  } finally {
    await doc.destroy()
  }
}
