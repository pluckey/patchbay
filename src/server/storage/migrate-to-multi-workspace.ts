import { nanoid } from "nanoid"
import { readManifest, writeManifest, withManifestLock } from "./fs-manifest-store"
import { readWorkspace, writeWorkspaceById } from "./fs-workspace-store"

/**
 * Idempotent lazy migration from single-workspace format to multi-workspace.
 * Called on first GET /api/workspaces. If manifest already exists, returns immediately.
 * If legacy workspace.json exists, migrates it into workspaces/{id}.json + manifest.
 * Legacy workspace.json is NOT removed (serves as backup).
 */
export async function migrateToMultiWorkspace(): Promise<void> {
  await withManifestLock(async () => {
    const existing = await readManifest()
    if (existing) return // already migrated

    const legacyJson = await readWorkspace()
    const id = nanoid()
    const now = Date.now()

    if (legacyJson) {
      // Migrate existing workspace data to new location
      await writeWorkspaceById(id, legacyJson)
    } else {
      // Fresh install — create an empty workspace
      const emptyWorkspace = JSON.stringify({
        version: 10,
        id,
        name: "Untitled",
        nodes: [],
        connections: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      })
      await writeWorkspaceById(id, emptyWorkspace)
    }

    await writeManifest({
      workspaces: [{ id, name: "Workspace 1", createdAt: now, updatedAt: now }],
      activeId: id,
    })
  })
}
