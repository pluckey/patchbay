export type DeletionManifestPort = {
  load(): string[]
  save(ids: string[]): void
}
