import type { TransformExecutorPort } from "@/client/domain/ports/transform-executor-port"
import type { TransformResult } from "@/kernel/entities"

const DEFAULT_TIMEOUT_MS = 5000

export const jsEvaluator: TransformExecutorPort = {
  execute(code: string, input: unknown, timeoutMs?: number): Promise<TransformResult> {
    const timeout = timeoutMs ?? DEFAULT_TIMEOUT_MS
    const startTime = performance.now()

    return new Promise((resolve) => {
      const serializableInput = makeSerializable(input)
      const worker = new Worker("/transform-worker.js")

      const timer = setTimeout(() => {
        worker.terminate()
        resolve({
          status: "error",
          message: `Transform timed out after ${timeout / 1000}s — possible infinite loop.`,
          durationMs: Math.round(performance.now() - startTime),
          timedOut: true,
        })
      }, timeout)

      worker.onmessage = (e) => {
        clearTimeout(timer)
        worker.terminate()
        const durationMs = Math.round(performance.now() - startTime)
        const data = e.data as { status: string; output?: string; message?: string }
        if (data.status === "success") {
          resolve({ status: "success", output: data.output ?? "", durationMs })
        } else {
          resolve({ status: "error", message: data.message ?? "Unknown error", durationMs })
        }
      }

      worker.onerror = (e) => {
        clearTimeout(timer)
        worker.terminate()
        resolve({
          status: "error",
          message: e.message || "Worker execution failed.",
          durationMs: Math.round(performance.now() - startTime),
        })
      }

      worker.postMessage({ code, input: serializableInput })
    })
  },
}

function makeSerializable(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value
  if (Array.isArray(value)) return value.map(makeSerializable)
  if (typeof value === "object") {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === "function") continue
      try {
        result[k] = makeSerializable(v)
      } catch {
        // Skip non-cloneable values
      }
    }
    return result
  }
  return undefined
}
