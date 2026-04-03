import type { Workspace } from "@/kernel/entities"

export interface StoragePort {
  load(): Workspace | null
  save(workspace: Workspace): void
}
