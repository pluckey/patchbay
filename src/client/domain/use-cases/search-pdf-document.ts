import type { PdfDocument } from "@/kernel/entities"
import type { PdfRendererPort } from "@/client/domain/ports/pdf-renderer-port"

export type PageMatchResult = {
  page: number
  count: number
}

/**
 * Search all pages of a PDF document for text matches.
 * Calls port.getPageText per page — the port provides the primitive,
 * this use case provides the orchestration.
 */
export async function searchPdfDocument(
  port: PdfRendererPort,
  doc: PdfDocument,
  query: string,
  onProgress?: (results: PageMatchResult[]) => void
): Promise<PageMatchResult[]> {
  if (!query.trim()) return []

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(escaped, "gi")
  const results: PageMatchResult[] = []

  for (let page = 1; page <= doc.numPages; page++) {
    const text = await port.getPageText(doc, page)
    const matches = text.match(regex)
    const count = matches?.length ?? 0
    if (count > 0) {
      results.push({ page, count })
    }
    onProgress?.(results)
  }

  return results
}
