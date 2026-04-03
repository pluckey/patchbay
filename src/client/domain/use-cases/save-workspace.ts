import type { Workspace } from "@/kernel/entities"
import type { StoragePort } from "../ports/storage-port"

export async function saveWorkspace(
  storage: StoragePort,
  workspace: Workspace
): Promise<void> {
  await storage.save(workspace)
}
