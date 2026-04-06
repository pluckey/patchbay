/**
 * Idempotent migration from workspace version < 11 to version 11 (signal-field).
 * Adds cells, executionMode, and per-connection gate fields introduced by the
 * signal-field feature.
 *
 * Called on GET /api/workspaces/[id] before returning the workspace JSON.
 */
export function migrateToSignalField(workspaceJson: string): string {
  let data: Record<string, unknown>
  try {
    data = JSON.parse(workspaceJson)
  } catch {
    return workspaceJson
  }

  const version = typeof data.version === "number" ? data.version : 0
  if (version >= 11) {
    return workspaceJson
  }

  if (!Array.isArray(data.cells)) {
    data.cells = []
  }

  if (data.executionMode === undefined) {
    data.executionMode = "manual"
  }

  if (Array.isArray(data.connections)) {
    data.connections = (data.connections as Array<Record<string, unknown>>).map(
      (conn) => {
        if (conn.gate === undefined) {
          return { ...conn, gate: "open" }
        }
        return conn
      },
    )
  }

  data.version = 11

  return JSON.stringify(data)
}
