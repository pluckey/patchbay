import type { StoragePort } from "../ports/storage-port"
import type { BlobStoragePort } from "../ports/blob-storage-port"
import type { WorkspaceNode } from "@/kernel/entities"

export async function migrateToServer(
  oldStorage: StoragePort,
  oldBlobStorage: BlobStoragePort,
  newStorage: StoragePort,
  newBlobStorage: BlobStoragePort
): Promise<boolean> {
  const workspace = await oldStorage.load()
  if (!workspace) return false

  // Transfer blobs for PDF nodes
  const pdfNodes = workspace.nodes.filter(
    (n): n is Extract<WorkspaceNode, { type: "pdf" }> => n.type === "pdf"
  )

  for (const node of pdfNodes) {
    try {
      const blob = await oldBlobStorage.retrieve(node.blobId)
      if (blob) {
        await newBlobStorage.storeWithId(node.blobId, blob)
      }
    } catch (e) {
      console.error(`Failed to migrate blob ${node.blobId}:`, e)
    }
  }

  // Transfer workspace
  await newStorage.save(workspace)
  return true
}
