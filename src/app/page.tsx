"use client"

import { useMemo, useState, useEffect } from "react"
import { CanvasProvider } from "@/client/ui/components/CanvasProvider"
import { AdaptersProvider } from "@/client/ui/app/adapters-context"
import { WorkspaceView } from "@/client/ui/components/WorkspaceView"
import { serverStorageAdapter } from "@/client/adapters/storage/server-storage-adapter"
import { serverBlobAdapter } from "@/client/adapters/storage/server-blob-adapter"
import { localStorageAdapter } from "@/client/adapters/storage/local-storage-adapter"
import { indexedDbBlobAdapter } from "@/client/adapters/storage/indexeddb-blob-adapter"
import { pdfRenderer } from "@/client/adapters/pdf/pdf-renderer"
import { jsEvaluator } from "@/client/adapters/execution/js-evaluator"
import { chatAdapter } from "@/client/adapters/chat/chat-adapter"
import { modelRosterAdapter } from "@/client/adapters/model-roster/model-roster-adapter"
import { aiExecutorAdapter } from "@/client/adapters/ai-executor/ai-executor-adapter"
import { migrateToServer } from "@/client/domain/use-cases/migrate-to-server"

export default function Home() {
  const [migrationComplete, setMigrationComplete] = useState(false)

  // Run migration at composition root before React tree renders workspace
  useEffect(() => {
    ;(async () => {
      try {
        const serverData = await serverStorageAdapter.load()
        if (!serverData || (serverData.nodes.length === 0 && serverData.connections.length === 0)) {
          const localData = await localStorageAdapter.load()
          if (localData && localData.nodes.length > 0) {
            await migrateToServer(localStorageAdapter, indexedDbBlobAdapter, serverStorageAdapter, serverBlobAdapter)
          }
        }
      } catch (e) {
        console.error("Migration failed:", e)
      }
      setMigrationComplete(true)
    })()
  }, [])

  const adapters = useMemo(() => ({
    storage: serverStorageAdapter,
    blobStorage: serverBlobAdapter,
    pdfRenderer,
    transformExecutor: jsEvaluator,
    chat: chatAdapter,
    modelRoster: modelRosterAdapter,
    aiExecutor: aiExecutorAdapter,
  }), [])

  if (!migrationComplete) return null

  return (
    <div className="w-screen h-screen">
      <AdaptersProvider adapters={adapters}>
        <CanvasProvider>
          <WorkspaceView />
        </CanvasProvider>
      </AdaptersProvider>
    </div>
  )
}
