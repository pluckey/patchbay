// Web Worker for executing user-written transform code in an isolated thread.
// Receives { code, input } messages, executes the code, and posts back the result.
// The worker can be terminated from the main thread if execution exceeds a timeout.

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
