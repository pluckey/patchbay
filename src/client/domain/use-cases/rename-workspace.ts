import type { WorkspaceRegistryPort } from "@/client/domain/ports/workspace-registry-port"

export async function renameWorkspace(
  registry: WorkspaceRegistryPort,
  id: string,
  name: string
): Promise<void> {
  await registry.rename(id, name)
}
