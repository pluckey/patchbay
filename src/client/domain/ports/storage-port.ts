import type { Workspace } from "@/kernel/entities"

export interface StoragePort {
  load(): Promise<Workspace | null>
  /**
   * Persist the workspace. Implementations must write to a synchronous local
   * fallback (e.g., localStorage) before performing any async operations.
   * This ensures data safety during beforeunload, where async work cannot
   * be awaited.
   */
  save(workspace: Workspace, deletedIds?: string[]): Promise<void>
}
