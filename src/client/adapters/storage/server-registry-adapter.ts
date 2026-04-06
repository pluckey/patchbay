import type { WorkspaceRef } from "@/kernel/entities"
import type { WorkspaceRegistryPort } from "@/client/domain/ports/workspace-registry-port"

const ACTIVE_ID_KEY = "context-canvas:activeWorkspaceId"

export const serverRegistryAdapter: WorkspaceRegistryPort = {
  async list(): Promise<WorkspaceRef[]> {
    try {
      const res = await fetch("/api/workspaces")
      const manifest = await res.json()
      return manifest.workspaces
    } catch {
      return []
    }
  },

  async getActiveId(): Promise<string> {
    // Fast path: check localStorage first for instant reload
    try {
      const cached = localStorage.getItem(ACTIVE_ID_KEY)
      if (cached) return cached
    } catch { /* ignore */ }

    try {
      const res = await fetch("/api/workspaces")
      const manifest = await res.json()
      // Cache for next time
      try { localStorage.setItem(ACTIVE_ID_KEY, manifest.activeId) } catch { /* ignore */ }
      return manifest.activeId
    } catch {
      return ""
    }
  },

  async setActiveId(id: string): Promise<void> {
    try { localStorage.setItem(ACTIVE_ID_KEY, id) } catch { /* ignore */ }
    await fetch("/api/workspaces", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeId: id }),
    })
  },

  async create(name: string): Promise<WorkspaceRef> {
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    return res.json()
  },

  async remove(id: string): Promise<void> {
    await fetch(`/api/workspaces/${id}`, { method: "DELETE" })
  },

  async rename(id: string, name: string): Promise<void> {
    await fetch(`/api/workspaces/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
  },
}
