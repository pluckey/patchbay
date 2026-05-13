import { migrateToMultiWorkspace } from "@/server/storage/migrate-to-multi-workspace"
import { readManifest } from "@/server/storage/fs-manifest-store"
import { readWorkspaceById, writeWorkspaceById, withWorkspaceLock } from "@/server/storage/fs-workspace-store"
import { mergeWorkspace } from "@/server/storage/merge-workspace"
import { enforceRateLimit } from "@/lib/rate-limit"
import { DEMO_WORKSPACE } from "@/server/storage/demo-seed"

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request)
  if (limited) return limited
  try {
    await migrateToMultiWorkspace()
    const manifest = await readManifest()
    const activeId = manifest?.activeId
    if (!activeId) return new Response("No active workspace", { status: 404 })

    // Legacy single-workspace shim — same demo-immutability rule.
    if (activeId === DEMO_WORKSPACE.id) {
      return Response.json(
        {
          error:
            "The seeded demo workspace is read-only on this deployment. Fork the repo (https://github.com/pluckey/patchbay) to run unrestricted.",
        },
        { status: 403 },
      )
    }

    const { nodes, connections } = await request.json()
    const incoming = { nodes: nodes ?? [], connections: connections ?? [] }

    let addedNodes = 0
    let addedConns = 0

    await withWorkspaceLock(async () => {
      const raw = await readWorkspaceById(activeId)
      const disk = raw ? JSON.parse(raw) : { version: 10, nodes: [], connections: [], viewport: { x: 0, y: 0, zoom: 1 } }

      const existingNodeIds = new Set(disk.nodes.map((n: { id: string }) => n.id))
      const existingConnIds = new Set(disk.connections.map((c: { id: string }) => c.id))
      const newNodes = incoming.nodes.filter((n: { id: string }) => !existingNodeIds.has(n.id))
      const newConns = incoming.connections.filter((c: { id: string }) => !existingConnIds.has(c.id))

      if (newNodes.length === 0 && newConns.length === 0) return

      addedNodes = newNodes.length
      addedConns = newConns.length

      const merged = mergeWorkspace(
        { ...disk, nodes: [...disk.nodes, ...newNodes], connections: [...disk.connections, ...newConns] },
        disk
      )
      await writeWorkspaceById(activeId, JSON.stringify(merged))
    })

    return Response.json({ added: { nodes: addedNodes, connections: addedConns } })
  } catch (e) {
    return new Response(
      `Merge failed: ${e instanceof Error ? e.message : String(e)}`,
      { status: 500 }
    )
  }
}
