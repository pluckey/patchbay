import { readWorkspace, writeWorkspace, withWorkspaceLock } from "@/server/storage/fs-workspace-store"
import { mergeWorkspace } from "@/server/storage/merge-workspace"

export async function GET() {
  const json = await readWorkspace()
  if (json === null) {
    return new Response(null, { status: 204 })
  }
  return new Response(json, {
    headers: { "Content-Type": "application/json" },
  })
}

export async function PUT(request: Request) {
  try {
    const incoming = JSON.parse(await request.text())
    const deletedIds: string[] = incoming.deletedIds ?? []
    delete incoming.deletedIds

    await withWorkspaceLock(async () => {
      const diskRaw = await readWorkspace()
      const disk = diskRaw ? JSON.parse(diskRaw) : null
      const merged = disk
        ? mergeWorkspace(incoming, disk, deletedIds)
        : incoming
      await writeWorkspace(JSON.stringify(merged))
    })

    return new Response(null, { status: 204 })
  } catch (e) {
    return new Response(
      `Failed to save workspace: ${e instanceof Error ? e.message : String(e)}`,
      { status: 500 }
    )
  }
}
