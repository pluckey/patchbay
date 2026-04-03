import { storeBlob, isValidBlobId } from "@/server/storage/fs-blob-store"
import { nanoid } from "nanoid"

export async function POST(request: Request) {
  try {
    const headerBlobId = request.headers.get("X-Blob-Id")
    if (headerBlobId && !isValidBlobId(headerBlobId)) {
      return new Response("Invalid blob ID", { status: 400 })
    }
    const id = headerBlobId || nanoid()
    const buffer = Buffer.from(await request.arrayBuffer())
    await storeBlob(id, buffer)
    return Response.json({ id }, { status: 201 })
  } catch (e) {
    return new Response(
      `Failed to store blob: ${e instanceof Error ? e.message : String(e)}`,
      { status: 500 }
    )
  }
}
