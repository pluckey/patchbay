import { readWorkspace, writeWorkspace } from "@/server/storage/fs-workspace-store"

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
    const body = await request.text()
    await writeWorkspace(body)
    return new Response(null, { status: 204 })
  } catch (e) {
    return new Response(
      `Failed to save workspace: ${e instanceof Error ? e.message : String(e)}`,
      { status: 500 }
    )
  }
}
