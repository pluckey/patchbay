"use client"

import { useMemo } from "react"
import { CanvasProvider } from "@/client/ui/components/CanvasProvider"
import { AdaptersProvider } from "@/client/ui/app/adapters-context"
import { WorkspaceView } from "@/client/ui/components/WorkspaceView"
import { localStorageAdapter } from "@/client/adapters/storage/local-storage-adapter"
import { indexedDbBlobAdapter } from "@/client/adapters/storage/indexeddb-blob-adapter"
import { pdfRenderer } from "@/client/adapters/pdf/pdf-renderer"
import { jsEvaluator } from "@/client/adapters/execution/js-evaluator"

export default function Home() {
  const adapters = useMemo(() => ({
    storage: localStorageAdapter,
    blobStorage: indexedDbBlobAdapter,
    pdfRenderer,
    transformExecutor: jsEvaluator,
  }), [])

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
