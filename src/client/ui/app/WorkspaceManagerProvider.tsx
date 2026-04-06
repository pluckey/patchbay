"use client"

import { useMemo } from "react"
import type { WorkspaceRegistryPort } from "@/client/domain/ports/workspace-registry-port"
import type { StoragePort } from "@/client/domain/ports/storage-port"
import type { DeletionManifestPort } from "@/client/domain/ports/deletion-manifest-port"
import type { Adapters } from "@/client/ui/app/adapters-context"
import { AdaptersProvider } from "@/client/ui/app/adapters-context"
import { WorkspaceManagerContext } from "./workspace-manager-context"
import { useWorkspaceManager } from "@/client/ui/hooks/use-workspace-manager"

type ScopedAdapters = {
  storage: StoragePort
  deletionManifest: DeletionManifestPort
}

type WorkspaceManagerProviderProps = {
  registryAdapter: WorkspaceRegistryPort
  sharedAdapters: Omit<Adapters, "storage" | "deletionManifest">
  createScopedAdapters: (workspaceId: string) => ScopedAdapters
  children: React.ReactNode
}

export function WorkspaceManagerProvider({
  registryAdapter,
  sharedAdapters,
  createScopedAdapters,
  children,
}: WorkspaceManagerProviderProps) {
  const manager = useWorkspaceManager(registryAdapter)

  const managerContextValue = useMemo(() => ({
    workspaces: manager.workspaces,
    activeId: manager.activeId!,
    switchTo: manager.switchTo,
    create: manager.create,
    remove: manager.remove,
    rename: manager.rename,
    registerFlush: manager.registerFlush,
  }), [manager.workspaces, manager.activeId, manager.switchTo, manager.create, manager.remove, manager.rename, manager.registerFlush])

  const scopedAdapters = useMemo<Adapters | null>(() => {
    if (!manager.activeId) return null
    const scoped = createScopedAdapters(manager.activeId)
    return {
      ...sharedAdapters,
      ...scoped,
    }
  }, [manager.activeId, sharedAdapters, createScopedAdapters])

  if (!manager.isLoaded || !manager.activeId || !scopedAdapters) return null

  return (
    <WorkspaceManagerContext.Provider value={managerContextValue}>
      <AdaptersProvider key={manager.activeId} adapters={scopedAdapters}>
        {children}
      </AdaptersProvider>
    </WorkspaceManagerContext.Provider>
  )
}
