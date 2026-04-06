import type { Workspace } from "@/kernel/entities"
import type { StoragePort } from "@/client/domain/ports/storage-port"
import { parseEnvelope, toWorkspace, toEnvelope } from "./storage-envelope"

export function createScopedServerStorageAdapter(workspaceId: string): StoragePort {
  const cacheKey = `context-canvas:workspace:${workspaceId}`

  return {
    async load(): Promise<Workspace | null> {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}`)
        if (res.status === 204 || !res.ok) {
          return loadFromLocalStorage(cacheKey)
        }
        const json = await res.text()
        const envelope = parseEnvelope(json)
        if (!envelope) return loadFromLocalStorage(cacheKey)
        return toWorkspace(envelope)
      } catch {
        return loadFromLocalStorage(cacheKey)
      }
    },

    async save(workspace: Workspace, deletedIds?: string[]): Promise<void> {
      const envelope = toEnvelope(workspace)
      const cacheJson = JSON.stringify(envelope)

      // Write-through cache: synchronous localStorage for beforeunload safety
      try {
        localStorage.setItem(cacheKey, cacheJson)
      } catch {
        // localStorage full or unavailable — continue with server save
      }

      // Server payload includes transient deletedIds for merge-on-save
      const serverPayload = deletedIds && deletedIds.length > 0
        ? JSON.stringify({ ...envelope, deletedIds })
        : cacheJson

      try {
        await fetch(`/api/workspaces/${workspaceId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: serverPayload,
        })
      } catch (e) {
        console.error("Failed to save workspace to server:", e)
      }
    },
  }
}

function loadFromLocalStorage(cacheKey: string): Workspace | null {
  try {
    const raw = localStorage.getItem(cacheKey)
    if (!raw) return null
    const envelope = parseEnvelope(raw)
    if (!envelope) return null
    return toWorkspace(envelope)
  } catch {
    return null
  }
}
