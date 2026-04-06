import type { Cell } from "../entities/cell"
import type { Connection } from "../entities/connection"
import type { WorkspaceNode } from "../entities/workspace-node"

/**
 * Computes a deterministic hash of a cell's resolved-input *source state* for
 * staleness detection.
 *
 * Crucially, the hash is over **synchronously-available source state**, not
 * over the fully-resolved text projection. This is correct because staleness
 * is asking "did the source state change?", not "what is the resolved text?".
 *
 * Both `compute-staleness` (sync, no IO) and `execute-cascade` (async, with
 * blob/PDF resolution) consume this same hash function so they cannot drift.
 *
 * Inputs are sorted by connection label before serialisation to ensure
 * stability across insertion orders.
 */
export function hashCellInputs(
  cellId: string,
  cells: Cell[],
  connections: Connection[],
  nodes: WorkspaceNode[],
): string {
  const cellMap = new Map(cells.map((c) => [c.id, c]))
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  type Entry = [label: string, payload: unknown]
  const entries: Entry[] = []

  for (const conn of connections) {
    if (conn.targetId !== cellId) continue

    const sourceCell = cellMap.get(conn.sourceId)
    if (sourceCell) {
      const out = sourceCell.output
      const status = out?.status ?? "none"
      const text = out && out.status === "success" ? out.text : ""
      entries.push([conn.label, ["cell", sourceCell.type, status, text]])
      continue
    }

    const sourceNode = nodeMap.get(conn.sourceId)
    if (sourceNode) {
      if (sourceNode.type === "markdown") {
        entries.push([conn.label, ["markdown", sourceNode.content]])
      } else if (sourceNode.type === "pdf") {
        entries.push([
          conn.label,
          [
            "pdf",
            sourceNode.blobId,
            sourceNode.currentPage,
            sourceNode.totalPages,
            sourceNode.filename,
            // Annotations are an array of plain-data objects; insertion order
            // is creation order, deterministic across reads.
            sourceNode.annotations.map((a) => [
              a.label,
              a.page,
              a.region.x,
              a.region.y,
              a.region.width,
              a.region.height,
              a.text,
            ]),
          ],
        ])
      } else if (sourceNode.type === "ai-transform") {
        const r = sourceNode.result
        const status = r?.status ?? "none"
        const text = r && r.status === "success" ? r.output : ""
        entries.push([conn.label, ["ai-transform", status, text]])
      } else {
        // Other legacy node types (transform, chat) are not valid sources for
        // signal-field cells, but if they appear here we contribute their type
        // tag so the hash still distinguishes the source.
        entries.push([conn.label, [sourceNode.type]])
      }
      continue
    }

    // Source not found in either map — contribute a "missing" marker so
    // adding a missing source still changes the hash.
    entries.push([conn.label, ["missing"]])
  }

  entries.sort(([a], [b]) => a.localeCompare(b))
  return JSON.stringify(entries)
}
