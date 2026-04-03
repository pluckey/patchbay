import type { Position, PdfNodeData } from "@/kernel/entities"
import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"
import type { PdfRendererPort } from "@/client/domain/ports/pdf-renderer-port"
import { validatePdfUpload } from "@/kernel/transforms/validate-pdf-upload"
import { createPdfNode } from "@/kernel/transforms/create-pdf-node"

type UploadPdfResult =
  | { ok: true; node: PdfNodeData }
  | { ok: false; reason: string }

type UploadPdfPorts = {
  blobStorage: BlobStoragePort
  pdfRenderer: PdfRendererPort
}

export async function uploadPdf(
  file: File,
  position: Position,
  ports: UploadPdfPorts
): Promise<UploadPdfResult> {
  const validation = validatePdfUpload({ size: file.size, type: file.type })
  if (!validation.ok) {
    return { ok: false, reason: validation.reason }
  }

  let blobId: string
  try {
    blobId = await ports.blobStorage.store(file)
  } catch {
    return { ok: false, reason: "Failed to store the PDF file. Please try again." }
  }

  let totalPages: number
  try {
    const doc = await ports.pdfRenderer.loadDocument(file)
    totalPages = doc.numPages
    await doc.destroy()
  } catch {
    await ports.blobStorage.delete(blobId).catch(console.error)
    return { ok: false, reason: "Could not read the PDF file. It may be corrupted or password-protected." }
  }

  const node = createPdfNode({ blobId, filename: file.name, totalPages, position })
  return { ok: true, node }
}
