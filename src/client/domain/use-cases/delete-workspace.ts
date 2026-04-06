import type { WorkspaceRegistryPort } from "@/client/domain/ports/workspace-registry-port"

export async function deleteWorkspace(
  registry: WorkspaceRegistryPort,
  id: string
): Promise<{ ok: boolean; reason?: string }> {
  const workspaces = await registry.list()
  if (workspaces.length <= 1) {
    return { ok: false, reason: "Cannot delete the last workspace" }
  }
  await registry.remove(id)
  return { ok: true }
}
