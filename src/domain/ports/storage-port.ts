import type { Workspace } from "../entities"

export interface StoragePort {
  load(): Workspace | null
  save(workspace: Workspace): void
}
