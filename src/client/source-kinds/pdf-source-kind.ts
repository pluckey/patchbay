import type { SourceKindContribution } from "@/kernel/source-kinds"
import type { PdfNodeData } from "@/kernel/entities"
import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"

interface PdfExtractDeps {
  blobStorage: BlobStoragePort
}

/**
 * PDF source kind.
 *
 * The cell author binds to the actual pdf.js Document object — no helpers,
 * no wrapping. Cell code calls `await pdf.getPage(1).then(p => p.getTextContent())`
 * exactly as documented in the pdf.js API.
 *
 * `loadLibrary` runs on the main thread (cell execution is main-thread per
 * Design Note D3 — see source-kind-registry spec for the full reasoning on
 * why we abandoned the in-worker pdf.js approach). It dynamically imports
 * `pdfjs-dist` via the standard ES module path, the same way the canvas
 * viewer's `pdf-renderer.ts` does. The pdf.js worker is configured to load
 * from `/pdf.worker.min.mjs` (already in `public/`).
 *
 * The raw artifact this contribution receives is an ArrayBuffer of the PDF
 * bytes, fetched on the main thread by the cascade via `extractFromNode`.
 */

// We type pdfjs as `unknown`/`any` here so the contribution module doesn't
// need to declare full pdfjs-dist types. The actual API surface the cell
// author sees is described by typeDefFragment below.
type PdfJsLibHandle = unknown

// pdf.js singleton — only loaded once per page lifetime.
let pdfjsPromise: Promise<unknown> | null = null

async function getPdfJs(): Promise<unknown> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      // Configure the worker source. The worker file is already in /public/
      // alongside the main pdf.js bundle. This is the same configuration
      // pdf-renderer.ts uses for the canvas viewer.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(pdfjs as any).GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
      return pdfjs
    })
  }
  return pdfjsPromise
}

export const pdfSourceKind: SourceKindContribution = {
  kind: "pdf",
  bindingName: "pdf",

  loadLibrary: async (): Promise<PdfJsLibHandle> => {
    return getPdfJs()
  },

  extractFromNode: async (node: unknown, deps: unknown): Promise<unknown> => {
    const pdfNode = node as PdfNodeData
    const { blobStorage } = deps as PdfExtractDeps
    const blob = await blobStorage.retrieve(pdfNode.blobId)
    if (!blob) {
      throw new Error(`PDF blob ${pdfNode.blobId} not found`)
    }
    return await blob.arrayBuffer()
  },

  parse: async (rawArtifact: unknown, libraryHandle: unknown) => {
    if (!(rawArtifact instanceof ArrayBuffer) && !(rawArtifact instanceof Uint8Array)) {
      throw new Error(`pdf source kind: expected ArrayBuffer or Uint8Array, got ${typeof rawArtifact}`)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfjs = libraryHandle as any
    const data = rawArtifact instanceof ArrayBuffer ? new Uint8Array(rawArtifact) : rawArtifact
    const loadingTask = pdfjs.getDocument({ data })
    const doc = await loadingTask.promise
    return doc
  },

  typeDefFragment: `/**
 * pdf.js Document object — the real thing the pdfjs-dist library returns
 * from getDocument().promise. Cell authors call methods on this directly:
 *
 *     const page = await pdf.getPage(1)
 *     const tc = await page.getTextContent()
 *     return tc.items.map(i => i.str).join(' ')
 *
 * For the full API surface see the pdf.js documentation. The shape below
 * is a working subset for IntelliSense.
 */
interface PdfJsDocument {
  /** Total number of pages in the document. */
  readonly numPages: number
  /** Get the metadata associated with the document. */
  getMetadata(): Promise<{ info: Record<string, unknown>; metadata: unknown }>
  /** Get a specific page by 1-indexed page number. */
  getPage(pageNumber: number): Promise<PdfJsPage>
  /** Get the document outline (table of contents). */
  getOutline(): Promise<PdfJsOutlineNode[] | null>
  /** Release the document and free its worker resources. */
  destroy(): Promise<void>
}

interface PdfJsPage {
  /** Page number (1-indexed). */
  readonly pageNumber: number
  /** Get the text content of this page. */
  getTextContent(): Promise<{
    items: Array<{
      str: string
      transform: number[]
      width: number
      height: number
      dir: string
    }>
  }>
  /** Get the viewport for this page at a given scale. */
  getViewport(params: { scale: number }): {
    width: number
    height: number
    transform: number[]
  }
}

interface PdfJsOutlineNode {
  title: string
  dest: string | unknown[] | null
  items?: PdfJsOutlineNode[]
}`,

  bindingTypeExpression: "PdfJsDocument",

  presentation: {
    label: "PDF",
    glyph: "pdf",
  },
}
