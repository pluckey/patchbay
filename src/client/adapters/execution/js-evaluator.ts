import type { TransformExecutorPort } from "@/client/domain/ports/transform-executor-port"
import type { TransformResult } from "@/kernel/entities"

const TIMEOUT_MS = 5000

export const jsEvaluator: TransformExecutorPort = {
  execute(code: string, input: unknown): Promise<TransformResult> {
    return new Promise((resolve) => {
      // Serialize input — strip non-cloneable properties (like pdf.js doc proxy)
      const serializableInput = makeSerializable(input)

      const worker = new Worker("/transform-worker.js")

      const timer = setTimeout(() => {
        worker.terminate()
        resolve({
          status: "error",
          message: `Transform timed out after ${TIMEOUT_MS / 1000}s — possible infinite loop.`,
        })
      }, TIMEOUT_MS)

      worker.onmessage = (e) => {
        clearTimeout(timer)
        worker.terminate()
        resolve(e.data as TransformResult)
      }

      worker.onerror = (e) => {
        clearTimeout(timer)
        worker.terminate()
        resolve({
          status: "error",
          message: e.message || "Worker execution failed.",
        })
      }

      worker.postMessage({ code, input: serializableInput })
    })
  },
}

/**
 * Strips non-cloneable values (functions, proxies) from input so it can be
 * sent to a Web Worker via postMessage (structured clone algorithm).
 * Preserves plain data: strings, numbers, booleans, arrays, plain objects.
 */
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
