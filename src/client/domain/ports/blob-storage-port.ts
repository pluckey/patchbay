export interface BlobStoragePort {
  store(blob: Blob): Promise<string>
  storeWithId(id: string, blob: Blob): Promise<void>
  retrieve(blobId: string): Promise<Blob | null>
  delete(blobId: string): Promise<void>
}
