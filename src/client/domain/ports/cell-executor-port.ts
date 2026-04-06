/**
 * CellExecutorPort
 *
 * The signal-field cell pipeline's executor. Distinct from the legacy
 * TransformExecutorPort (which exists for the pre-signal-field Transform
 * node path and is frozen during phase 1). The cell executor knows nothing
 * about specific source kinds — it forwards a registry-shaped request to
 * the cell worker, which dispatches through the source kind registry.
 *
 * The cell worker is a module worker bundled by Next.js from
 * `src/client/workers/cell-worker.ts`. The worker has access to the same
 * source kind registry as the main thread (via the side-effect import in
 * the registration module).
 */

export interface CellExecutorInput {
  /** The source kind discriminator (e.g., "pdf", "markdown"). */
  readonly kind: string
  /**
   * The raw artifact this kind's parser will consume. Bytes (ArrayBuffer
   * or Uint8Array), strings, or any other postMessage-cloneable shape the
   * kind's contribution defines. May be a Transferable for zero-copy
   * (the executor uses Transferable transfer when possible).
   */
  readonly rawArtifact: unknown
}

export interface CellExecutionResult {
  status: "success" | "error" | "timed-out"
  output?: string
  message?: string
  durationMs: number
}

export interface CellExecutorPort {
  /**
   * Executes user code with the given inputs. The label key (e.g., "paper")
   * becomes the variable name the cell author writes in code. The kind tag
   * tells the worker which contribution to dispatch to for parsing.
   */
  execute(
    code: string,
    inputs: Record<string, CellExecutorInput>,
    timeoutMs?: number,
  ): Promise<CellExecutionResult>
}
