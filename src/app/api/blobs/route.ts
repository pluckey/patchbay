import { storeBlob, isValidBlobId } from "@/server/storage/fs-blob-store"
import { nanoid } from "nanoid"
import { enforceRateLimit } from "@/lib/rate-limit"

// Patchbay's source kinds only ingest PDFs today (see
// src/client/source-kinds/pdf-source-kind.ts). Reject anything else by
// magic-byte signature — Content-Type headers can be lied about.
const MAX_BLOB_BYTES = 10 * 1024 * 1024
const PDF_MAGIC = "%PDF"

export async function POST(request: Request) {
  // 1. Rate limit before reading anything from the wire.
  const limited = await enforceRateLimit(request)
  if (limited) return limited

  try {
    const headerBlobId = request.headers.get("X-Blob-Id")
    if (headerBlobId && !isValidBlobId(headerBlobId)) {
      return new Response("Invalid blob ID", { status: 400 })
    }

    // 2. Reject oversize bodies by Content-Length before consuming them.
    //    Vercel serverless already caps at 4.5 MB; the explicit cap lets
    //    us issue a clear 413 instead of an edge-level generic one.
    const declared = parseInt(request.headers.get("content-length") ?? "0", 10)
    if (declared > MAX_BLOB_BYTES) {
      return new Response("Blob too large (max 10 MB)", { status: 413 })
    }

    const id = headerBlobId || nanoid()
    const buffer = Buffer.from(await request.arrayBuffer())

    if (buffer.length > MAX_BLOB_BYTES) {
      return new Response("Blob too large (max 10 MB)", { status: 413 })
    }

    // 3. Magic-byte PDF sniff. PDFs start with "%PDF" (any version).
    if (buffer.subarray(0, 4).toString("ascii") !== PDF_MAGIC) {
      return new Response("Only PDF uploads accepted", { status: 415 })
    }

    await storeBlob(id, buffer)
    return Response.json({ id }, { status: 201 })
  } catch (e) {
    return new Response(
      `Failed to store blob: ${e instanceof Error ? e.message : String(e)}`,
      { status: 500 },
    )
  }
}
