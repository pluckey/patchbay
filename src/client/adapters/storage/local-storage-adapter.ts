import type { Workspace, WorkspaceNode, Connection } from "@/kernel/entities"
import type { StoragePort } from "@/client/domain/ports/storage-port"

const STORAGE_KEY = "context-canvas:workspace"
const CURRENT_VERSION = 5

type StorageEnvelope = {
  version: number
  nodes: WorkspaceNode[]
  connections: Connection[]
  viewport: Workspace["viewport"]
}

function migrate(envelope: StorageEnvelope): StorageEnvelope {
  // v1 → v2: add type:'markdown' to all nodes that lack a type field
  if (envelope.version < 2) {
    envelope.nodes = envelope.nodes.map((node) => {
      if (!("type" in node) || !(node as WorkspaceNode).type) {
        return { ...node, type: "markdown" as const, content: (node as Record<string, unknown>).content as string ?? "" }
      }
      return node
    })
    envelope.version = 2
  }
  // v2 → v3: add connections array
  if (envelope.version < 3) {
    if (!Array.isArray(envelope.connections)) {
      envelope.connections = []
    }
    envelope.version = 3
  }
  // v3 → v4: strip transformCode from connections (moved to transform nodes)
  if (envelope.version < 4) {
    envelope.connections = (envelope.connections ?? []).map((c) => ({
      id: c.id,
      sourceId: c.sourceId,
      targetId: c.targetId,
      createdAt: c.createdAt,
    }))
    envelope.version = 4
  }
  // v4 → v5: add zoomLevel/darkMode to PDF nodes, timeoutMs to transform nodes
  if (envelope.version < 5) {
    envelope.nodes = envelope.nodes.map((node) => {
      if (node.type === "pdf") {
        const raw = node as Record<string, unknown>
        return {
          ...node,
          zoomLevel: (typeof raw.zoomLevel === "number" ? raw.zoomLevel : 1.0) as number,
          darkMode: (typeof raw.darkMode === "boolean" ? raw.darkMode : false) as boolean,
        }
      }
      if (node.type === "transform") {
        const raw = node as Record<string, unknown>
        return {
          ...node,
          timeoutMs: (typeof raw.timeoutMs === "number" ? raw.timeoutMs : 5000) as number,
        }
      }
      return node
    })
    envelope.version = 5
  }
  return envelope
}

export const localStorageAdapter: StoragePort = {
  load(): Workspace | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null

      let parsed: StorageEnvelope = JSON.parse(raw)
      if (!parsed || !Array.isArray(parsed.nodes)) return null

      // Run migrations
      if (parsed.version < CURRENT_VERSION) {
        parsed = migrate(parsed)
        // Persist the migrated data immediately
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
      }

      return {
        nodes: parsed.nodes,
        connections: parsed.connections ?? [],
        viewport: parsed.viewport ?? { x: 0, y: 0, zoom: 1 },
      }
    } catch {
      return null
    }
  },

  save(workspace: Workspace): void {
    try {
      const envelope: StorageEnvelope = {
        version: CURRENT_VERSION,
        nodes: workspace.nodes,
        connections: workspace.connections,
        viewport: workspace.viewport,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
    } catch (e) {
      console.error("Failed to save workspace:", e)
    }
  },
}
