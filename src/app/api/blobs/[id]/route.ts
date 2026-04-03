import { retrieveBlob, deleteBlob, isValidBlobId } from "@/server/storage/fs-blob-store"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!isValidBlobId(id)) {
    return new Response("Invalid blob ID", { status: 400 })
  }
  const buffer = await retrieveBlob(id)
  if (!buffer) {
    return new Response("Not found", { status: 404 })
  }
  return new Response(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/octet-stream" },
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!isValidBlobId(id)) {
    return new Response("Invalid blob ID", { status: 400 })
  }
  await deleteBlob(id)
  return new Response(null, { status: 204 })
}
