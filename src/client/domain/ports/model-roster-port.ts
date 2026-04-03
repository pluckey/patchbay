import type { ModelRosterEntry } from "@/kernel/entities"

export interface ModelRosterPort {
  getRoster(): Promise<ModelRosterEntry[]>
}
