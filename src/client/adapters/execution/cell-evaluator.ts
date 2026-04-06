import { sourceKindRegistry, SourceKindRegistryError } from "@/kernel/source-kinds"
// Side-effect import: ensures every source kind is registered before
// the evaluator runs.
import "@/client/source-kinds"
import type {
  CellExecutorPort,
  CellExecutorInput,
  CellExecutionResult,
} from "@/client/domain/ports/cell-executor-port"

const DEFAULT_TIMEOUT_MS = 5000

// Library handles cached per page lifetime, keyed by source kind. Subsequent
// cell executions that consume the same kind reuse the same library handle
// without re-fetching/re-parsing. The cache lives in module-level state and
// survives across cell executions in the same browser session.
const libraryHandles = new Map<string, unknown>()

async function getLibraryHandle(kind: string): Promise<unknown> {
  if (libraryHandles.has(kind)) return libraryHandles.get(kind)
  const contribution = sourceKindRegistry.get(kind)
  const handle = await contribution.loadLibrary()
  libraryHandles.set(kind, handle)
  return handle
}

/**
 * Cell evaluator — implements CellExecutorPort by running user code on the
 * main thread via `new AsyncFunction(...bindingNames, code)`.
 *
 * Main-thread execution (not a worker) is required because the source kind
 * registry exposes real library objects to cell code, and many libraries
 * (notably pdf.js) cannot run inside a Web Worker without nested-worker
 * support that Next.js dev mode doesn't reliably provide. See Design Note
 * D3 in the source-kind-registry spec for the full reasoning.
 *
 * Trade-off: a cell that does heavy synchronous CPU work will block the UI
 * for the duration of that work. pdf.js calls (getPage, getTextContent)
 * are async and use pdf.js's own internal worker, so they DON'T block the
 * UI. Only purely-synchronous user code in the cell body blocks. The
 * timeout becomes a soft warning rather than a hard kill — JavaScript
 * can't be interrupted from outside its own execution.
 */
export const cellEvaluator: CellExecutorPort = {
  async execute(
    code: string,
    inputs: Record<string, CellExecutorInput>,
    timeoutMs?: number,
  ): Promise<CellExecutionResult> {
    const timeout = timeoutMs ?? DEFAULT_TIMEOUT_MS
    const startTime = performance.now()

    try {
      // Build the bindings: for each input, look up its contribution, load
      // its library (memoized), parse the raw artifact, and put the result
      // under its connection label inside a single `input` object. Cell
      // authors then write `input.paper.getPage(1)` rather than `paper.getPage(1)`.
      //
      // The wrapper convention exists for three reasons:
      //   1. Labels can be any string — `"my pdf"`, `"page-1"`, etc. — which
      //      would crash `new AsyncFunction("my pdf", code)` with SyntaxError.
      //      Object keys accept any string.
      //   2. Top-level binds would shadow JS globals (Math, JSON, console, ...)
      //      whenever a label collides. The wrapper namespaces inputs.
      //   3. Matches the Monaco type-def shape (`declare const input: { ... }`)
      //      and the legacy worker convention (`new AsyncFunction("input", ...)`).
      const inputObj: Record<string, unknown> = {}
      for (const [label, entry] of Object.entries(inputs)) {
        const contribution = sourceKindRegistry.get(entry.kind)
        const libraryHandle = await getLibraryHandle(entry.kind)
        const parsed = await contribution.parse(entry.rawArtifact, libraryHandle)
        inputObj[label] = parsed
      }

      // Compile and execute the user code.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as any
      const fn = new AsyncFunction("input", code)

      // Soft timeout warning: if the cell takes longer than the timeout,
      // log a warning but don't kill execution (we can't — main thread).
      // Cell authors should avoid sync CPU loops.
      const timeoutWarning = setTimeout(() => {
        console.warn(`[cell-evaluator] cell execution exceeded ${timeout / 1000}s — possible infinite loop or heavy sync work`)
      }, timeout)

      try {
        const result = await fn(inputObj)
        clearTimeout(timeoutWarning)
        return {
          status: "success",
          output: String(result ?? ""),
          durationMs: Math.round(performance.now() - startTime),
        }
      } catch (err) {
        clearTimeout(timeoutWarning)
        throw err
      }
    } catch (err) {
      const message =
        err instanceof SourceKindRegistryError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err)
      return {
        status: "error",
        message,
        durationMs: Math.round(performance.now() - startTime),
      }
    }
  },
}
