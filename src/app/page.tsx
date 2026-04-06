"use client"

import { useMemo } from "react"
import { CanvasProvider } from "@/client/ui/components/CanvasProvider"
import { WorkspaceView } from "@/client/ui/components/WorkspaceView"
import { WorkspaceManagerProvider } from "@/client/ui/app/WorkspaceManagerProvider"
import { WorkspaceSidepanel } from "@/client/ui/components/WorkspaceSidepanel"
import { serverRegistryAdapter } from "@/client/adapters/storage/server-registry-adapter"
import { serverBlobAdapter } from "@/client/adapters/storage/server-blob-adapter"
import { pdfRenderer } from "@/client/adapters/pdf/pdf-renderer"
import { jsEvaluator } from "@/client/adapters/execution/js-evaluator"
import { chatAdapter } from "@/client/adapters/chat/chat-adapter"
import { modelRosterAdapter } from "@/client/adapters/model-roster/model-roster-adapter"
import { aiExecutorAdapter } from "@/client/adapters/ai-executor/ai-executor-adapter"
import { createScopedServerStorageAdapter } from "@/client/adapters/storage/scoped-server-storage-adapter"
import { createScopedDeletionManifest } from "@/client/adapters/storage/deletion-manifest"

export default function Home() {
  const createScopedAdapters = useMemo(() => (workspaceId: string) => ({
    storage: createScopedServerStorageAdapter(workspaceId),
    deletionManifest: createScopedDeletionManifest(workspaceId),
  }), [])

  const sharedAdapters = useMemo(() => ({
    blobStorage: serverBlobAdapter,
    pdfRenderer,
    transformExecutor: jsEvaluator,
    chat: chatAdapter,
    modelRoster: modelRosterAdapter,
    aiExecutor: aiExecutorAdapter,
  }), [])

  return (
    <div className="flex w-screen h-screen">
      <WorkspaceManagerProvider
        registryAdapter={serverRegistryAdapter}
        sharedAdapters={sharedAdapters}
        createScopedAdapters={createScopedAdapters}
      >
        <WorkspaceSidepanel />
        <div className="relative flex-1 min-w-0">
          <CanvasProvider>
            <WorkspaceView />
          </CanvasProvider>
        </div>
      </WorkspaceManagerProvider>
    </div>
  )
}
