import type { WorkspaceRef } from "@/kernel/entities"

export interface WorkspaceRegistryPort {
  list(): Promise<WorkspaceRef[]>
  getActiveId(): Promise<string>
  setActiveId(id: string): Promise<void>
  create(name: string): Promise<WorkspaceRef>
  remove(id: string): Promise<void>
  rename(id: string, name: string): Promise<void>
}
