"use client"

import { useCallback } from "react"
import type { WorkspaceNode } from "@/kernel/entities"
import { uploadPdf } from "@/client/domain/use-cases/upload-pdf"
import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"
import type { PdfRendererPort } from "@/client/domain/ports/pdf-renderer-port"

type UsePdfOperationsArgs = {
  blobStorage: BlobStoragePort
  pdfRenderer: PdfRendererPort
  setNodes: React.Dispatch<React.SetStateAction<WorkspaceNode[]>>
  scheduleSave: (nodes: WorkspaceNode[]) => void
}

export function usePdfOperations({ blobStorage, pdfRenderer, setNodes, scheduleSave }: UsePdfOperationsArgs) {
  const handleUploadPdf = useCallback(
    async (file: File, position: { x: number; y: number }): Promise<{ ok: true } | { ok: false; reason: string }> => {
      const result = await uploadPdf(file, position, { blobStorage, pdfRenderer })

      if (!result.ok) {
        return { ok: false, reason: result.reason }
      }

      setNodes((prev) => {
        const updated = [...prev, result.node]
        scheduleSave(updated)
        return updated
      })
      return { ok: true }
    },
    [blobStorage, pdfRenderer, setNodes, scheduleSave]
  )

  return { handleUploadPdf }
}
