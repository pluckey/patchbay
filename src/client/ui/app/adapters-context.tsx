"use client"

import { createContext, useContext } from "react"
import type { StoragePort } from "@/client/domain/ports/storage-port"
import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"
import type { PdfRendererPort } from "@/client/domain/ports/pdf-renderer-port"
import type { TransformExecutorPort } from "@/client/domain/ports/transform-executor-port"
import type { ChatPort } from "@/client/domain/ports/chat-port"
import type { ModelRosterPort } from "@/client/domain/ports/model-roster-port"
import type { AiExecutorPort } from "@/client/domain/ports/ai-executor-port"

export type Adapters = {
  storage: StoragePort
  blobStorage: BlobStoragePort
  pdfRenderer: PdfRendererPort
  transformExecutor: TransformExecutorPort
  chat: ChatPort
  modelRoster: ModelRosterPort
  aiExecutor: AiExecutorPort
}

const AdaptersContext = createContext<Adapters | null>(null)

export function AdaptersProvider({
  adapters,
  children,
}: {
  adapters: Adapters
  children: React.ReactNode
}) {
  return (
    <AdaptersContext.Provider value={adapters}>
      {children}
    </AdaptersContext.Provider>
  )
}

export function useAdapters(): Adapters {
  const ctx = useContext(AdaptersContext)
  if (!ctx) throw new Error("useAdapters must be used within AdaptersProvider")
  return ctx
}
