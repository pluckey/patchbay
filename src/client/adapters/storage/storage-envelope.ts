import { nanoid } from "nanoid"
import type { Workspace, WorkspaceNode, Connection, Cell } from "@/kernel/entities"

export const STORAGE_KEY = "context-canvas:workspace"
export const CURRENT_VERSION = 12

export type StorageEnvelope = {
  version: number
  id?: string
  name?: string
  nodes: WorkspaceNode[]
  connections: Connection[]
  viewport: Workspace["viewport"]
  cells?: Cell[]
  executionMode?: 'manual' | 'automatic'
}

/**
 * Pure migration: takes an envelope at any historical version and returns a
 * new envelope at CURRENT_VERSION. Each step returns a new object — no input
 * mutation, no shared references with prior steps.
 */
export function migrate(envelope: StorageEnvelope): StorageEnvelope {
  let current = envelope

  // v1 → v2: add type:'markdown' to all nodes that lack a type field
  if (current.version < 2) {
    current = {
      ...current,
      nodes: current.nodes.map((node) => {
        if (!("type" in node) || !(node as WorkspaceNode).type) {
          return { ...node, type: "markdown" as const, content: (node as Record<string, unknown>).content as string ?? "" }
        }
        return node
      }),
      version: 2,
    }
  }
  // v2 → v3: add connections array
  if (current.version < 3) {
    current = {
      ...current,
      connections: Array.isArray(current.connections) ? current.connections : [],
      version: 3,
    }
  }
  // v3 → v4: strip transformCode from connections (moved to transform nodes)
  if (current.version < 4) {
    current = {
      ...current,
      connections: (current.connections ?? []).map((c) => {
        const { id, sourceId, targetId, createdAt } = c
        return { id, sourceId, targetId, label: "input", createdAt, gate: 'open' as const }
      }),
      version: 4,
    }
  }
  // v4 → v5: add zoomLevel/darkMode to PDF nodes, timeoutMs to transform nodes
  if (current.version < 5) {
    current = {
      ...current,
      nodes: current.nodes.map((node) => {
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
      }),
      version: 5,
    }
  }
  // v5 → v6: add label to connections
  if (current.version < 6) {
    current = {
      ...current,
      connections: (current.connections ?? []).map((c, i) => {
        const raw = c as Record<string, unknown>
        return { ...c, label: (typeof raw.label === "string" ? raw.label : `input_${i + 1}`) }
      }),
      version: 6,
    }
  }
  // v6 → v7: add annotations array to PDF nodes
  if (current.version < 7) {
    current = {
      ...current,
      nodes: current.nodes.map((node) => {
        if (node.type === "pdf") {
          const raw = node as Record<string, unknown>
          return {
            ...node,
            annotations: Array.isArray(raw.annotations) ? raw.annotations : [],
          }
        }
        return node
      }),
      version: 7,
    }
  }
  // v7 → v8: add outputMode and schema to AI Transform nodes
  if (current.version < 8) {
    current = {
      ...current,
      nodes: current.nodes.map((node) => {
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
      }),
      version: 8,
    }
  }
  // v8 → v9: add schemaMode to AI Transform nodes
  if (current.version < 9) {
    current = {
      ...current,
      nodes: current.nodes.map((node) => {
        if (node.type === "ai-transform") {
          const raw = node as Record<string, unknown>
          const schemaMode = raw.schemaMode === "collection" ? "collection" as const : "single" as const
          return { ...node, schemaMode }
        }
        return node
      }),
      version: 9,
    }
  }
  // v9 → v10: stamp workspace id and name
  if (current.version < 10) {
    current = {
      ...current,
      id: current.id ?? nanoid(),
      name: current.name ?? "Workspace 1",
      version: 10,
    }
  }
  // v10 → v11: add cells, executionMode, and gate to connections
  if (current.version < 11) {
    current = {
      ...current,
      cells: Array.isArray(current.cells) ? current.cells : [],
      executionMode: current.executionMode ?? 'manual',
      connections: (current.connections ?? []).map((c) => {
        const raw = c as Record<string, unknown>
        return raw.gate ? c : { ...c, gate: 'open' as const }
      }),
      version: 11,
    }
  }
  // v11 → v12: rename connection.sourceHandle/targetHandle → sourcePort/targetPort.
  // Bob's review: the kernel entity should not echo xyflow's vocabulary. The
  // canvas adapter now translates between sourcePort/targetPort (kernel) and
  // sourceHandle/targetHandle (xyflow Edge API). Existing persisted edges
  // carry the old key names; this step rewrites them in place so the canvas
  // adapter still finds an attachment-point id when the workspace reloads.
  if (current.version < 12) {
    current = {
      ...current,
      connections: (current.connections ?? []).map((c) => {
        const raw = c as Record<string, unknown>
        if (raw.sourceHandle === undefined && raw.targetHandle === undefined) {
          return c
        }
        const next: Record<string, unknown> = { ...c }
        if (raw.sourceHandle !== undefined) {
          next.sourcePort = raw.sourceHandle
          delete next.sourceHandle
        }
        if (raw.targetHandle !== undefined) {
          next.targetPort = raw.targetHandle
          delete next.targetHandle
        }
        return next as unknown as Connection
      }),
      version: 12,
    }
  }

  return current
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
    id: envelope.id ?? nanoid(),
    name: envelope.name ?? "Untitled",
    nodes: envelope.nodes,
    connections: envelope.connections ?? [],
    viewport: envelope.viewport ?? { x: 0, y: 0, zoom: 1 },
    cells: envelope.cells ?? [],
    executionMode: envelope.executionMode ?? 'manual',
  }
}

export function toEnvelope(workspace: Workspace): StorageEnvelope {
  return {
    version: CURRENT_VERSION,
    id: workspace.id,
    name: workspace.name,
    nodes: workspace.nodes,
    connections: workspace.connections,
    viewport: workspace.viewport,
    cells: workspace.cells ?? [],
    executionMode: workspace.executionMode ?? 'manual',
  }
}
