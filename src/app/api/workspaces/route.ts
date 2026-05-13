import { migrateToMultiWorkspace } from "@/server/storage/migrate-to-multi-workspace"
import { readManifest, writeManifest, withManifestLock } from "@/server/storage/fs-manifest-store"
import { writeWorkspaceById } from "@/server/storage/fs-workspace-store"
import { createWorkspaceRef } from "@/kernel/transforms"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function GET() {
  try {
    await migrateToMultiWorkspace()
    const manifest = await readManifest()
    return Response.json(manifest)
  } catch (e) {
    return Response.json(
      { error: `Failed to read workspaces: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request)
  if (limited) return limited
  try {
    const body = await request.json()
    const name = body.name
    if (typeof name !== "string" || name.trim().length === 0) {
      return Response.json(
        { error: "name is required and must be a non-empty string" },
        { status: 400 },
      )
    }

    const ref = createWorkspaceRef(name.trim())

    await writeWorkspaceById(
      ref.id,
      JSON.stringify({
        version: 10,
        id: ref.id,
        name: ref.name,
        nodes: [],
        connections: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      }),
    )

    await withManifestLock(async () => {
      const manifest = await readManifest()
      if (!manifest) {
        throw new Error("Manifest not found — call GET /api/workspaces first to initialize")
      }
      manifest.workspaces.push(ref)
      await writeManifest(manifest)
    })

    return Response.json(ref, { status: 201 })
  } catch (e) {
    return Response.json(
      { error: `Failed to create workspace: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  const limited = await enforceRateLimit(request)
  if (limited) return limited
  try {
    const body = await request.json()
    const { activeId } = body
    if (typeof activeId !== "string" || activeId.trim().length === 0) {
      return Response.json(
        { error: "activeId is required and must be a non-empty string" },
        { status: 400 },
      )
    }

    await withManifestLock(async () => {
      const manifest = await readManifest()
      if (!manifest) {
        throw new Error("Manifest not found")
      }
      manifest.activeId = activeId
      await writeManifest(manifest)
    })

    return new Response(null, { status: 204 })
  } catch (e) {
    return Response.json(
      { error: `Failed to update active workspace: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 },
    )
  }
}
