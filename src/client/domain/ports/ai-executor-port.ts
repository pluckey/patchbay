import type { SchemaField } from "@/kernel/entities"

export type AiExecuteRequest = {
  instruction: string
  userMessage: string
  provider: string
  model: string
  schema?: SchemaField[]
  schemaMode?: "single" | "collection"
  signal?: AbortSignal
}

export interface AiExecutorPort {
  execute(request: AiExecuteRequest): Promise<string>
}
