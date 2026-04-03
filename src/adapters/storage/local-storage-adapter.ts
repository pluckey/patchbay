import type { Workspace } from "@/domain/entities"
import type { StoragePort } from "@/domain/ports/storage-port"

const STORAGE_KEY = "context-canvas:workspace"
const VERSION = 1

type StorageEnvelope = {
  version: number
  nodes: Workspace["nodes"]
  viewport: Workspace["viewport"]
}

export const localStorageAdapter: StoragePort = {
  load(): Workspace | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null

      const parsed: StorageEnvelope = JSON.parse(raw)
      if (!parsed || !Array.isArray(parsed.nodes)) return null

      return {
        nodes: parsed.nodes,
        viewport: parsed.viewport ?? { x: 0, y: 0, zoom: 1 },
      }
    } catch {
      return null
    }
  },

  save(workspace: Workspace): void {
    try {
      const envelope: StorageEnvelope = {
        version: VERSION,
        nodes: workspace.nodes,
        viewport: workspace.viewport,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
    } catch (e) {
      console.error("Failed to save workspace:", e)
    }
  },
}
