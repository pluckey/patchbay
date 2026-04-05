import type { Workspace } from "@/kernel/entities"
import type { StoragePort } from "@/client/domain/ports/storage-port"
import { STORAGE_KEY, parseEnvelope, toWorkspace, toEnvelope } from "./storage-envelope"

export const serverStorageAdapter: StoragePort = {
  async load(): Promise<Workspace | null> {
    try {
      const res = await fetch("/api/workspace")
      if (res.status === 204 || !res.ok) {
        return loadFromLocalStorage()
      }
      const json = await res.text()
      const envelope = parseEnvelope(json)
      if (!envelope) return loadFromLocalStorage()
      return toWorkspace(envelope)
    } catch {
      return loadFromLocalStorage()
    }
  },

  async save(workspace: Workspace, deletedIds?: string[]): Promise<void> {
    const envelope = toEnvelope(workspace)
    const cacheJson = JSON.stringify(envelope)

    // Write-through cache: synchronous localStorage for beforeunload safety
    try {
      localStorage.setItem(STORAGE_KEY, cacheJson)
    } catch {
      // localStorage full or unavailable — continue with server save
    }

    // Server payload includes transient deletedIds for merge-on-save
    const serverPayload = deletedIds && deletedIds.length > 0
      ? JSON.stringify({ ...envelope, deletedIds })
      : cacheJson

    try {
      await fetch("/api/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: serverPayload,
      })
    } catch (e) {
      console.error("Failed to save workspace to server:", e)
    }
  },
}

function loadFromLocalStorage(): Workspace | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const envelope = parseEnvelope(raw)
    if (!envelope) return null
    return toWorkspace(envelope)
  } catch {
    return null
  }
}
