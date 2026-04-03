import type { TransformResult } from "@/kernel/entities/connection"

export interface TransformExecutorPort {
  execute(code: string, input: unknown, timeoutMs?: number): Promise<TransformResult>
}
