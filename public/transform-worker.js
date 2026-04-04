// Web Worker for executing user-written transform code in an isolated thread.
// Receives { code, input } messages, executes the code, and posts back the result.
// The worker can be terminated from the main thread if execution exceeds a timeout.

// ---------------------------------------------------------------------------
// PDF helpers — injected as `pdf` global available in user transform code.
// Source of truth: src/kernel/transforms/pdf-helpers.ts (keep in sync).
// ---------------------------------------------------------------------------

const pdf = {
  /** Check if an input is a PDF. */
  _isPdf(input) {
    return typeof input === "object" && input !== null && input.type === "pdf"
  },

  /** Pages from `from` to `to` (1-indexed, inclusive) as array of { page, text }. */
  pageRange(input, from, to) {
    if (!this._isPdf(input)) return []
    return input.pages.slice(from - 1, to).map((text, i) => ({ page: from + i, text }))
  },

  /** Pages surrounding currentPage within `radius` as array of { page, text }. */
  surrounding(input, radius) {
    if (!this._isPdf(input)) return []
    const start = Math.max(1, input.currentPage - radius)
    const end = Math.min(input.totalPages, input.currentPage + radius)
    return this.pageRange(input, start, end)
  },

  /** All pages joined. */
  allText(input) {
    if (!this._isPdf(input)) return ""
    return input.pages.join("\n\n")
  },

  /** All annotation texts as an array. */
  annotationTexts(input) {
    if (!this._isPdf(input)) return []
    return input.annotations.map(a => a.text)
  },

  /** Total page count. */
  pageCount(input) {
    if (!this._isPdf(input)) return 0
    return input.totalPages
  },

  /** Text of the current page. */
  currentPageText(input) {
    if (!this._isPdf(input)) return ""
    return input.pages[input.currentPage - 1] ?? ""
  },
}

// ---------------------------------------------------------------------------
// Worker message handler
// ---------------------------------------------------------------------------

self.onmessage = async function (e) {
  const { code, input } = e.data
  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
    const fn = new AsyncFunction("input", "pdf", code)
    const result = await fn(input, pdf)
    self.postMessage({ status: "success", output: String(result ?? "") })
  } catch (err) {
    self.postMessage({ status: "error", message: String(err instanceof Error ? err.message : err) })
  }
}
