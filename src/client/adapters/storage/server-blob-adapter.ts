import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"
import { nanoid } from "nanoid"

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
      const res = await fetch(`/api/blobs/${blobId}`)
      if (!res.ok) return null
      return await res.blob()
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
