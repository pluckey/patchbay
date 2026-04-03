import type { Workspace } from "../entities"
import type { StoragePort } from "../ports/storage-port"

export function saveWorkspace(
  storage: StoragePort,
  workspace: Workspace
): void {
  storage.save(workspace)
}
