import type { StoragePort } from "@/client/domain/ports/storage-port"
import { STORAGE_KEY, CURRENT_VERSION, migrate, parseEnvelope, toWorkspace, toEnvelope } from "./storage-envelope"

export const localStorageAdapter: StoragePort = {
  async load(): Promise<import("@/kernel/entities").Workspace | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null

      const envelope = parseEnvelope(raw)
      if (!envelope) return null

      // Persist migrated data immediately if version changed
      if (envelope.version === CURRENT_VERSION) {
        const rewritten = JSON.stringify(envelope)
        if (rewritten !== raw) {
          localStorage.setItem(STORAGE_KEY, rewritten)
        }
      }

      return toWorkspace(envelope)
    } catch {
      return null
    }
  },

  // deletedIds is unused: localStorage is a local cache, not a merge endpoint.
  // The server adapter handles merge-aware saves; this adapter just caches state.
  async save(workspace): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toEnvelope(workspace)))
    } catch (e) {
      console.error("Failed to save workspace:", e)
    }
  },
}
