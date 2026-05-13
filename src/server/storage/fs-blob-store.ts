import { readFile, writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { STORAGE_ROOT } from "./storage-root"

const BLOBS_DIR = path.join(STORAGE_ROOT, "blobs")
const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/

export function isValidBlobId(id: string): boolean {
  return SAFE_ID_PATTERN.test(id)
}

function assertValidId(id: string): void {
  if (!isValidBlobId(id)) {
    throw new Error(`Invalid blob ID: ${id}`)
  }
}

export async function storeBlob(id: string, buffer: Buffer): Promise<void> {
  assertValidId(id)
  await mkdir(BLOBS_DIR, { recursive: true })
  await writeFile(path.join(BLOBS_DIR, id), buffer)
}

export async function retrieveBlob(id: string): Promise<Buffer | null> {
  assertValidId(id)
  try {
    return await readFile(path.join(BLOBS_DIR, id))
  } catch {
    return null
  }
}

export async function deleteBlob(id: string): Promise<void> {
  assertValidId(id)
  try {
    await unlink(path.join(BLOBS_DIR, id))
  } catch {
    // Ignore if already deleted
  }
}
