import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"
import { nanoid } from "nanoid"

/**
 * Reads a blob via fetch + arrayBuffer + Blob constructor instead of
 * `await response.blob()`.
 *
 * Browser bug worked around: in Edge/Chromium, `Response.prototype.blob()`
 * fails with `TypeError: Failed to fetch` for chunked responses larger than
 * a few MB when the server has not set a Content-Length header. The same
 * response read via `arrayBuffer()` (or via `body.getReader()` and assembled
 * manually) works perfectly. The bytes ARE arriving — it is the Blob
 * materialization step inside the browser that breaks. Verified empirically
 * against the in-process /api/blobs/[id] route with a 112 MB PDF.
 *
 * `arrayBuffer()` is sync-friendly and produces the same Blob shape via the
 * `new Blob([buffer])` constructor without the broken code path.
 */
async function fetchBlob(url: string): Promise<Blob | null> {
  const res = await fetch(url)
  if (!res.ok) return null
  const buffer = await res.arrayBuffer()
  const contentType = res.headers.get("content-type") ?? "application/octet-stream"
  return new Blob([buffer], { type: contentType })
}

export const serverBlobAdapter: BlobStoragePort = {
  async store(blob: Blob): Promise<string> {
    const id = nanoid()
    const res = await fetch("/api/blobs", {
      method: "POST",
      headers: { "X-Blob-Id": id },
      body: blob,
    })
    if (!res.ok) {
      throw new Error(`Failed to store blob: ${res.status}`)
    }
    const { id: returnedId } = await res.json()
    return returnedId
  },

  async storeWithId(id: string, blob: Blob): Promise<void> {
    const res = await fetch("/api/blobs", {
      method: "POST",
      headers: { "X-Blob-Id": id },
      body: blob,
    })
    if (!res.ok) {
      throw new Error(`Failed to store blob with id ${id}: ${res.status}`)
    }
  },

  async retrieve(blobId: string): Promise<Blob | null> {
    try {
      return await fetchBlob(`/api/blobs/${blobId}`)
    } catch {
      return null
    }
  },

  async delete(blobId: string): Promise<void> {
    try {
      await fetch(`/api/blobs/${blobId}`, { method: "DELETE" })
    } catch {
      console.error("Failed to delete blob:", blobId)
    }
  },
}
