import type { ModelRosterPort } from "@/client/domain/ports/model-roster-port"
import type { ModelRosterEntry } from "@/kernel/entities"

export const modelRosterAdapter: ModelRosterPort = {
  async getRoster(): Promise<ModelRosterEntry[]> {
    const response = await fetch("/api/models")

    if (!response.ok) {
      throw new Error(`Models API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    if (!Array.isArray(data.models)) {
      throw new Error("Invalid roster response: expected models array")
    }
    return data.models as ModelRosterEntry[]
  },
}
