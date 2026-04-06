import { createDefaultWorkspace } from "@/kernel/transforms"
import type { Workspace } from "@/kernel/entities"
import type { StoragePort } from "../ports/storage-port"

export async function loadWorkspace(storage: StoragePort): Promise<Workspace> {
  return (await storage.load()) ?? createDefaultWorkspace()
}
