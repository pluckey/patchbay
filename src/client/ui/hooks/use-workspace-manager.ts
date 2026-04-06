"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import type { WorkspaceRef } from "@/kernel/entities"
import type { WorkspaceRegistryPort } from "@/client/domain/ports/workspace-registry-port"
import { deleteWorkspace } from "@/client/domain/use-cases/delete-workspace"
import { renameWorkspace } from "@/client/domain/use-cases/rename-workspace"

export function useWorkspaceManager(registry: WorkspaceRegistryPort) {
  const [workspaces, setWorkspaces] = useState<WorkspaceRef[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const flushRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    ;(async () => {
      const [list, serverActiveId] = await Promise.all([
        registry.list(),
        registry.getActiveId(),
      ])
      setWorkspaces(list)
      setActiveId(serverActiveId)
      setIsLoaded(true)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const registerFlush = useCallback((fn: () => void) => {
    flushRef.current = fn
  }, [])

  const switchTo = useCallback(async (targetId: string) => {
    if (flushRef.current) flushRef.current()
    setActiveId(targetId)
    registry.setActiveId(targetId).catch(console.error)
  }, [registry])

  const create = useCallback(async (name?: string): Promise<WorkspaceRef> => {
    const autoName = name || `Workspace ${workspaces.length + 1}`
    const ref = await registry.create(autoName)
    setWorkspaces((prev) => [...prev, ref])
    if (flushRef.current) flushRef.current()
    setActiveId(ref.id)
    registry.setActiveId(ref.id).catch(console.error)
    return ref
  }, [registry, workspaces.length])

  const remove = useCallback(async (id: string): Promise<{ ok: boolean; reason?: string }> => {
    const result = await deleteWorkspace(registry, id)
    if (!result.ok) return result
    const remaining = workspaces.filter((w) => w.id !== id)
    setWorkspaces(remaining)
    if (activeId === id && remaining.length > 0) {
      const newActiveId = remaining[0].id
      setActiveId(newActiveId)
      registry.setActiveId(newActiveId).catch(console.error)
    }
    return { ok: true }
  }, [registry, workspaces, activeId])

  const rename = useCallback(async (id: string, newName: string) => {
    await renameWorkspace(registry, id, newName)
    setWorkspaces((prev) =>
      prev.map((w) => w.id === id ? { ...w, name: newName, updatedAt: Date.now() } : w)
    )
  }, [registry])

  return {
    workspaces,
    activeId,
    isLoaded,
    switchTo,
    create,
    remove,
    rename,
    registerFlush,
  }
}
