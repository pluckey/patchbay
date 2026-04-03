import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"
import { nanoid } from "nanoid"

const DB_NAME = "context-canvas-blobs"
const STORE_NAME = "blobs"
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const indexedDbBlobAdapter: BlobStoragePort = {
  async store(blob: Blob): Promise<string> {
    const id = nanoid()
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      tx.objectStore(STORE_NAME).put({ id, blob, storedAt: Date.now() })
      tx.oncomplete = () => {
        db.close()
        resolve(id)
      }
      tx.onerror = () => {
        db.close()
        reject(tx.error)
      }
    })
  },

  async retrieve(blobId: string): Promise<Blob | null> {
    try {
      const db = await openDb()
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly")
        const request = tx.objectStore(STORE_NAME).get(blobId)
        request.onsuccess = () => {
          db.close()
          resolve(request.result?.blob ?? null)
        }
        request.onerror = () => {
          db.close()
          resolve(null)
        }
      })
    } catch {
      return null
    }
  },

  async delete(blobId: string): Promise<void> {
    try {
      const db = await openDb()
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readwrite")
        tx.objectStore(STORE_NAME).delete(blobId)
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => {
          db.close()
          resolve()
        }
      })
    } catch {
      console.error("Failed to delete blob:", blobId)
    }
  },
}
