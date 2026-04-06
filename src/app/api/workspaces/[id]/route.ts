import { readWorkspaceById, writeWorkspaceById, deleteWorkspaceFile, withWorkspaceLock } from "@/server/storage/fs-workspace-store"
import { readManifest, writeManifest, withManifestLock } from "@/server/storage/fs-manifest-store"
import { mergeWorkspace } from "@/server/storage/merge-workspace"
import { migrateToMultiWorkspace } from "@/server/storage/migrate-to-multi-workspace"
import { migrateToSignalField } from "@/server/storage/migrate-to-signal-field"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const json = await readWorkspaceById(id)
    if (json === null) {
      return Response.json({ error: "Workspace not found" }, { status: 404 })
    }
    const migrated = migrateToSignalField(json)
    return new Response(migrated, {
      headers: { "Content-Type": "application/json" },
    })
  } catch (e) {
    return Response.json(
      { error: `Failed to read workspace: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { deletedIds = [], ...envelope } = JSON.parse(await request.text())

    await withWorkspaceLock(async () => {
      const diskRaw = await readWorkspaceById(id)
      const disk = diskRaw ? JSON.parse(diskRaw) : null
      const merged = disk
        ? mergeWorkspace(envelope, disk, deletedIds)
        : envelope
      await writeWorkspaceById(id, JSON.stringify(merged))
    })

    return new Response(null, { status: 204 })
  } catch (e) {
    return Response.json(
      { error: `Failed to save workspace: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    await migrateToMultiWorkspace()

    await withManifestLock(async () => {
      const manifest = await readManifest()
      if (!manifest) {
        throw new Error("Manifest not found")
      }

      if (manifest.workspaces.length <= 1) {
        throw Object.assign(new Error("Cannot delete the last workspace"), { statusCode: 409 })
      }

      manifest.workspaces = manifest.workspaces.filter((w) => w.id !== id)

      if (manifest.activeId === id) {
        manifest.activeId = manifest.workspaces[0].id
      }

      await writeManifest(manifest)
      await deleteWorkspaceFile(id)
    })

    return new Response(null, { status: 204 })
  } catch (e) {
    if (e instanceof Error && "statusCode" in e && (e as { statusCode: number }).statusCode === 409) {
      return Response.json({ error: e.message }, { status: 409 })
    }
    return Response.json(
      { error: `Failed to delete workspace: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const name = body.name
    if (typeof name !== "string" || name.trim().length === 0) {
      return Response.json(
        { error: "name is required and must be a non-empty string" },
        { status: 400 },
      )
    }

    const updatedRef = await withManifestLock(async () => {
      const manifest = await readManifest()
      if (!manifest) {
        throw new Error("Manifest not found")
      }

      const entry = manifest.workspaces.find((w) => w.id === id)
      if (!entry) {
        throw Object.assign(new Error("Workspace not found"), { statusCode: 404 })
      }

      entry.name = name.trim()
      entry.updatedAt = Date.now()

      await writeManifest(manifest)
      return { ...entry }
    })

    return Response.json(updatedRef)
  } catch (e) {
    if (e instanceof Error && "statusCode" in e && (e as { statusCode: number }).statusCode === 404) {
      return Response.json({ error: e.message }, { status: 404 })
    }
    return Response.json(
      { error: `Failed to rename workspace: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 },
    )
  }
}
