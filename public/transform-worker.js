// Web Worker for executing user-written transform code in an isolated thread.
// Receives { code, input } messages, executes the code, and posts back the result.
// The worker can be terminated from the main thread if execution exceeds a timeout.
//
// Used by the LEGACY Transform node execution path (executePipelineGraph).
// Signal-field cells use a different code path (cell-evaluator on the main
// thread) per the source-kind-registry spec — see Design Note D3 there for
// the reasoning. After the source-kind-registry helper purge, this worker no
// longer injects any kind-specific helpers; legacy Transform code that
// referenced `pdf.allText` etc. needs to be rewritten using the same
// patterns the new cell pipeline uses (or migrated to a signal-field Code
// cell, which is the recommended path going forward).

self.onmessage = async function (e) {
  const { code, input } = e.data
  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
    const fn = new AsyncFunction("input", code)
    const result = await fn(input)
    self.postMessage({ status: "success", output: String(result ?? "") })
  } catch (err) {
    self.postMessage({ status: "error", message: String(err instanceof Error ? err.message : err) })
  }
}
