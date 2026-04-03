export interface BlobStoragePort {
  store(blob: Blob): Promise<string>
  retrieve(blobId: string): Promise<Blob | null>
  delete(blobId: string): Promise<void>
}
