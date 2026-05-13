import { migrateToMultiWorkspace } from "@/server/storage/migrate-to-multi-workspace"
import { readManifest } from "@/server/storage/fs-manifest-store"
import { readWorkspaceById, writeWorkspaceById, withWorkspaceLock } from "@/server/storage/fs-workspace-store"
import { mergeWorkspace } from "@/server/storage/merge-workspace"
import { enforceRateLimit } from "@/lib/rate-limit"
import { DEMO_WORKSPACE } from "@/server/storage/demo-seed"

async function getActiveWorkspaceId(): Promise<string | null> {
  await migrateToMultiWorkspace()
  const manifest = await readManifest()
  return manifest?.activeId ?? null
}

export async function GET() {
  const activeId = await getActiveWorkspaceId()
  if (!activeId) return new Response(null, { status: 204 })

  const json = await readWorkspaceById(activeId)
  if (json === null) return new Response(null, { status: 204 })

  return new Response(json, {
    headers: { "Content-Type": "application/json" },
  })
}

export async function PUT(request: Request) {
  const limited = await enforceRateLimit(request)
  if (limited) return limited
  try {
    const activeId = await getActiveWorkspaceId()
    if (!activeId) return new Response("No active workspace", { status: 404 })

    // Legacy single-workspace shim — block writes when the active workspace
    // is the seeded demo so the public deployment stays pristine.
    if (activeId === DEMO_WORKSPACE.id) {
      return Response.json(
        {
          error:
            "The seeded demo workspace is read-only on this deployment. Fork the repo (https://github.com/pluckey/patchbay) to run unrestricted.",
        },
        { status: 403 },
      )
    }

    const { deletedIds = [], ...envelope } = JSON.parse(await request.text())

    await withWorkspaceLock(async () => {
      const diskRaw = await readWorkspaceById(activeId)
      const disk = diskRaw ? JSON.parse(diskRaw) : null
      const merged = disk
        ? mergeWorkspace(envelope, disk, deletedIds)
        : envelope
      await writeWorkspaceById(activeId, JSON.stringify(merged))
    })

    return new Response(null, { status: 204 })
  } catch (e) {
    return new Response(
      `Failed to save workspace: ${e instanceof Error ? e.message : String(e)}`,
      { status: 500 }
    )
  }
}
