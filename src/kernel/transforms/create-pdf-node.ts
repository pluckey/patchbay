import { nanoid } from "nanoid"
import type { Position, PdfNodeData } from "../entities"

export function createPdfNode(params: {
  blobId: string
  filename: string
  totalPages: number
  position: Position
}): PdfNodeData {
  const now = Date.now()
  return {
    id: nanoid(),
    type: "pdf",
    blobId: params.blobId,
    filename: params.filename,
    currentPage: 1,
    totalPages: params.totalPages,
    zoomLevel: 1.0,
    darkMode: false,
    position: params.position,
    dimensions: { width: 400, height: 500 },
    createdAt: now,
    updatedAt: now,
  }
}
