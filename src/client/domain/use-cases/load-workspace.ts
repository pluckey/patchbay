import { DEFAULT_WORKSPACE } from "@/kernel/entities"
import type { Workspace } from "@/kernel/entities"
import type { StoragePort } from "../ports/storage-port"

export function loadWorkspace(storage: StoragePort): Workspace {
  return storage.load() ?? DEFAULT_WORKSPACE
}
