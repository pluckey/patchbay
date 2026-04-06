import type { SourceKindContribution } from "@/kernel/source-kinds"
import type { PdfNodeData, PdfAnnotation } from "@/kernel/entities"
import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"

interface PdfExtractDeps {
  blobStorage: BlobStoragePort
}

/**
 * Snapshot of the PdfNode's viewer state at the time the cell ran.
 * Frozen so cell code can't accidentally mutate canvas state.
 */
type PdfViewerStateSnapshot = Readonly<{
  currentPage: number
  totalPages: number
  filename: string
  annotations: ReadonlyArray<PdfAnnotation>
  zoomLevel: number
  darkMode: boolean
}>

type PdfRawArtifact = {
  bytes: ArrayBuffer | Uint8Array
  viewerState: PdfViewerStateSnapshot
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
    const bytes = await blob.arrayBuffer()
    // Bundle the raw bytes with a snapshot of the PdfNode's viewer state.
    // The cell author sees both the real pdf.js Document API and the
    // canvas-side viewer state (current page, annotations, ...) through
    // the same binding — see parse() for how the augmentation lands.
    const artifact: PdfRawArtifact = {
      bytes,
      viewerState: Object.freeze({
        currentPage: pdfNode.currentPage,
        totalPages: pdfNode.totalPages,
        filename: pdfNode.filename,
        annotations: Object.freeze([...pdfNode.annotations]),
        zoomLevel: pdfNode.zoomLevel,
        darkMode: pdfNode.darkMode,
      }),
    }
    return artifact
  },

  parse: async (rawArtifact: unknown, libraryHandle: unknown) => {
    if (
      typeof rawArtifact !== "object" ||
      rawArtifact === null ||
      !("bytes" in rawArtifact) ||
      !("viewerState" in rawArtifact)
    ) {
      throw new Error(`pdf source kind: expected { bytes, viewerState } artifact, got ${typeof rawArtifact}`)
    }
    const { bytes, viewerState } = rawArtifact as PdfRawArtifact
    if (!(bytes instanceof ArrayBuffer) && !(bytes instanceof Uint8Array)) {
      throw new Error(`pdf source kind: expected ArrayBuffer or Uint8Array bytes, got ${typeof bytes}`)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfjs = libraryHandle as any
    const data = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes
    const loadingTask = pdfjs.getDocument({ data })
    const doc = await loadingTask.promise
    // Augment the real pdf.js Document with the canvas-side viewer state.
    // The cell author binds to the same Document they'd get from
    // `pdfjs.getDocument(...).promise`, plus one extra read-only property
    // exposing the user's current viewing context. No wrapper hides the
    // pdf.js API.
    doc.viewerState = viewerState
    return doc
  },

  typeDefFragment: `/**
 * pdf.js Document object — the real thing the pdfjs-dist library returns
 * from getDocument().promise, augmented with one extra property: viewerState,
 * a snapshot of the PdfNode's current viewing context on the canvas.
 *
 * Cell authors call pdf.js methods directly:
 *
 *     const pdf = input.paper
 *     const page = await pdf.getPage(pdf.viewerState.currentPage)
 *     const tc = await page.getTextContent()
 *     return tc.items.map(i => i.str).join(' ')
 *
 * For the full pdf.js API surface see the pdf.js documentation. The shape
 * below is a working subset for IntelliSense.
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
  /**
   * Snapshot of the PdfNode's viewer state at the moment this cell ran.
   * Frozen — mutations have no effect on the canvas.
   */
  readonly viewerState: {
    /** 1-indexed page the user is currently viewing. */
    readonly currentPage: number
    /** Total page count (mirrors numPages, included for convenience). */
    readonly totalPages: number
    /** Original PDF filename. */
    readonly filename: string
    /** Regions the user has annotated on the PDF, in document order. */
    readonly annotations: ReadonlyArray<{
      readonly id: string
      readonly page: number
      readonly region: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
      readonly label: string
      readonly text: string
    }>
    /** PDF viewer zoom level (1 = 100%). */
    readonly zoomLevel: number
    /** Whether the PDF viewer is in dark mode. */
    readonly darkMode: boolean
  }
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
