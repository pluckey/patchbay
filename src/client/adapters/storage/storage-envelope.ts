import type { Workspace, WorkspaceNode, Connection } from "@/kernel/entities"

export const STORAGE_KEY = "context-canvas:workspace"
export const CURRENT_VERSION = 9

export type StorageEnvelope = {
  version: number
  nodes: WorkspaceNode[]
  connections: Connection[]
  viewport: Workspace["viewport"]
}

export function migrate(envelope: StorageEnvelope): StorageEnvelope {
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
    envelope.connections = (envelope.connections ?? []).map((c) => {
      const { id, sourceId, targetId, createdAt } = c
      return { id, sourceId, targetId, label: "input", createdAt }
    })
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
  // v5 → v6: add label to connections
  if (envelope.version < 6) {
    envelope.connections = (envelope.connections ?? []).map((c, i) => {
      const raw = c as Record<string, unknown>
      return { ...c, label: (typeof raw.label === "string" ? raw.label : `input_${i + 1}`) }
    })
    envelope.version = 6
  }
  // v6 → v7: add annotations array to PDF nodes
  if (envelope.version < 7) {
    envelope.nodes = envelope.nodes.map((node) => {
      if (node.type === "pdf") {
        const raw = node as Record<string, unknown>
        return {
          ...node,
          annotations: Array.isArray(raw.annotations) ? raw.annotations : [],
        }
      }
      return node
    })
    envelope.version = 7
  }
  // v7 → v8: add outputMode and schema to AI Transform nodes
  if (envelope.version < 8) {
    envelope.nodes = envelope.nodes.map((node) => {
      if (node.type === "ai-transform") {
        const raw = node as Record<string, unknown>
        const outputMode = raw.outputMode === "structured" ? "structured" as const : "text" as const
        return {
          ...node,
          outputMode,
          schema: Array.isArray(raw.schema) ? raw.schema : [],
        }
      }
      return node
    })
    envelope.version = 8
  }
  // v8 → v9: add schemaMode to AI Transform nodes
  if (envelope.version < 9) {
    envelope.nodes = envelope.nodes.map((node) => {
      if (node.type === "ai-transform") {
        const raw = node as Record<string, unknown>
        const schemaMode = raw.schemaMode === "collection" ? "collection" as const : "single" as const
        return { ...node, schemaMode }
      }
      return node
    })
    envelope.version = 9
  }
  return envelope
}

export function parseEnvelope(json: string): StorageEnvelope | null {
  try {
    const parsed: StorageEnvelope = JSON.parse(json)
    if (!parsed || !Array.isArray(parsed.nodes)) return null
    if (parsed.version < CURRENT_VERSION) {
      return migrate(parsed)
    }
    return parsed
  } catch {
    return null
  }
}

export function toWorkspace(envelope: StorageEnvelope): Workspace {
  return {
    nodes: envelope.nodes,
    connections: envelope.connections ?? [],
    viewport: envelope.viewport ?? { x: 0, y: 0, zoom: 1 },
  }
}

export function toEnvelope(workspace: Workspace): StorageEnvelope {
  return {
    version: CURRENT_VERSION,
    nodes: workspace.nodes,
    connections: workspace.connections,
    viewport: workspace.viewport,
  }
}
