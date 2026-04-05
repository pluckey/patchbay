import { readWorkspace, writeWorkspace, withWorkspaceLock } from "@/server/storage/fs-workspace-store"
import { mergeWorkspace } from "@/server/storage/merge-workspace"

export async function POST(request: Request) {
  try {
    const { nodes, connections } = await request.json()
    const incoming = { nodes: nodes ?? [], connections: connections ?? [] }

    let addedNodes = 0
    let addedConns = 0

    await withWorkspaceLock(async () => {
      const raw = await readWorkspace()
      const disk = raw ? JSON.parse(raw) : { version: 9, nodes: [], connections: [], viewport: { x: 0, y: 0, zoom: 1 } }

      const existingNodeIds = new Set(disk.nodes.map((n: { id: string }) => n.id))
      const existingConnIds = new Set(disk.connections.map((c: { id: string }) => c.id))
      const newNodes = incoming.nodes.filter((n: { id: string }) => !existingNodeIds.has(n.id))
      const newConns = incoming.connections.filter((c: { id: string }) => !existingConnIds.has(c.id))

      if (newNodes.length === 0 && newConns.length === 0) return

      addedNodes = newNodes.length
      addedConns = newConns.length

      // Merge: incoming new items are added, existing disk items are preserved
      const merged = mergeWorkspace(
        { ...disk, nodes: [...disk.nodes, ...newNodes], connections: [...disk.connections, ...newConns] },
        disk
      )
      await writeWorkspace(JSON.stringify(merged))
    })

    return Response.json({ added: { nodes: addedNodes, connections: addedConns } })
  } catch (e) {
    return new Response(
      `Merge failed: ${e instanceof Error ? e.message : String(e)}`,
      { status: 500 }
    )
  }
}
