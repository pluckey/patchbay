import type { DeletionManifestPort } from "@/client/domain/ports/deletion-manifest-port"

export function createScopedDeletionManifest(workspaceId: string): DeletionManifestPort {
  const key = `context-canvas:deletedIds:${workspaceId}`
  return {
    load(): string[] {
      try {
        const raw = localStorage.getItem(key)
        return raw ? JSON.parse(raw) : []
      } catch {
        return []
      }
    },
    save(ids: string[]): void {
      try {
        if (ids.length > 0) {
          localStorage.setItem(key, JSON.stringify(ids))
        } else {
          localStorage.removeItem(key)
        }
      } catch { /* ignore */ }
    },
  }
}
